import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Activity, Waves, PlugZap, Droplets, TrainFront, RadioTower } from 'lucide-react';
import MumbaiMap3D from '../components/map3d/MumbaiMap3D';
import { getNodes, getDependencies } from '../api/infrastructure';
import { runBFSSimulate, type BFSSimulateResult } from '../api/simulation';
import type { InfrastructureNode, Dependency } from '../types';
import { SECTOR_COLORS } from '../types';

type ScenarioCard = {
  id: 'power' | 'water' | 'transport' | 'telecom' | 'weather';
  label: string;
  icon: React.ComponentType<any>;
  color: string;
};

const SCENARIO_CARDS: ScenarioCard[] = [
  { id: 'power', label: 'Power', icon: PlugZap, color: '#ffe234' },
  { id: 'water', label: 'Water', icon: Droplets, color: '#00d4b8' },
  { id: 'transport', label: 'Transport', icon: TrainFront, color: '#ff6b2b' },
  { id: 'telecom', label: 'Telecom', icon: RadioTower, color: '#7b68ff' },
  { id: 'weather', label: 'Weather', icon: Waves, color: '#4ea7ff' },
];

interface PropagationLogEntry {
  timestamp: string;
  step: number;
  message: string;
}

export default function ScenarioSimulator() {
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [activeScenario, setActiveScenario] = useState<ScenarioCard['id']>('power');
  const [originNodeId, setOriginNodeId] = useState('');
  const [magnitude, setMagnitude] = useState(80);
  const [resilience, setResilience] = useState(30);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BFSSimulateResult | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [highlightedBatch, setHighlightedBatch] = useState<Set<string>>(new Set());
  const [logEntries, setLogEntries] = useState<PropagationLogEntry[]>([]);

  const timerRef = useRef<number | null>(null);

  const loadData = useCallback(async () => {
    const [nodeList, depList] = await Promise.all([getNodes(), getDependencies()]);
    setNodes(nodeList);
    setDependencies(depList);
    if (nodeList.length > 0) setOriginNodeId((prev) => prev || nodeList[0]._id);
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [loadData]);

  const scenarioNodes = useMemo(() => {
    if (activeScenario === 'weather') return nodes;
    return nodes.filter((n) => n.type === activeScenario);
  }, [nodes, activeScenario]);

  const appendLog = (step: number, batch: string[]) => {
    const names = batch
      .map((id) => nodes.find((n) => n._id === id)?.name || id)
      .slice(0, 4)
      .join(', ');
    const suffix = batch.length > 4 ? ` +${batch.length - 4} more` : '';

    setLogEntries((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        step,
        message: `Step ${step}: propagated to ${batch.length} node(s) — ${names}${suffix}`,
      },
    ]);
  };

  const animatePropagation = (sim: BFSSimulateResult) => {
    if (timerRef.current) window.clearInterval(timerRef.current);

    setCurrentStep(-1);
    setHighlightedBatch(new Set());
    setLogEntries([]);

    let step = 0;
    timerRef.current = window.setInterval(() => {
      if (step >= sim.propagationSteps.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setHighlightedBatch(new Set());
        return;
      }

      const batch = sim.propagationSteps[step] || [];
      setCurrentStep(step);
      setHighlightedBatch(new Set(batch));
      appendLog(step, batch);
      step += 1;
    }, 600);
  };

  const handleRun = async () => {
    if (!originNodeId) return;
    setRunning(true);
    try {
      const sim = await runBFSSimulate(originNodeId, magnitude / 100, resilience / 100);
      setResult(sim);
      animatePropagation(sim);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scenario Simulator</h1>
          <p className="text-sm text-slate-400 mt-1">Run BFS propagation from an origin node and animate each cascade step on the 3D city map</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4 h-[calc(100%-56px)]">
        <div className="space-y-3 overflow-y-auto pr-1">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scenario Cards</h3>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIO_CARDS.map((card) => {
                const Icon = card.icon;
                const active = activeScenario === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setActiveScenario(card.id)}
                    className="rounded-lg px-2.5 py-2 text-left border transition-colors"
                    style={{
                      borderColor: active ? `${card.color}88` : '#334155',
                      background: active ? `${card.color}18` : 'rgba(15, 23, 42, 0.35)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: card.color }} />
                      <span className="text-xs font-medium" style={{ color: active ? card.color : '#cbd5e1' }}>
                        {card.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuration</h3>

            <div>
              <label className="text-[11px] text-slate-400">Origin Node</label>
              <select
                value={originNodeId}
                onChange={(e) => setOriginNodeId(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-xs text-white"
              >
                {scenarioNodes.map((n) => (
                  <option key={n._id} value={n._id}>{n.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Magnitude</span>
                <span className="font-mono text-white">{magnitude}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={magnitude}
                onChange={(e) => setMagnitude(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Resilience</span>
                <span className="font-mono text-white">{resilience}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={resilience}
                onChange={(e) => setResilience(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={handleRun}
              disabled={running || !originNodeId}
              className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {running ? 'Running...' : 'Run Simulation'}
            </button>
          </div>

          {result && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-700/40 rounded p-2 text-center">
                  <div className="text-lg font-bold text-red-400">{result.affectedNodes.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Affected Nodes</div>
                </div>
                <div className="bg-slate-700/40 rounded p-2 text-center">
                  <div className="text-lg font-bold text-orange-400">{result.propagationSteps.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Cascade Depth</div>
                </div>
                <div className="bg-slate-700/40 rounded p-2 text-center">
                  <div className="text-lg font-bold text-blue-400">{result.populationImpactPct.toFixed(1)}%</div>
                  <div className="text-[10px] text-slate-500 uppercase">Pop. Impact</div>
                </div>
                <div className="bg-slate-700/40 rounded p-2 text-center">
                  <div className="text-lg font-bold text-cyan-400">{result.recoveryHours}h</div>
                  <div className="text-[10px] text-slate-500 uppercase">Recovery</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 pt-1">Current animation step: <span className="text-slate-300 font-mono">{Math.max(0, currentStep)}</span></div>
            </div>
          )}

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Propagation Log</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {logEntries.length === 0 ? (
                <div className="text-xs text-slate-500">No events yet.</div>
              ) : logEntries.map((entry, idx) => (
                <div key={`${entry.timestamp}-${idx}`} className="text-xs text-slate-300 bg-slate-700/30 rounded px-2 py-1.5">
                  <span className="text-slate-500 mr-2 font-mono">[{entry.timestamp}]</span>
                  {entry.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-[rgba(60,40,40,0.4)] rounded-xl overflow-hidden relative" style={{ background: '#050810' }}>
          <MumbaiMap3D
            nodes={nodes}
            dependencies={dependencies}
            sectorFilter="all"
            statusFilter="all"
            highlightedNodeIds={highlightedBatch}
          />

          <div className="absolute top-3 left-3 text-xs text-slate-400 bg-slate-900/70 border border-slate-700 rounded px-2 py-1 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" style={{ color: SECTOR_COLORS[activeScenario === 'weather' ? 'transport' : activeScenario] || '#f43f5e' }} />
            <span>Step animation: 600ms batch highlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
