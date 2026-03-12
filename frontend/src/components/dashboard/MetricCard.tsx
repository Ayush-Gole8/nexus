import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  subtitle?: string;
  accentClass?: string;
}

export default function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
  return (
    <div className="nexus-card" style={{ padding: '16px 20px' }}>
      {/* Top color stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '10px 10px 0 0' }} />
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            {title}
          </p>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 30, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{subtitle}</p>
          )}
        </div>
        <div
          className="flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: color + '25', opacity: 0.6, flexShrink: 0 }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
