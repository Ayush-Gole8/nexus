import { useEffect, useState } from 'react';
import {
  Map, Activity, Zap, Droplets, Car, Wifi, Heart,
  AlertTriangle, Shield, Eye,
} from 'lucide-react';
import { getZoneResilience } from '../api/emergency';
import { SECTOR_COLORS } from '../types';

interface ZoneScore {
  zone: string;
  overallScore: number;
  sectorScores: Record<string, number>;
  nodeCount: number;
  failedCount: number;
  degradedCount: number;
}

// Approximate positions of Mumbai zones for the visual heatmap grid
const ZONE_POSITIONS: Record<string, { row: number; col: number; label: string }> = {
  'South Mumbai': { row: 4, col: 1, label: 'South\nMumbai' },
  'Lower Parel': { row: 3, col: 1, label: 'Lower\nParel' },
  'Dadar-Prabhadevi': { row: 2, col: 1, label: 'Dadar\nPrabhadevi' },
  'Bandra-Kurla': { row: 2, col: 2, label: 'BKC' },
  'Andheri': { row: 1, col: 1, label: 'Andheri' },
  'Powai': { row: 1, col: 2, label: 'Powai' },
  'Thane': { row: 0, col: 1, label: 'Thane' },
  'Navi Mumbai': { row: 3, col: 2, label: 'Navi\nMumbai' },
};

const SECTOR_ICONS: Record<string, React.ComponentType<any>> = {
  power: Zap,
  water: Droplets,
  transport: Car,
  telecom: Wifi,
  emergency: Heart,
};

function getHeatColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#84CC16';
  if (score >= 40) return '#F59E0B';
  if (score >= 20) return '#F97316';
  return '#EF4444';
}

function getHeatBg(score: number): string {
  if (score >= 80) return 'rgba(16,185,129,0.15)';
  if (score >= 60) return 'rgba(132,204,22,0.12)';
  if (score >= 40) return 'rgba(245,158,11,0.12)';
  if (score >= 20) return 'rgba(249,115,22,0.12)';
  return 'rgba(239,68,68,0.15)';
}

