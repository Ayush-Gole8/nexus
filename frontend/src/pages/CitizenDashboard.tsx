import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckSquare, Square, CloudRain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getCitizenPassport,
  getCitizenAlerts,
  getCitizenChecklist,
  type CitizenPassport,
  type CitizenAlert,
  type ChecklistItem,
} from '../api/citizen';

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 55) return '#F59E0B';
  return '#EF4444';
}

function timeAgo(ts: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

function severityDot(severity: string): string {
  if (severity === 'critical') return '#EF4444';
  if (severity === 'warning') return '#F59E0B';
  return '#06B6D4';
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const wardId = user?.wardId || 'Dharavi';

  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<CitizenPassport | null>(null);
  const [alerts, setAlerts] = useState<CitizenAlert[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [displayScore, setDisplayScore] = useState(0);

  const checklistKey = `nexus_checklist_${wardId}`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      getCitizenPassport(wardId),
      getCitizenAlerts(wardId),
      getCitizenChecklist(wardId),
    ])
      .then(([passportData, alertsData, checklistData]) => {
        if (!mounted) return;
        setPassport(passportData);
        setAlerts(alertsData);
        setChecklist(checklistData);

        const savedRaw = localStorage.getItem(checklistKey);
        const saved = savedRaw ? (JSON.parse(savedRaw) as Record<string, boolean>) : {};
        const merged: Record<string, boolean> = {};
        checklistData.forEach((item) => {
          merged[item.id] = !!saved[item.id];
        });
        setChecked(merged);
      })
      .catch((err) => {
        console.error('Failed to load citizen dashboard', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [wardId, checklistKey]);

  useEffect(() => {
    if (!passport) return;
    setDisplayScore(0);
    const timer = window.setTimeout(() => {
      setDisplayScore(passport.overallResilienceScore);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [passport?.overallResilienceScore]);

  useEffect(() => {
    const refetchAlerts = async () => {
      try {
        const next = await getCitizenAlerts(wardId);
        setAlerts(next);
      } catch (err) {
        console.error('Failed to refresh ward alerts', err);
      }
    };

    const timer = window.setInterval(refetchAlerts, 60000);
    return () => window.clearInterval(timer);
  }, [wardId]);

  const baseItems = useMemo(() => checklist.filter((i) => i.category !== 'monsoon'), [checklist]);
  const monsoonItems = useMemo(() => checklist.filter((i) => i.category === 'monsoon'), [checklist]);
  const completed = useMemo(() => checklist.filter((i) => checked[i.id]).length, [checklist, checked]);

  const onToggleChecklist = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(checklistKey, JSON.stringify(next));
      return next;
    });
  };

  if (loading || !passport) {
    return <div className="flex items-center justify-center h-96 text-slate-400">Loading resilience passport...</div>;
  }

  const scoreColor = getScoreColor(passport.overallResilienceScore);
  const dashOffset = 314.16 * (1 - displayScore / 100);
  const ambulanceColor = passport.ambulanceETA < 10 ? '#10B981' : passport.ambulanceETA < 20 ? '#F59E0B' : '#EF4444';
  const monsoonColor = passport.monsoonRisk === 'HIGH' ? '#EF4444' : passport.monsoonRisk === 'MEDIUM' ? '#F59E0B' : '#10B981';

  return (
    <div className="h-[calc(100vh-7rem)] overflow-y-auto pr-1">
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3 mb-4 flex items-center justify-between">
        <div className="text-sm tracking-[0.15em] text-slate-200 font-semibold">RESILIENCE PASSPORT</div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-slate-200 border border-slate-700">{wardId}</span>
          <span className="px-2 py-1 rounded bg-emerald-900/30 text-[11px] text-emerald-300 border border-emerald-700/40">Citizen</span>
        </div>
      </div>

      <div className="space-y-5 pb-8 px-1">
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex justify-center">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={314.16}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
            />
            <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="24" fontWeight="700">
              {passport.overallResilienceScore}
            </text>
            <text x="60" y="77" textAnchor="middle" fill="#94a3b8" fontSize="9">/ 100</text>
          </svg>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <RiskCard title="⚡ Power Outage Risk" value={`${passport.powerOutageRiskHrs} hrs`} />
          <RiskCard title="💧 Water Disruption" value={`${passport.waterDisruptionHrs} hrs`} />
          <RiskCard title="🚑 Ambulance ETA" value={`${passport.ambulanceETA} min`} valueColor={ambulanceColor} />
          <RiskCard title="🌧 Monsoon Risk" value={passport.monsoonRisk} valueColor={monsoonColor} />
          <RiskCard title="🔗 Infrastructure Links" value={`${passport.dependencyCount}`} />
          <RiskCard
            title="🛡 Nearest Shelter"
            value={`${passport.nearestShelter.distanceKm} km`}
            subLabel={passport.nearestShelter.name}
          />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-100 tracking-wide">EMERGENCY PREPAREDNESS</div>
            <div className="text-xs text-slate-300 px-2 py-1 rounded bg-slate-800 border border-slate-700">
              {completed} / {checklist.length} completed
            </div>
          </div>

          <div className="space-y-2">
            {baseItems.map((item) => (
              <ChecklistRow key={item.id} item={item} checked={!!checked[item.id]} onToggle={onToggleChecklist} />
            ))}
          </div>

          {monsoonItems.length > 0 && (
            <>
              <div className="my-3 border-t border-slate-700" />
              <div className="space-y-2">
                {monsoonItems.map((item) => (
                  <ChecklistRow key={item.id} item={item} checked={!!checked[item.id]} onToggle={onToggleChecklist} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-sm font-semibold text-slate-100 tracking-wide mb-3">WARD ALERTS</div>
          {alerts.length === 0 ? (
            <div className="text-sm text-slate-500">No alerts for {wardId}</div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert._id} className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: severityDot(alert.severity) }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{alert.title}</div>
                        <div className="text-xs text-slate-300 mt-1">{alert.description}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 whitespace-nowrap">{timeAgo(alert.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RiskCard({ title, value, valueColor, subLabel }: { title: string; value: string; valueColor?: string; subLabel?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-xs text-slate-400 tracking-wide">{title}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: valueColor || '#fff' }}>{value}</div>
      {subLabel ? <div className="text-xs text-slate-500 mt-1">{subLabel}</div> : null}
    </div>
  );
}

function ChecklistRow({
  item,
  checked,
  onToggle,
}: {
  item: ChecklistItem;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.id)}
        className="mt-0.5"
      />
      {checked ? <CheckSquare className="w-4 h-4 text-emerald-400 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 mt-0.5" />}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800">
            {item.category}
          </span>
        </div>
        <div className="text-sm text-slate-200">
          {item.category === 'monsoon' ? <CloudRain className="inline w-3.5 h-3.5 mr-1 text-blue-300" /> : null}
          {item.text}
        </div>
      </div>
    </label>
  );
}
