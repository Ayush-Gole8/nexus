import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Route } from 'lucide-react';
import { getNodes } from '../api/infrastructure';
import { simulateIncident, type EmergencyETA, type SimulateIncidentResult } from '../api/emergency';
import type { InfrastructureNode } from '../types';
import GoldenHourBar from '../components/GoldenHourBar';
import { useNodeStatusStream } from '../hooks/useNodeStatusStream';

type ServiceType = 'fire' | 'ambulance' | 'police';

const SERVICE_META: Record<ServiceType, { icon: string; label: string }> = {
  fire: { icon: '🚒', label: 'Fire Service' },
  ambulance: { icon: '🚑', label: 'Ambulance' },
  police: { icon: '🚓', label: 'Police' },
};

function getBarColor(pct: number) {
  if (pct < 50) return '#10B981';
  if (pct < 75) return '#F59E0B';
  return '#EF4444';
}

export default function EmergencyResponse() {
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [selectedIncidentNodeId, setSelectedIncidentNodeId] = useState('');
  const [selectedType, setSelectedType] = useState('incident');
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [loadingETAs, setLoadingETAs] = useState(false);
  const [etaResults, setEtaResults] = useState<SimulateIncidentResult | null>(null);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<ServiceType, boolean>>({
    fire: false,
    ambulance: false,
    police: false,
  });

  useEffect(() => {
    setLoadingNodes(true);
    getNodes()
      .then((n) => {
        setNodes(n);
        if (n.length > 0) setSelectedIncidentNodeId(n[0]._id);
      })
      .catch(console.error)
      .finally(() => setLoadingNodes(false));
  }, []);

  const refetchAllETAs = useCallback(
    async (incidentNodeId: string) => {
      if (!incidentNodeId) return;
      setLoadingETAs(true);
      try {
        const data = await simulateIncident(incidentNodeId, 'generic');
        setEtaResults(data);
      } catch (err) {
        console.error('Incident simulation failed:', err);
      } finally {
        setLoadingETAs(false);
      }
    },
    [],
  );

  const nodeById = useMemo(() => {
    const m = new Map<string, InfrastructureNode>();
    nodes.forEach((n) => m.set(n._id, n));
    return m;
  }, [nodes]);

  useNodeStatusStream(
    useCallback(
      (_nodeId, _newStatus, type) => {
        if (type === 'transport' && selectedIncidentNodeId) {
          refetchAllETAs(selectedIncidentNodeId);
        }
      },
      [refetchAllETAs, selectedIncidentNodeId],
    ),
    useCallback(
      (node: Partial<InfrastructureNode>) => {
        if (!node._id) return;
        setNodes((prev) => {
          if (prev.some((n) => n._id === node._id)) return prev;
          return [...prev, node as InfrastructureNode];
        });
      },
      [],
    ),
  );

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
                value={selectedIncidentNodeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedIncidentNodeId(id);
                }}
                className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm text-white"
              >
                {nodes.map((n) => (
                  <option key={n._id} value={n._id}>{n.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => refetchAllETAs(selectedIncidentNodeId)}
              disabled={!selectedIncidentNodeId || loadingNodes || loadingETAs}
              className="w-full px-3 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 disabled:opacity-60"
            >
              {loadingETAs ? 'Refreshing ETAs...' : 'Simulate Incident'}
            </button>
          </div>

          {etaResults?.summary.totalBlockedNodes.length ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Infrastructure Impact Warning</p>
                  <p className="text-xs text-red-200/80 mt-1">
                    {etaResults.summary.totalBlockedNodes.length} degraded/blocked transport node(s) are affecting emergency routing.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {!etaResults && !loadingETAs ? (
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
              Select an incident node to generate service response cards.
            </div>
          ) : (
            (['fire', 'ambulance', 'police'] as ServiceType[]).map((serviceKey) => {
              if (loadingETAs || !etaResults) {
                return <ServiceCardSkeleton key={serviceKey} />;
              }
              return (
                <ServiceCard
                  key={serviceKey}
                  eta={etaResults.services[serviceKey]}
                  nodeById={nodeById}
                  expanded={expandedBreakdowns[serviceKey]}
                  onToggleBreakdown={() =>
                    setExpandedBreakdowns((prev) => ({ ...prev, [serviceKey]: !prev[serviceKey] }))
                  }
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  eta,
  nodeById,
  expanded,
  onToggleBreakdown,
}: {
  eta: EmergencyETA;
  nodeById: Map<string, InfrastructureNode>;
  expanded: boolean;
  onToggleBreakdown: () => void;
}) {
  const meta = SERVICE_META[eta.serviceType];
  const barColor = getBarColor(eta.goldenHourPct);
  const baseName = eta.nearestBase?.name || eta.serviceBase?.name || 'Unknown base';

  const routeNodes = eta.routeNodes.map((id) => ({
    id,
    name: nodeById.get(id)?.name || id,
    blocked: eta.blockedNodes.includes(id),
  }));

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-slate-900/80">
            {meta.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{meta.label}</p>
            <p className="text-xs text-slate-500 truncate">Base: {baseName}</p>
          </div>
        </div>
      </div>

      <div className="text-sm">
        {eta.baseETA !== eta.adjustedETA ? (
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ color: '#94A3B8' }}>Base: {eta.baseETA.toFixed(1)} min</span>
            <span style={{ color: barColor, fontWeight: 700 }}>Adjusted: {eta.adjustedETA.toFixed(1)} min</span>
            <span style={{ color: '#F59E0B' }}>+{eta.penaltyMinutes.toFixed(1)} min - infrastructure delay</span>
          </div>
        ) : (
          <span style={{ color: barColor, fontWeight: 700 }}>{eta.adjustedETA.toFixed(1)} min</span>
        )}
      </div>

      <GoldenHourBar pct={eta.goldenHourPct} />

      <div className="bg-slate-900/40 rounded-lg p-3">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5" /> ROUTE
        </p>
        {routeNodes.length === 0 ? (
          <p className="text-xs text-slate-500">No route nodes nearby.</p>
        ) : (
          <ol className="space-y-1 list-decimal list-inside">
            {routeNodes.map((n) => (
              <li key={n.id} className="text-xs">
                <span
                  style={{
                    color: n.blocked ? '#EF4444' : '#FFFFFF',
                    textDecoration: n.blocked ? 'line-through' : 'none',
                  }}
                >
                  {n.name}
                </span>
                {n.blocked ? <span style={{ color: '#EF4444' }}> {' '}⚠ BLOCKED</span> : null}
              </li>
            ))}
          </ol>
        )}
      </div>

      {eta.altRouteNames.length > 0 ? (
        <div className="text-xs">
          <div style={{ color: '#F59E0B', fontWeight: 700, letterSpacing: '0.06em' }}>ALTERNATE VIA</div>
          <div style={{ color: '#E2E8F0', marginTop: 4 }}>{eta.altRouteNames.join(' → ')}</div>
        </div>
      ) : null}

      <div>
        <button
          type="button"
          onClick={onToggleBreakdown}
          className="text-xs font-medium text-slate-300 hover:text-white"
        >
          {expanded ? 'Hide ▴' : 'Show delay breakdown ▾'}
        </button>

        {expanded ? (
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/70 text-slate-400">
                <tr>
                  <th className="text-left px-2 py-2">Name</th>
                  <th className="text-left px-2 py-2">Zone</th>
                  <th className="text-left px-2 py-2">Status</th>
                  <th className="text-right px-2 py-2">+min</th>
                </tr>
              </thead>
              <tbody>
                {eta.penaltyBreakdown.length === 0 ? (
                  <tr>
                    <td className="px-2 py-2 text-slate-500" colSpan={4}>No delays on route.</td>
                  </tr>
                ) : (
                  eta.penaltyBreakdown.map((row) => (
                    <tr key={row.nodeId} className="border-t border-slate-800 text-slate-200">
                      <td className="px-2 py-2">{row.name}</td>
                      <td className="px-2 py-2">{row.zone}</td>
                      <td className="px-2 py-2 capitalize">{row.status}</td>
                      <td className="px-2 py-2 text-right" style={{ color: '#F59E0B' }}>{row.penaltyMinutes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="text-xs text-slate-500">
        Distance: <span className="text-slate-300 font-mono">{eta.distanceKm.toFixed(2)} km</span>
      </div>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3 animate-pulse">
      <div className="h-6 bg-slate-700 rounded w-1/3" />
      <div className="h-4 bg-slate-700 rounded w-2/3" />
      <div className="h-3 bg-slate-700 rounded w-full" />
      <div className="h-24 bg-slate-700 rounded" />
      <div className="h-10 bg-slate-700 rounded" />
    </div>
  );
}
