import { useMemo, useState, type ReactNode } from 'react';
import type { DNANode } from '../utils/cascadeUtils';

const TYPE_COLORS: Record<string, string> = {
  power: '#F59E0B',
  water: '#06B6D4',
  transport: '#10B981',
  telecom: '#8B5CF6',
  emergency: '#EF4444',
};

function clampName(name: string): string {
  return name.length > 26 ? `${name.slice(0, 23)}...` : name;
}

function statusColor(status: string): string {
  if (status === 'operational') return '#22c55e';
  if (status === 'degraded') return '#f59e0b';
  if (status === 'failed' || status === 'critical') return '#ef4444';
  return '#94a3b8';
}

function probabilityStyle(prob: number): { background: string; color: string } {
  if (prob > 75) return { background: 'rgba(239, 68, 68, 0.24)', color: '#fecaca' };
  if (prob > 45) return { background: 'rgba(245, 158, 11, 0.24)', color: '#fde68a' };
  return { background: 'rgba(6, 182, 212, 0.2)', color: '#a5f3fc' };
}

function flatten(node: DNANode): DNANode[] {
  const list: DNANode[] = [];
  const walk = (n: DNANode) => {
    list.push(n);
    n.children.forEach(walk);
  };
  walk(node);
  return list;
}

interface DNATreeViewProps {
  root: DNANode;
  monsoonActive?: boolean;
}

export default function DNATreeView({ root, monsoonActive = false }: DNATreeViewProps) {
  const initialOpen = useMemo(() => {
    const open = new Set<string>();
    for (const node of flatten(root)) {
      if (node.depth <= 1) open.add(node.nodeId);
    }
    return open;
  }, [root]);

  const [openNodeIds, setOpenNodeIds] = useState<Set<string>>(initialOpen);

  const toggle = (nodeId: string) => {
    setOpenNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const renderNode = (node: DNANode): ReactNode[] => {
    const color = TYPE_COLORS[node.type] || '#64748b';
    const isOpen = openNodeIds.has(node.nodeId);
    const hasChildren = node.children.length > 0;
    const probStyle = probabilityStyle(node.cascadeProb);

    const rows: ReactNode[] = [
      <div
        key={node.nodeId}
        role="button"
        tabIndex={0}
        onClick={() => hasChildren && toggle(node.nodeId)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasChildren) {
            e.preventDefault();
            toggle(node.nodeId);
          }
        }}
        className="flex items-center justify-between rounded px-2 py-1.5 mb-1"
        style={{
          marginLeft: `${node.depth * 18}px`,
          borderLeft: `2px solid ${color}`,
          background: 'rgba(15, 23, 42, 0.35)',
          cursor: hasChildren ? 'pointer' : 'default',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: statusColor(node.status) }}
          />
          <span className="text-xs text-slate-200 truncate" title={node.name}>
            {hasChildren ? (isOpen ? '▾ ' : '▸ ') : ''}
            {clampName(node.name)}
          </span>
        </div>
        <span
          className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: probStyle.background, color: probStyle.color }}
        >
          {node.cascadeProb.toFixed(1)}%
        </span>
      </div>,
    ];

    if (hasChildren && isOpen) {
      node.children.forEach((child) => {
        rows.push(...renderNode(child));
      });
    }

    return rows;
  };

  return (
    <div className="space-y-2">
      <div>{renderNode(root)}</div>
      {root.children.length === 0 && (
        <div className="text-xs text-slate-500">No cascade paths from this node.</div>
      )}
      {monsoonActive && (
        <div className="text-xs" style={{ color: '#f59e0b' }}>
          ⚠ Monsoon active — flood zone probabilities multiplied ×1.4
        </div>
      )}
    </div>
  );
}
