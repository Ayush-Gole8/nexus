import { useEffect, useState } from 'react';
import {
  Brain, AlertTriangle, TrendingUp, Shield, Activity,
  Zap, Droplets, Car, Wifi, Heart, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getPredictiveFailures } from '../api/emergency';
import { SECTOR_COLORS, SECTOR_LABELS } from '../types';

interface PredictiveFailure {
  nodeId: string;
  name: string;
  type: string;
  subtype: string;
  failureProbability: number;
  riskFactors: string[];
  currentLoad: number;
  capacity: number;
  status: string;
  criticalityScore: number;
  estimatedTimeToFailure?: string;
  mitigationSuggestions: string[];
}

const SECTOR_ICONS: Record<string, React.ComponentType<any>> = {
  power: Zap,
  water: Droplets,
  transport: Car,
  telecom: Wifi,
  emergency: Heart,
};

function getRiskColor(prob: number) {
  if (prob >= 0.7) return '#EF4444';
  if (prob >= 0.4) return '#F59E0B';
  if (prob >= 0.2) return '#F97316';
  return '#10B981';
}

function getRiskLabel(prob: number) {
  if (prob >= 0.7) return 'Critical';
  if (prob >= 0.4) return 'High';
  if (prob >= 0.2) return 'Medium';
  return 'Low';
}

