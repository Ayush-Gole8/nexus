import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { SECTOR_COLORS, SECTOR_LABELS, STATUS_COLORS } from '../../types';

interface SectorHealthChartProps {
  bySector: Record<string, number>;
  byStatus: Record<string, number>;
  sectorVulnerability: Record<string, number>;
}

export default function SectorHealthChart({ bySector, byStatus, sectorVulnerability }: SectorHealthChartProps) {
  const sectorData = Object.entries(bySector).map(([sector, count]) => ({
    name: SECTOR_LABELS[sector] || sector,
    count,
    fill: SECTOR_COLORS[sector] || '#6B7280',
    vulnerability: sectorVulnerability[sector] || 0,
  }));

  const statusData = Object.entries(byStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: STATUS_COLORS[status] || '#6B7280',
  }));

  const cardStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 10, padding: '18px 20px' };
  const headingStyle = { fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-secondary)', marginBottom: 14 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Nodes by Sector */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Nodes by Sector</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sectorData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-data)' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-data)' }} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontFamily: 'var(--font-data)' }}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {sectorData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Status Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {statusData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Vulnerability */}
      <div style={{ ...cardStyle, gridColumn: 'span 2 / span 2' }}>
        <h3 style={headingStyle}>Sector Vulnerability Index</h3>
        <div className="space-y-3">
          {sectorData.map((sector) => (
            <div key={sector.name} className="flex items-center gap-3">
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)', width: 128, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sector.name}</span>
              <div style={{ flex: 1, background: 'var(--bg-overlay)', borderRadius: 6, height: 6 }}>
                <div
                  style={{
                    height: 6,
                    borderRadius: 6,
                    transition: 'width 0.4s ease',
                    width: `${sector.vulnerability}%`,
                    backgroundColor: sector.vulnerability > 60 ? 'var(--st-fail)' : sector.vulnerability > 30 ? 'var(--amber)' : 'var(--st-op)',
                  }}
                />
              </div>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-primary)', width: 40, textAlign: 'right', flexShrink: 0 }}>{sector.vulnerability}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
