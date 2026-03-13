import { useState, useMemo } from 'react';
import { X, GitBranch, Zap, AlertTriangle } from 'lucide-react';
import { SECTOR_COLORS, SECTOR_LABELS, STATUS_COLORS } from '../../types';
import type { InfrastructureNode, Dependency } from '../../types';
import { runBFSSimulate, type BFSSimulateResult } from '../../api/simulation';

interface NodeDetailPanelProps {
  node: InfrastructureNode & { color?: string };
  onClose: () => void;
  onAnalyzeCascade?: (nodeId: string) => void;
  dependencies?: Dependency[];
  allNodes?: InfrastructureNode[];
}

export default function NodeDetailPanel({
  node,
  onClose,
  onAnalyzeCascade,
  dependencies,
  allNodes,
}: NodeDetailPanelProps) {
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<BFSSimulateResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const color = SECTOR_COLORS[node.type] || '#6B7280';
  const statusColor = STATUS_COLORS[node.status] || '#10B981';
  const loadRatio = node.capacity > 0 ? node.currentLoad / node.capacity : 0;

  const uptimePct =
    node.status === 'operational'  ? Math.max(85, Math.round(100 - loadRatio * 15)) :
    node.status === 'degraded'     ? 60 :
    node.status === 'maintenance'  ? 25 :
    node.status === 'failed'       ? 0  : 50;

  const zone = node.zone ?? (node.properties?.zone as string | undefined) ?? 'Mumbai';

  /* Downstream cascade DNA — outgoing deps sorted by cascade probability */
  const dnaTree = useMemo(() => {
    if (!dependencies || !allNodes) return [];
    return dependencies
      .filter((d) => {
        const srcId = typeof d.sourceNodeId === 'string'
          ? d.sourceNodeId
          : (d.sourceNodeId as InfrastructureNode)._id;
        return srcId === node._id;
      })
      .map((d) => {
        const tgtId = typeof d.targetNodeId === 'string'
          ? d.targetNodeId
          : (d.targetNodeId as InfrastructureNode)._id;
        const target = allNodes.find((n) => n._id === tgtId);
        return {
          id: tgtId,
          name: target?.name ?? tgtId,
          type: target?.type ?? 'unknown',
          depType: d.dependencyType,
          cascadeProb: Math.min(99, Math.round(d.strength * ((target?.criticalityScore ?? 50) / 100) * 100)),
        };
      })
      .sort((a, b) => b.cascadeProb - a.cascadeProb)
      .slice(0, 8);
  }, [dependencies, allNodes, node._id]);

  const handleSimulate = async () => {
    setSimulating(true);
    setSimResult(null);
    setSimError(null);
    try {
      const result = await runBFSSimulate(node._id, 0.8, 0.3);
      setSimResult(result);
    } catch {
      setSimError('Simulation failed. Ensure backend is running.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{node.name}</h3>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {SECTOR_LABELS[node.type] || node.type}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Zone */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Zone</label>
          <p className="text-sm text-white mt-1">{zone}</p>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Status</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-sm text-white capitalize">{node.status}</span>
          </div>
        </div>

        {/* Subtype */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Type</label>
          <p className="text-sm text-white capitalize mt-1">{node.subtype?.replace(/_/g, ' ')}</p>
        </div>

        {/* Criticality */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Criticality Score</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${node.criticalityScore}%`,
                  backgroundColor: node.criticalityScore > 80 ? '#EF4444' : node.criticalityScore > 60 ? '#F59E0B' : '#10B981',
                }}
              />
            </div>
            <span className="text-sm font-mono text-white">{node.criticalityScore}</span>
          </div>
        </div>

        {/* Uptime */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Uptime</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${uptimePct}%`,
                  backgroundColor: uptimePct >= 80 ? '#22d97a' : uptimePct >= 50 ? '#f0a500' : '#ff3355',
                }}
              />
            </div>
            <span className="text-sm font-mono text-white">{uptimePct}%</span>
          </div>
        </div>

        {/* Load */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Current Load</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.round(loadRatio * 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="text-sm font-mono text-white">{node.currentLoad}/{node.capacity}</span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Location</label>
          <p className="text-sm text-slate-300 font-mono mt-1">
            {node.location.lat.toFixed(4)}, {node.location.lng.toFixed(4)}
          </p>
        </div>

        {/* Failure DNA tree */}
        {dependencies && allNodes && (
          <div>
            <label className="text-xs text-slate-500 uppercase flex items-center gap-1.5 mb-2">
              <GitBranch className="w-3 h-3" />
              Failure DNA
              <span className="font-normal normal-case text-slate-600 ml-1">(downstream cascade risk)</span>
            </label>
            {dnaTree.length > 0 ? (
              <div className="space-y-1.5">
                {dnaTree.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs rounded px-2 py-1.5"
                    style={{ backgroundColor: `${SECTOR_COLORS[item.type] || '#6B7280'}12` }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: SECTOR_COLORS[item.type] || '#6B7280' }}
                      />
                      <span className="text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span
                      className="font-mono font-bold ml-2 flex-shrink-0"
                      style={{
                        color: item.cascadeProb >= 70 ? '#ff3355' : item.cascadeProb >= 40 ? '#f0a500' : '#22d97a',
                      }}
                    >
                      {item.cascadeProb}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No outgoing dependencies found.</p>
            )}
          </div>
        )}

        {/* BFS Simulation result */}
        {simResult && (
          <div className="rounded-lg p-3 bg-red-900/20 border border-red-500/30">
            <div className="text-xs font-semibold text-red-400 uppercase flex items-center gap-1.5 mb-2">
              <Zap className="w-3 h-3" /> BFS Simulation Result
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Affected nodes</span>
                <span className="font-mono text-orange-400">{simResult.affectedNodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Population impact</span>
                <span className="font-mono text-orange-400">{simResult.populationImpactPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. recovery</span>
                <span className="font-mono text-orange-400">{simResult.recoveryHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cascade depth</span>
                <span className="font-mono text-orange-400">{simResult.propagationSteps.length} steps</span>
              </div>
            </div>
          </div>
        )}

        {simError && (
          <div className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {simError}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="w-full px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            {simulating ? 'Simulating…' : 'Simulate Failure'}
          </button>
          {onAnalyzeCascade && (
            <button
              onClick={() => onAnalyzeCascade(node._id)}
              className="w-full px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <GitBranch className="w-4 h-4" />
              Open in Cascade Analyzer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
