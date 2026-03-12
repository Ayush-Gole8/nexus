import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, GitBranch, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';
import SectorHealthChart from '../components/dashboard/SectorHealthChart';
import { getDashboardMetrics } from '../api/dashboard';
import type { DashboardMetrics, CriticalNode } from '../types';
import { SECTOR_COLORS } from '../types';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>Loading dashboard...</div>;
  }

  if (!metrics) {
    return <div style={{ color: 'var(--st-fail)', textAlign: 'center', padding: '40px 0' }}>Failed to load metrics. Is the backend running?</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Infrastructure Dashboard</h1>
        <p className="page-subtitle">Real-time overview of city infrastructure health and dependencies</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Nodes"
          value={metrics.totalNodes}
          icon={<Network className="w-5 h-5" />}
          color="var(--amber)"
          subtitle="Infrastructure components"
        />
        <MetricCard
          title="Dependencies"
          value={metrics.totalDependencies}
          icon={<GitBranch className="w-5 h-5" />}
          color="var(--st-op)"
          subtitle="Inter-system connections"
        />
        <MetricCard
          title="Resilience Score"
          value={`${metrics.resilienceScore}%`}
          icon={<Shield className="w-5 h-5" />}
          color={metrics.resilienceScore > 70 ? 'var(--st-op)' : metrics.resilienceScore > 40 ? 'var(--amber)' : 'var(--st-fail)'}
          subtitle="Overall system health"
        />
        <MetricCard
          title="Critical Alerts"
          value={metrics.byStatus['failed'] || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="var(--st-fail)"
          subtitle={`${metrics.byStatus['degraded'] || 0} degraded`}
        />
      </div>

      {/* Charts */}
      <SectorHealthChart
        bySector={metrics.bySector}
        byStatus={metrics.byStatus}
        sectorVulnerability={metrics.sectorVulnerability}
      />

      {/* Critical Nodes Table */}
      <div className="nexus-card" style={{ padding: '18px 20px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Top Critical Nodes</h3>
          <button
            onClick={() => navigate('/cascade')}
            className="flex items-center gap-1"
            style={{ fontSize: 11, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-data)' }}
          >
            Analyze <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 12 }}>
            <thead>
              <tr style={{ fontFamily: 'var(--font-data)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <th className="text-left pb-3 pr-4">Node</th>
                <th className="text-left pb-3 pr-4">Sector</th>
                <th className="text-left pb-3 pr-4">Type</th>
                <th className="text-right pb-3 pr-4">Degree</th>
                <th className="text-right pb-3 pr-4">Betweenness</th>
                <th className="text-right pb-3 pr-4">Bridging</th>
                <th className="text-right pb-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {metrics.criticalNodes.map((node: CriticalNode, i: number) => (
                <tr
                  key={node.nodeId}
                  style={{ borderTop: '1px solid var(--border-hairline)', cursor: 'pointer' }}
                  className="hover:bg-amber-dim/10"
                  onClick={() => navigate('/cascade', { state: { nodeId: node.nodeId } })}
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-muted)', width: 18 }}>{i + 1}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>{node.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className="sector-badge"
                      style={{ backgroundColor: `${SECTOR_COLORS[node.type]}20`, color: SECTOR_COLORS[node.type] }}
                    >
                      {node.type}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 capitalize" style={{ color: 'var(--text-secondary)' }}>{node.subtype.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 pr-4 text-right" style={{ fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>{node.degreeCentrality}</td>
                  <td className="py-2.5 pr-4 text-right" style={{ fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>{node.betweennessCentrality}</td>
                  <td className="py-2.5 pr-4 text-right" style={{ fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>{node.sectorBridgingScore}</td>
                  <td className="py-2.5 text-right">
                    <span
                      style={{ fontFamily: 'var(--font-data)', fontWeight: 700, color: node.compositeScore > 30 ? 'var(--st-fail)' : node.compositeScore > 20 ? 'var(--amber)' : 'var(--st-op)' }}
                    >
                      {node.compositeScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
