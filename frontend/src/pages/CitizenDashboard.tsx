import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckSquare, Square, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCitizenPassport, type CitizenPassport } from '../api/citizen';
import { useMonsoonData } from '../hooks/useMonsoonData';

const CHECKLIST_KEY = 'citizen-preparedness-checklist-v1';

const DEFAULT_CHECKLIST = [
  'Emergency contacts saved',
  '72-hour water stock ready',
  'Backup lights and batteries available',
  'Important documents digitized',
  'Nearest shelter route known',
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const wardId = user?.wardId || user?.zone || 'ward-default';

  const [passport, setPassport] = useState<CitizenPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const { monsoonActive, setMonsoonActive } = useMonsoonData();

  useEffect(() => {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    if (saved) {
      try {
        setChecklistState(JSON.parse(saved));
      } catch {
        setChecklistState({});
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    getCitizenPassport(wardId)
      .then(setPassport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wardId]);

  const progress = useMemo(() => {
    const done = DEFAULT_CHECKLIST.filter((item) => checklistState[item]).length;
    return Math.round((done / DEFAULT_CHECKLIST.length) * 100);
  }, [checklistState]);

  const toggleChecklist = (item: string) => {
    setChecklistState((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  if (loading || !passport) {
    return <div className="text-slate-400">Loading citizen passport...</div>;
  }

  const ringRadius = 62;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference * (1 - passport.resilienceScore / 100);

  const monsoonColor = passport.monsoonRisk === 'high' ? '#ff3355' : passport.monsoonRisk === 'medium' ? '#f0a500' : '#22d97a';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Citizen Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Ward passport and preparedness overview for {passport.wardName}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
        <div className="space-y-3">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-green-400" />
              <h3 className="text-xs uppercase tracking-wider text-slate-400">Resilience Score</h3>
            </div>
            <div className="flex justify-center">
              <svg width="170" height="170" viewBox="0 0 170 170">
                <circle cx="85" cy="85" r={ringRadius} fill="none" stroke="#1e293b" strokeWidth="12" />
                <circle
                  cx="85"
                  cy="85"
                  r={ringRadius}
                  fill="none"
                  stroke={passport.resilienceScore >= 75 ? '#22d97a' : passport.resilienceScore >= 50 ? '#f0a500' : '#ff3355'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 85 85)"
                  style={{ transition: 'stroke-dashoffset 700ms ease' }}
                />
                <text x="85" y="82" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{passport.resilienceScore}%</text>
                <text x="85" y="102" textAnchor="middle" fill="#94a3b8" fontSize="10">WARD RESILIENCE</text>
              </svg>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">Ward ID: {passport.wardId}</div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Monsoon Risk</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${monsoonColor}22`, border: `1px solid ${monsoonColor}66` }}>
              <span className="w-2 h-2 rounded-full" style={{ background: monsoonColor }} />
              <span className="text-xs font-semibold uppercase" style={{ color: monsoonColor }}>{passport.monsoonRisk}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{passport.floodZone ? 'Flood zone flagged for this ward.' : 'Flood risk currently low.'}</p>
            <button
              onClick={() => setMonsoonActive((v) => !v)}
              className={`mt-2 text-[11px] px-2 py-1 rounded border ${monsoonActive ? 'text-blue-200 border-blue-400/40 bg-blue-600/20' : 'text-slate-300 border-slate-600 bg-slate-900/40'}`}
            >
              Monsoon Mode {monsoonActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <RiskCard title="Power Outage Risk" value={`${passport.powerOutageRiskHrs.toFixed(1)} h`} />
            <RiskCard title="Water Disruption Risk" value={`${passport.waterDisruptionRiskHrs.toFixed(1)} h`} />
            <RiskCard title="Ambulance ETA" value={`${passport.ambulanceEtaMin.toFixed(0)} min`} />
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">Emergency Preparedness Checklist</h3>
            <div className="space-y-2">
              {DEFAULT_CHECKLIST.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleChecklist(item)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-700 hover:border-slate-600 flex items-center gap-2"
                >
                  {checklistState[item] ? <CheckSquare className="w-4 h-4 text-green-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  <span className={`text-sm ${checklistState[item] ? 'text-green-300' : 'text-slate-300'}`}>{item}</span>
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-3">Preparedness progress: {progress}%</div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Ward Alert Feed
            </h3>
            {passport.alerts.length === 0 ? (
              <div className="text-xs text-slate-500">No active ward alerts.</div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {passport.alerts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">{a.level}</div>
                    <p className="text-sm text-white mt-0.5">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}