export default function PredictiveAnalytics() {
  const [failures, setFailures] = useState<PredictiveFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSector, setFilterSector] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  useEffect(() => {
    getPredictiveFailures()
      .then(setFailures)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-slate-400">Analyzing infrastructure...</div>;
  }

  const filtered = failures.filter((f) => {
    const matchSector = filterSector === 'all' || f.type === filterSector;
    const matchRisk = filterRisk === 'all' ||
      (filterRisk === 'critical' && f.failureProbability >= 0.7) ||
      (filterRisk === 'high' && f.failureProbability >= 0.4 && f.failureProbability < 0.7) ||
      (filterRisk === 'medium' && f.failureProbability >= 0.2 && f.failureProbability < 0.4) ||
      (filterRisk === 'low' && f.failureProbability < 0.2);
    return matchSector && matchRisk;
  }).sort((a, b) => b.failureProbability - a.failureProbability);

  const criticalCount = failures.filter((f) => f.failureProbability >= 0.7).length;
  const highCount = failures.filter((f) => f.failureProbability >= 0.4 && f.failureProbability < 0.7).length;
  const avgRisk = failures.length
    ? Math.round((failures.reduce((s, f) => s + f.failureProbability, 0) / failures.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            AI Predictive Failure Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Machine learning-powered prediction of infrastructure failures before they happen
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-purple-400 font-medium">AI-POWERED</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Nodes Analyzed</div>
          <div className="text-3xl font-bold font-mono text-white">{failures.length}</div>
          <div className="text-xs text-gray-500 mt-1">Infrastructure components</div>
        </div>
        <div className="bg-gray-900/80 border border-red-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" /> Critical Risk
          </div>
          <div className="text-3xl font-bold font-mono text-red-400">{criticalCount}</div>
          <div className="text-xs text-red-400/60 mt-1">Immediate attention needed</div>
        </div>
        <div className="bg-gray-900/80 border border-yellow-500/20 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-yellow-400" /> High Risk
          </div>
          <div className="text-3xl font-bold font-mono text-yellow-400">{highCount}</div>
          <div className="text-xs text-yellow-400/60 mt-1">Monitor closely</div>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-cyan-400" /> Avg Risk Level
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: getRiskColor(avgRisk / 100) }}>
            {avgRisk}%
          </div>
          <div className="text-xs text-gray-500 mt-1">{getRiskLabel(avgRisk / 100)} overall</div>
        </div>
      </div>

      {/* Risk Distribution Bar */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Risk Distribution</h3>
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
          {[
            { label: 'Critical', color: '#EF4444', count: criticalCount },
            { label: 'High', color: '#F59E0B', count: highCount },
            { label: 'Medium', color: '#F97316', count: failures.filter((f) => f.failureProbability >= 0.2 && f.failureProbability < 0.4).length },
            { label: 'Low', color: '#10B981', count: failures.filter((f) => f.failureProbability < 0.2).length },
          ].map(({ label, color, count }) => (
            count > 0 && (
              <div
                key={label}
                className="h-full transition-all duration-500"
                style={{
                  width: `${(count / Math.max(1, failures.length)) * 100}%`,
                  backgroundColor: color,
                  minWidth: count > 0 ? '20px' : '0',
                }}
                title={`${label}: ${count}`}
              />
            )
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
          {[
            { label: 'Critical', color: '#EF4444', count: criticalCount },
            { label: 'High', color: '#F59E0B', count: highCount },
            { label: 'Medium', color: '#F97316', count: failures.filter((f) => f.failureProbability >= 0.2 && f.failureProbability < 0.4).length },
            { label: 'Low', color: '#10B981', count: failures.filter((f) => f.failureProbability < 0.2).length },
          ].map(({ label, color, count }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{label}: {count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
        >
          <option value="all">All Sectors</option>
          {Object.entries(SECTOR_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical (&ge;70%)</option>
          <option value="high">High (40-70%)</option>
          <option value="medium">Medium (20-40%)</option>
          <option value="low">Low (&lt;20%)</option>
        </select>
        <span className="text-xs text-gray-500">{filtered.length} nodes shown</span>
      </div>

      {/* Failure List */}
      <div className="space-y-2">
        {filtered.map((f) => {
          const Icon = SECTOR_ICONS[f.type] || Activity;
          const isExpanded = expandedId === f.nodeId;
          const riskColor = getRiskColor(f.failureProbability);
          const loadPct = f.capacity > 0 ? Math.round((f.currentLoad / f.capacity) * 100) : 0;

          return (
            <div
              key={f.nodeId}
              className="bg-gray-900/80 border rounded-xl overflow-hidden transition-all"
              style={{ borderColor: f.failureProbability >= 0.7 ? '#EF444440' : f.failureProbability >= 0.4 ? '#F59E0B30' : '#374151' }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : f.nodeId)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-800/30 transition-colors text-left"
              >
                {/* Risk indicator */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: riskColor + '15', border: `1px solid ${riskColor}30` }}
                >
                  <span className="text-sm font-bold font-mono" style={{ color: riskColor }}>
                    {Math.round(f.failureProbability * 100)}%
                  </span>
                </div>

                {/* Node info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: SECTOR_COLORS[f.type] }} />
                    <span className="text-sm font-medium text-white truncate">{f.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: riskColor + '20', color: riskColor }}
                    >
                      {getRiskLabel(f.failureProbability)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {f.subtype?.replace(/_/g, ' ')} • Load: {loadPct}% • Criticality: {f.criticalityScore}
                  </div>
                </div>

                {/* Risk factors count */}
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">{f.riskFactors.length} risk factors</div>
                  {f.estimatedTimeToFailure && (
                    <div className="text-[10px] text-orange-400 mt-0.5">ETF: {f.estimatedTimeToFailure}</div>
                  )}
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-800 space-y-3">
                  {/* Risk Factors */}
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-400" /> Risk Factors
                    </h4>
                    <div className="space-y-1">
                      {f.riskFactors.map((rf, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: riskColor }} />
                          {rf}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mitigation Suggestions */}
                  {f.mitigationSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-green-400" /> Mitigation Suggestions
                      </h4>
                      <div className="space-y-1">
                        {f.mitigationSuggestions.map((ms, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-green-400/80">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-green-400" />
                            {ms}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Node Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Load</div>
                      <div className="text-sm font-mono font-bold" style={{ color: loadPct > 85 ? '#EF4444' : '#10B981' }}>
                        {loadPct}%
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Criticality</div>
                      <div className="text-sm font-mono font-bold text-white">{f.criticalityScore}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className={`text-sm font-mono font-bold capitalize ${
                        f.status === 'failed' ? 'text-red-400' : f.status === 'degraded' ? 'text-yellow-400' : 'text-green-400'
                      }`}>{f.status}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Failure Prob.</div>
                      <div className="text-sm font-mono font-bold" style={{ color: riskColor }}>
                        {Math.round(f.failureProbability * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
