import { X, ExternalLink } from 'lucide-react';
import { SECTOR_COLORS, SECTOR_LABELS, STATUS_COLORS } from '../../types';
import type { InfrastructureNode } from '../../types';

interface NodeDetailPanelProps {
  node: InfrastructureNode & { color?: string };
  onClose: () => void;
  onAnalyzeCascade?: (nodeId: string) => void;
}

export default function NodeDetailPanel({ node, onClose, onAnalyzeCascade }: NodeDetailPanelProps) {
  const color = SECTOR_COLORS[node.type] || '#6B7280';
  const statusColor = STATUS_COLORS[node.status] || '#10B981';

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

      {/* Details */}
      <div className="p-4 space-y-4">
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

        {/* Load */}
        <div>
          <label className="text-xs text-slate-500 uppercase">Load</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${(node.currentLoad / Math.max(1, node.capacity)) * 100}%`,
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

        {/* Properties */}
        {node.properties && Object.keys(node.properties).length > 0 && (
          <div>
            <label className="text-xs text-slate-500 uppercase">Properties</label>
            <div className="mt-1 space-y-1">
              {Object.entries(node.properties).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {onAnalyzeCascade && (
          <button
            onClick={() => onAnalyzeCascade(node._id)}
            className="w-full mt-4 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Simulate Failure
          </button>
        )}
      </div>
    </div>
  );
}
