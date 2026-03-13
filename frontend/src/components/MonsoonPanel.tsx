import { useMemo } from 'react';
import type { InfrastructureNode } from '../types';
import { useMonsoon } from '../contexts/MonsoonContext';

function badgeStyle(prob: number): { background: string; color: string } {
  if (prob > 75) return { background: 'rgba(239, 68, 68, 0.24)', color: '#fecaca' };
  if (prob > 45) return { background: 'rgba(245, 158, 11, 0.24)', color: '#fde68a' };
  return { background: 'rgba(6, 182, 212, 0.2)', color: '#a5f3fc' };
}

function colorForRainfall(rainfall: number): string {
  if (rainfall > 200) return '#f87171';
  if (rainfall > 100) return '#f59e0b';
  return '#22c55e';
}

export default function MonsoonPanel({ nodes }: { nodes: InfrastructureNode[] }) {
  const { monsoonActive, rainfall_mm, setRainfall_mm, monsoonRiskMap, monsoonZones } = useMonsoon();

  const nodeMap = useMemo(() => {
    const map = new Map<string, InfrastructureNode>();
    nodes.forEach((n) => map.set(n._id, n));
    return map;
  }, [nodes]);

  const zoneByNodeId = useMemo(() => {
    const map = new Map<string, string>();
    monsoonZones.forEach((zone) => {
      zone.affectedNodeIds?.forEach((entry) => {
        const id = typeof entry === 'string' ? entry : entry?._id;
        if (id && !map.has(id)) map.set(id, zone.zoneName);
      });
    });
    return map;
  }, [monsoonZones]);

  const topRisk = useMemo(() => {
    return Array.from(monsoonRiskMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId, prob]) => {
        const node = nodeMap.get(nodeId);
        return {
          nodeId,
          prob,
          name: node?.name ?? nodeId,
          zone: zoneByNodeId.get(nodeId) ?? node?.zone ?? 'Mumbai',
        };
      });
  }, [monsoonRiskMap, nodeMap, zoneByNodeId]);

  if (!monsoonActive) return null;

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[280px] rounded-xl border p-3 shadow-2xl"
      style={{ background: 'rgba(10, 16, 32, 0.95)', borderColor: 'rgba(59, 130, 246, 0.35)' }}
    >
      <div className="text-[10px] tracking-[0.12em] text-slate-400">RAINFALL INTENSITY</div>
      <div className="mt-2">
        <input
          type="range"
          min={50}
          max={400}
          step={10}
          value={rainfall_mm}
          onChange={(e) => setRainfall_mm(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs font-semibold mt-1" style={{ color: colorForRainfall(rainfall_mm) }}>
          {rainfall_mm} mm/hr
        </div>
      </div>

      <div className="mt-3 text-[10px] tracking-[0.12em] text-slate-400">TOP RISK NODES</div>
      <div className="mt-2 space-y-1.5">
        {topRisk.length === 0 ? (
          <div className="text-xs text-slate-500">No risk data yet.</div>
        ) : (
          topRisk.map((row) => {
            const style = badgeStyle(row.prob);
            return (
              <div key={row.nodeId} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-slate-100 truncate">{row.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{row.zone}</div>
                </div>
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: style.background, color: style.color }}
                >
                  {row.prob.toFixed(1)}%
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 text-[11px] italic text-slate-500">
        Probabilities update 300ms after slider release
      </div>
    </div>
  );
}
