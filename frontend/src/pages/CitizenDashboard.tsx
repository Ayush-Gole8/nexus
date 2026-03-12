import { useEffect, useState } from 'react';
import {
  Shield, TrendingDown, TrendingUp, Zap, Droplets, Car, Wifi, Heart,
  MapPin, BarChart3, Activity,
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

const SECTOR_ICONS: Record<string, React.ComponentType<any>> = {
  power: Zap,
  water: Droplets,
  transport: Car,
  telecom: Wifi,
  emergency: Heart,
};

function getScoreColor(score: number) {
  if (score >= 80) return 'var(--st-op)';
  if (score >= 60) return 'var(--amber)';
  if (score >= 40) return '#ff6b2b';
  return 'var(--st-fail)';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'At Risk';
  return 'Critical';
}

export default function CitizenDashboard() {
  const [zones, setZones] = useState<ZoneScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<ZoneScore | null>(null);

  useEffect(() => {
    getZoneResilience()
      .then((data) => {
        setZones(data);
        if (data.length > 0) setSelectedZone(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>Loading zone data...</div>;
  }

  const avgScore = zones.length > 0 ? Math.round(zones.reduce((s, z) => s + z.overallScore, 0) / zones.length) : 0;
  const worstZone = zones.length > 0 ? zones.reduce((a, b) => (a.overallScore < b.overallScore ? a : b)) : null;
  const bestZone = zones.length > 0 ? zones.reduce((a, b) => (a.overallScore > b.overallScore ? a : b)) : null;

  const cardS = { background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 10, padding: '14px 16px' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-3">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(34,217,122,0.12)', border: '1px solid rgba(34,217,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: 18, height: 18, color: 'var(--st-op)' }} />
          </div>
          Citizen Impact Dashboard
        </h1>
        <p className="page-subtitle">Zone-wise infrastructure resilience and reliability scores for Mumbai</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div style={cardS}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>City Resilience</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 28, fontWeight: 700, color: getScoreColor(avgScore) }}>{avgScore}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>%</span></div>
          <div style={{ fontSize: 10, marginTop: 4, color: getScoreColor(avgScore) }}>{getScoreLabel(avgScore)}</div>
        </div>
        <div style={cardS}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Zones Monitored</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{zones.length}</div>
          <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text-muted)' }}>Active areas</div>
        </div>
        <div style={cardS}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp style={{ width: 10, height: 10, color: 'var(--st-op)' }} /> Best Zone
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--st-op)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bestZone?.zone || '-'}</div>
          <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text-muted)' }}>{bestZone ? `${bestZone.overallScore}% resilience` : ''}</div>
        </div>
        <div style={cardS}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingDown style={{ width: 10, height: 10, color: 'var(--st-fail)' }} /> Needs Attention
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--st-fail)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{worstZone?.zone || '-'}</div>
          <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text-muted)' }}>{worstZone ? `${worstZone.overallScore}% resilience` : ''}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone List */}
        <div className="space-y-2">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin style={{ width: 12, height: 12, color: 'var(--amber)' }} /> Mumbai Zones
          </h3>
          <div className="space-y-2">
            {zones.sort((a, b) => b.overallScore - a.overallScore).map((zone) => {
              const scoreColor = getScoreColor(zone.overallScore);
              const isSelected = selectedZone?.zone === zone.zone;
              return (
                <button
                  key={zone.zone}
                  onClick={() => setSelectedZone(zone)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: 'none',
                    background: isSelected ? 'var(--amber-glow)' : 'var(--bg-surface)',
                    outline: isSelected ? '1px solid var(--border-default)' : '1px solid var(--border-hairline)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{zone.zone}</span>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: 16, fontWeight: 700, color: scoreColor }}>{zone.overallScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'var(--bg-overlay)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${zone.overallScore}%`, background: scoreColor, borderRadius: 3, boxShadow: `0 0 6px ${scoreColor}60`, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 5, fontFamily: 'var(--font-data)', fontSize: 9 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{zone.nodeCount} nodes</span>
                    {zone.failedCount > 0 && <span style={{ color: 'var(--st-fail)' }}>{zone.failedCount} failed</span>}
                    {zone.degradedCount > 0 && <span style={{ color: 'var(--amber)' }}>{zone.degradedCount} degraded</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone Detail */}
        <div className="lg:col-span-2">
          {selectedZone ? (
            <div className="space-y-4">
              {/* Zone header + gauge */}
              <div style={cardS}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{selectedZone.zone}</h3>
                    <p style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Infrastructure Resilience Breakdown</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 36, fontWeight: 700, color: getScoreColor(selectedZone.overallScore) }}>{selectedZone.overallScore}</div>
                    <div style={{ fontSize: 10, color: getScoreColor(selectedZone.overallScore) }}>{getScoreLabel(selectedZone.overallScore)}</div>
                  </div>
                </div>
                {/* Circular gauge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <svg width="140" height="140" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-overlay)" strokeWidth="10" />
                    <circle
                      cx="80" cy="80" r="70" fill="none"
                      stroke={getScoreColor(selectedZone.overallScore)}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(selectedZone.overallScore / 100) * 440} 440`}
                      transform="rotate(-90 80 80)"
                      style={{ filter: `drop-shadow(0 0 6px ${getScoreColor(selectedZone.overallScore)}60)` }}
                    />
                    <text x="80" y="76" textAnchor="middle" fill="var(--text-primary)" fontSize="26" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                      {selectedZone.overallScore}%
                    </text>
                    <text x="80" y="95" textAnchor="middle" fill="var(--text-muted)" fontSize="9" letterSpacing="2">
                      RESILIENCE
                    </text>
                  </svg>
                </div>
              </div>

              {/* Sector Breakdown */}
              <div style={cardS}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChart3 style={{ width: 12, height: 12, color: 'var(--amber)' }} /> Sector-wise Reliability
                </h4>
                <div className="space-y-4">
                  {Object.entries(selectedZone.sectorScores).map(([sector, score]) => {
                    const Icon = SECTOR_ICONS[sector] || Activity;
                    const sColor = SECTOR_COLORS[sector] || '#6B7280';
                    return (
                      <div key={sector}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 5, background: sColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon style={{ width: 12, height: 12, color: sColor }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{sector}</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700, color: getScoreColor(score) }}>{score}%</span>
                        </div>
                        <div style={{ width: '100%', height: 5, background: 'var(--bg-overlay)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${score}%`, background: sColor, borderRadius: 4, boxShadow: `0 0 5px ${sColor}40`, transition: 'width 0.7s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div style={cardS}>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{selectedZone.nodeCount}</div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>Total Nodes</div>
                </div>
                <div style={{ ...cardS, borderColor: 'rgba(255,51,85,0.2)' }}>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 26, fontWeight: 700, color: 'var(--st-fail)', textAlign: 'center' }}>{selectedZone.failedCount}</div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>Failed</div>
                </div>
                <div style={{ ...cardS, borderColor: 'rgba(240,165,0,0.2)' }}>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 26, fontWeight: 700, color: 'var(--amber)', textAlign: 'center' }}>{selectedZone.degradedCount}</div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>Degraded</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="nexus-card" style={{ padding: 48, textAlign: 'center' }}>
              <Activity style={{ width: 40, height: 40, color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: 13 }}>Select a zone to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
