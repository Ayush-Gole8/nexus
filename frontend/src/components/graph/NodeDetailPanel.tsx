import { useMemo } from 'react';
import { X, GitBranch, Zap } from 'lucide-react';
import { SECTOR_COLORS, SECTOR_LABELS, STATUS_COLORS } from '../../types';
import type { InfrastructureNode, Dependency } from '../../types';
import DNATreeView from '../DNATreeView';
import { computeFailureDNA } from '../../utils/cascadeUtils';

interface NodeDetailPanelProps {
  node: InfrastructureNode & { color?: string };
  onClose: () => void;
  onAnalyzeCascade?: (nodeId: string) => void;
  allNodes?: InfrastructureNode[];
  allEdges?: Dependency[];
  monsoonActive?: boolean;
  floodZoneIds?: Set<string>;
  onSimulate?: (nodeId: string) => void;
}

export default function NodeDetailPanel({
  node,
  onClose,
  onAnalyzeCascade,
  allNodes = [],
  allEdges = [],
  monsoonActive = false,
  floodZoneIds = new Set<string>(),
  onSimulate,
}: NodeDetailPanelProps) {
  const color = SECTOR_COLORS[node.type] || '#6B7280';
  const statusColor = STATUS_COLORS[node.status] || '#10B981';
  const loadRatio = node.capacity > 0 ? node.currentLoad / node.capacity : 0;

  const uptimePct =
    node.status === 'operational' ? Math.max(85, Math.round(100 - loadRatio * 15)) :
    node.status === 'degraded' ? 60 :
    node.status === 'maintenance' ? 25 :
    node.status === 'failed' ? 0 : 50;

  const zone = node.zone ?? (node.properties?.zone as string | undefined) ?? 'Mumbai';

  const dna = useMemo(
    () => computeFailureDNA(node._id, allNodes, allEdges, monsoonActive, floodZoneIds),
    [node._id, allNodes, allEdges, monsoonActive, floodZoneIds],
  );

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">
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
        <div>
          <label className="text-xs text-slate-500 uppercase">Zone</label>
          <p className="text-sm text-white mt-1">{zone}</p>
        </div>

        <div>
          <label className="text-xs text-slate-500 uppercase">Status</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-sm text-white capitalize">{node.status}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 uppercase">Type</label>
          <p className="text-sm text-white capitalize mt-1">{node.subtype?.replace(/_/g, ' ')}</p>
        </div>

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

        <div>
          <label className="text-xs text-slate-500 uppercase">Location</label>
          <p className="text-sm text-slate-300 font-mono mt-1">
            {node.location.lat.toFixed(4)}, {node.location.lng.toFixed(4)}
          </p>
        </div>

        <div className="rounded-lg p-3 bg-slate-800/50 border border-slate-700">
          <label className="text-xs text-slate-400 uppercase flex items-center gap-1.5 mb-2">
            <GitBranch className="w-3 h-3" />
            FAILURE CASCADE DNA
          </label>
          <DNATreeView root={dna} monsoonActive={monsoonActive} />
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => onSimulate?.(node._id)}
            className="w-full px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Simulate Failure
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