export default function ResilienceHeatmap() {
  const [zones, setZones] = useState<ZoneScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('overall');

  useEffect(() => {
    getZoneResilience()
      .then(setZones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-slate-400">Loading heatmap...</div>;
  }

  const getScore = (zone: ZoneScore) => {
    if (selectedSector === 'overall') return zone.overallScore;
    return zone.sectorScores[selectedSector] ?? zone.overallScore;
  };

  const totalNodes = zones.reduce((s, z) => s + z.nodeCount, 0);
  const totalFailed = zones.reduce((s, z) => s + z.failedCount, 0);
  const avgResilience = zones.length
    ? Math.round(zones.reduce((s, z) => s + z.overallScore, 0) / zones.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Map className="w-5 h-5 text-white" />
            </div>
            Infrastructure Resilience Heatmap
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Geographic vulnerability analysis across Mumbai zones
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Avg Resilience</div>
          <div className="text-3xl font-bold font-mono" style={{ color: getHeatColor(avgResilience) }}>
            {avgResilience}%
          </div>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Nodes</div>
          <div className="text-3xl font-bold font-mono text-white">{totalNodes}</div>
        </div>
        <div className="bg-gray-900/80 border border-red-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Failed Nodes</div>
          <div className="text-3xl font-bold font-mono text-red-400">{totalFailed}</div>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Zones</div>
          <div className="text-3xl font-bold font-mono text-white">{zones.length}</div>
        </div>
      </div>

      {/* Sector Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 mr-2">View by:</span>
        <button
          onClick={() => setSelectedSector('overall')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedSector === 'overall'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-gray-300 border border-transparent'
          }`}
        >
          <Eye className="w-3 h-3 inline mr-1" />
          Overall
        </button>
        {Object.entries(SECTOR_ICONS).map(([sector, Icon]) => (
          <button
            key={sector}
            onClick={() => setSelectedSector(sector)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              selectedSector === sector
                ? 'border'
                : 'text-gray-400 hover:text-gray-300 border border-transparent'
            }`}
            style={selectedSector === sector ? {
              backgroundColor: SECTOR_COLORS[sector] + '20',
              color: SECTOR_COLORS[sector],
              borderColor: SECTOR_COLORS[sector] + '40',
            } : {}}
          >
            <Icon className="w-3 h-3" />
            <span className="capitalize">{sector}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Grid - Visual Mumbai Layout */}
        <div className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Map className="w-4 h-4 text-orange-400" />
            Mumbai Zone Heatmap
            <span className="text-[10px] text-gray-500 ml-auto">North ↑</span>
          </h3>

          <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: 'repeat(5, minmax(80px, 1fr))' }}>
            {/* Build grid - 5 rows x 3 cols representing rough Mumbai geography */}
            {Array.from({ length: 15 }, (_, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const zone = zones.find((z) => {
                const pos = ZONE_POSITIONS[z.zone];
                return pos && pos.row === row && pos.col === col;
              });

              if (!zone) {
                // Sea or empty area
                if (col === 0 && row <= 1) {
                  return (
                    <div key={i} className="rounded-lg bg-blue-950/20 border border-blue-900/10 flex items-center justify-center">
                      <span className="text-[9px] text-blue-800/40">Arabian Sea</span>
                    </div>
                  );
                }
                return <div key={i} className="rounded-lg bg-gray-950/30 border border-gray-800/20" />;
              }

              const score = getScore(zone);
              const heatColor = getHeatColor(score);
              const isHovered = hoveredZone === zone.zone;

              return (
                <div
                  key={i}
                  className={`rounded-xl border-2 p-3 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    isHovered ? 'scale-105 z-10' : ''
                  }`}
                  style={{
                    borderColor: heatColor + (isHovered ? '80' : '40'),
                    background: `linear-gradient(135deg, ${getHeatBg(score)}, rgba(0,0,0,0.3))`,
                    boxShadow: isHovered ? `0 0 24px ${heatColor}30` : 'none',
                  }}
                  onMouseEnter={() => setHoveredZone(zone.zone)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  {/* Heat glow */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `radial-gradient(circle at center, ${heatColor}40, transparent 70%)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className="text-xs font-bold text-white mb-1 leading-tight whitespace-pre-line">
                      {ZONE_POSITIONS[zone.zone]?.label || zone.zone}
                    </div>
                    <div className="text-2xl font-bold font-mono" style={{ color: heatColor }}>
                      {score}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {zone.failedCount > 0 && (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-[9px] text-gray-500">{zone.nodeCount} nodes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-1">
            <span className="text-[10px] text-gray-500 mr-2">Risk Level:</span>
            {[
              { label: 'Critical', color: '#EF4444' },
              { label: 'High', color: '#F97316' },
              { label: 'Medium', color: '#F59E0B' },
              { label: 'Good', color: '#84CC16' },
              { label: 'Excellent', color: '#10B981' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: color + '15' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px]" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Zone Rankings & Details */}
        <div className="space-y-4">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Zone Rankings
            </h3>
            <div className="space-y-2">
              {zones
                .sort((a, b) => getScore(b) - getScore(a))
                .map((zone, i) => {
                  const score = getScore(zone);
                  const heatColor = getHeatColor(score);
                  return (
                    <div
                      key={zone.zone}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        hoveredZone === zone.zone ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'
                      }`}
                      onMouseEnter={() => setHoveredZone(zone.zone)}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: i < 3 ? heatColor + '20' : 'rgba(55,65,81,0.5)', color: i < 3 ? heatColor : '#9ca3af' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{zone.zone}</div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${score}%`, backgroundColor: heatColor }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold" style={{ color: heatColor }}>
                        {score}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Vulnerability Alerts */}
          <div className="bg-gray-900/80 border border-red-500/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Vulnerability Alerts
            </h3>
            <div className="space-y-2">
              {zones
                .filter((z) => z.failedCount > 0 || z.degradedCount > 0 || z.overallScore < 50)
                .sort((a, b) => a.overallScore - b.overallScore)
                .map((zone) => (
                  <div
                    key={zone.zone}
                    className="p-2 rounded-lg bg-red-500/5 border border-red-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">{zone.zone}</span>
                      <Shield className="w-3 h-3 text-red-400" />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {zone.failedCount > 0 && <span className="text-red-400">{zone.failedCount} failed</span>}
                      {zone.failedCount > 0 && zone.degradedCount > 0 && <span> • </span>}
                      {zone.degradedCount > 0 && <span className="text-yellow-400">{zone.degradedCount} degraded</span>}
                      {zone.overallScore < 50 && <span className="text-orange-400"> • Low resilience ({zone.overallScore}%)</span>}
                    </div>
                  </div>
                ))}
              {zones.filter((z) => z.failedCount > 0 || z.degradedCount > 0 || z.overallScore < 50).length === 0 && (
                <div className="text-xs text-green-400 text-center py-2">
                  <Shield className="w-4 h-4 mx-auto mb-1" />
                  All zones above threshold
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
