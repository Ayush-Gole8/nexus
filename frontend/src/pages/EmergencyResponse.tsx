import { useEffect, useMemo, useState } from 'react';
import { Flame, Ambulance, Shield, AlertTriangle, Navigation, Route } from 'lucide-react';
import { getNodes } from '../api/infrastructure';
import { simulateIncident, type EmergencyETA, type SimulateIncidentResult } from '../api/emergency';
import type { InfrastructureNode } from '../types';
import { STATUS_COLORS } from '../types';

type ServiceType = 'fire' | 'ambulance' | 'police';

const SERVICE_META: Record<ServiceType, { icon: React.ComponentType<any>; color: string; label: string }> = {
  fire: { icon: Flame, color: '#ff6b2b', label: 'Fire Service' },
  ambulance: { icon: Ambulance, color: '#22d97a', label: 'Ambulance' },
  police: { icon: Shield, color: '#7b68ff', label: 'Police' },
};

export default function EmergencyResponse() {
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [selectedType, setSelectedType] = useState('incident');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateIncidentResult | null>(null);

  useEffect(() => {
    getNodes().then((n) => {
      setNodes(n);
      if (n.length > 0) setSelectedNode(n[0]._id);
    }).catch(console.error);
  }, []);

  const nodeById = useMemo(() => {
    const m = new Map<string, InfrastructureNode>();
    nodes.forEach((n) => m.set(n._id, n));
    return m;
  }, [nodes]);

  const runSimulation = async (nodeId: string) => {
    if (!nodeId) return;
    setLoading(true);
    try {
      const data = await simulateIncident(nodeId, selectedType);
      setResult(data);
    } catch (err) {
      console.error('Incident simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Emergency Response</h1>
        <p className="text-sm text-slate-400 mt-1">Select an incident node to simulate fire, ambulance, and police ETAs with route constraints</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400">Incident Setup</h3>

            <div>
              <label className="text-xs text-slate-400">Incident Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm text-white"
              >
                <option value="incident">General Incident</option>
                <option value="fire">Fire</option>
                <option value="medical">Medical</option>
                <option value="security">Security</option>
                <option value="disaster">Disaster</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Incident Node</label>
              <select
                value={selectedNode}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedNode(id);
                  runSimulation(id);
                }}
                className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm text-white"
              >
                {nodes.map((n) => (
                  <option key={n._id} value={n._id}>{n.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => runSimulation(selectedNode)}
              disabled={!selectedNode || loading}
              className="w-full px-3 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? 'Simulating incident...' : 'Simulate Incident'}
            </button>
          </div>

          {result?.summary.totalBlockedNodes.length ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Infrastructure Impact Warning</p>
                  <p className="text-xs text-red-200/80 mt-1">
                    {result.summary.totalBlockedNodes.length} degraded/blocked transport node(s) are affecting emergency routing.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {!result ? (
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
              Select an incident node to generate service response cards.
            </div>
          ) : (
            (Object.keys(result.services) as ServiceType[]).map((serviceKey) => (
              <ServiceCard
                key={serviceKey}
                eta={result.services[serviceKey]}
                nodeById={nodeById}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  eta,
  nodeById,
}: {
  eta: EmergencyETA;
  nodeById: Map<string, InfrastructureNode>;
}) {
  const meta = SERVICE_META[eta.serviceType];
  const Icon = meta.icon;

  const routeNodes = eta.routeNodes.map((id) => ({
    id,
    name: nodeById.get(id)?.name || id,
    blocked: eta.blockedNodes.includes(id),
  }));

  const altRoute = eta.altRoute.map((id) => nodeById.get(id)?.name || id);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}20` }}>
            <Icon className="w-5 h-5" style={{ color: meta.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{meta.label}</p>
            <p className="text-xs text-slate-500">Base: {eta.serviceBase.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: meta.color }}>{eta.adjustedETA.toFixed(1)} min</p>
          <p className="text-[10px] text-slate-500">ETA</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Golden hour pressure</span>
          <span className="font-mono text-white">{eta.goldenHourPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, eta.goldenHourPct)}%`,
              background: eta.goldenHourPct > 85 ? '#ff3355' : eta.goldenHourPct > 60 ? '#f0a500' : '#22d97a',
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-lg p-3">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5" /> Route Steps
        </p>
        {routeNodes.length === 0 ? (
          <p className="text-xs text-slate-500">No route nodes nearby.</p>
        ) : (
          <div className="space-y-1">
            {routeNodes.map((n, idx) => (
              <div key={n.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate">{idx + 1}. {n.name}</span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: n.blocked ? 'rgba(255,51,85,0.2)' : 'rgba(34,217,122,0.2)',
                    color: n.blocked ? '#ff3355' : '#22d97a',
                  }}
                >
                  {n.blocked ? 'blocked' : 'open'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 flex items-start gap-2">
        <Navigation className="w-3.5 h-3.5 mt-0.5" />
        <span>
          {altRoute.length > 0
            ? `Alternate route candidates: ${altRoute.slice(0, 3).join(', ')}${altRoute.length > 3 ? '...' : ''}`
            : 'No alternate route candidates found.'}
        </span>
      </div>

      <div className="text-xs text-slate-500">
        Distance: <span className="text-slate-300 font-mono">{eta.distanceKm.toFixed(2)} km</span>
        <span className="mx-1">|</span>
        Penalty: <span className="text-slate-300 font-mono">+{eta.penaltyMinutes.toFixed(1)} min</span>
      </div>
    </div>
  );
}
