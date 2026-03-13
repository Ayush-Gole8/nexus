import { useEffect, useMemo, useState } from 'react';

interface GoldenHourBarProps {
  pct: number;
  label?: string;
}

export default function GoldenHourBar({ pct, label = 'GOLDEN HOUR USAGE' }: GoldenHourBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const [widthPct, setWidthPct] = useState(0);

  const barColor = useMemo(() => {
    if (clamped < 50) return '#10B981';
    if (clamped < 75) return '#F59E0B';
    return '#EF4444';
  }, [clamped]);

  useEffect(() => {
    setWidthPct(0);
    const timer = window.setTimeout(() => setWidthPct(clamped), 50);
    return () => window.clearTimeout(timer);
  }, [clamped]);

  return (
    <div style={{ width: '100%', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6080A0',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{clamped}%</span>
      </div>

      <div
        style={{
          width: '100%',
          height: 7,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.07)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            width: `${widthPct}%`,
            height: '100%',
            borderRadius: 4,
            background: barColor,
            transition: 'width 0.7s ease-out, background-color 0.3s ease',
          }}
        />

        {[25, 50, 75].map((tick) => (
          <div
            key={tick}
            style={{
              position: 'absolute',
              left: `${tick}%`,
              top: 0,
              width: 1,
              height: 4,
              background: 'rgba(255,255,255,0.2)',
              transform: 'translateX(-0.5px)',
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            left: '75%',
            top: 11,
            transform: 'translateX(-50%)',
            fontSize: 10,
            color: '#EF4444',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          ⚠ CRITICAL
        </div>
      </div>
    </div>
  );
}
