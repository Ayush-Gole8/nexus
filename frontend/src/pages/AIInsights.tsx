import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, User, AlertTriangle, Loader2, Activity, ShieldAlert } from 'lucide-react';
import { getAIStatus, getAlertFeed, streamChatWithAI, type AlertFeedItem } from '../api/ai';
import { getNodes, getDependencies } from '../api/infrastructure';
import { getCriticalNodes } from '../api/analysis';
import { getDashboardMetrics } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MetricsPanelData {
  resilienceIndex: number;
  activeAlerts: number;
  criticalNodesCount: number;
  avgRecoveryTime: number;
}

export default function AIInsights() {
  const { token } = useAuth();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [alerts, setAlerts] = useState<AlertFeedItem[]>([]);
  const [metrics, setMetrics] = useState<MetricsPanelData>({
    resilienceIndex: 0,
    activeAlerts: 0,
    criticalNodesCount: 0,
    avgRecoveryTime: 12,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAIStatus().then((s) => setAiAvailable(s.available)).catch(() => setAiAvailable(false));
  }, []);

  const refreshAlerts = useCallback(async () => {
    const feed = await getAlertFeed();
    setAlerts(feed);
  }, []);

  const refreshMetrics = useCallback(async () => {
    const [dashboard, critical] = await Promise.all([
      getDashboardMetrics().catch(() => null),
      getCriticalNodes(10).catch(() => []),
    ]);

    const resilienceIndex = Math.round((dashboard?.resilienceScore ?? 0) * 10) / 10;
    const criticalNodesCount = Array.isArray(critical) ? critical.length : 0;

    // Use local estimate if no backend recovery aggregate is available.
    const avgRecoveryTime = Math.max(4, Math.round((20 - resilienceIndex / 5) * 10) / 10);

    setMetrics((prev) => ({
      ...prev,
      resilienceIndex,
      criticalNodesCount,
      avgRecoveryTime,
      activeAlerts: alerts.length,
    }));
  }, [alerts.length]);

  useEffect(() => {
    refreshAlerts();
    const timer = window.setInterval(refreshAlerts, 30000);
    return () => window.clearInterval(timer);
  }, [refreshAlerts]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const injectLiveInfraState = async () => {
    const [nodes, deps] = await Promise.all([
      getNodes().catch(() => []),
      getDependencies().catch(() => []),
    ]);

    const byStatus = nodes.reduce<Record<string, number>>((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    }, {});

    const criticalTop = [...nodes]
      .sort((a, b) => b.criticalityScore - a.criticalityScore)
      .slice(0, 5)
      .map((n) => `${n.name}(${n.criticalityScore})`)
      .join(', ');

    return [
      'SYSTEM CONTEXT (LIVE INFRA STATE):',
      `nodes=${nodes.length}`,
      `dependencies=${deps.length}`,
      `status_breakdown=${JSON.stringify(byStatus)}`,
      `top_critical=${criticalTop}`,
    ].join('\n');
  };

  const sendMessage = useCallback(async () => {
    const raw = input.trim();
    if (!raw || sending || !aiAvailable || !token) return;

    setInput('');
    setSending(true);

    const userMsg: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: raw,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const context = await injectLiveInfraState();
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const assistantId = `${Date.now()}-assistant`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
      ]);

      await streamChatWithAI(`${context}\n\nUSER QUERY:\n${raw}`, history, token, (chunk) => {
        setMessages((prev) => prev.map((m) => (
          m.id === assistantId ? { ...m, content: `${m.content}${chunk}` } : m
        )));
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content: 'Unable to generate AI response right now. Please try again in a moment.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, aiAvailable, token, messages]);

  const quickPrompts = useMemo(() => [
    'Identify top 3 cascading failure risks right now.',
    'Suggest immediate mitigation actions for critical nodes.',
    'Summarize transport and power resilience in plain language.',
  ], []);

  if (aiAvailable === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Insights</h1>
          <p className="text-sm text-slate-400 mt-1">Live-state assisted AI analysis with streaming chat and alert feed</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${aiAvailable ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
          {aiAvailable ? 'AI Connected' : 'AI Unavailable'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 h-[calc(100%-56px)]">
        <div className="space-y-3 overflow-y-auto pr-1">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Metrics</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Resilience Index" value={`${metrics.resilienceIndex}%`} color="#22d97a" />
              <Metric label="Active Alerts" value={String(alerts.length || metrics.activeAlerts)} color="#ff3355" />
              <Metric label="Critical Nodes" value={String(metrics.criticalNodesCount)} color="#f0a500" />
              <Metric label="Avg Recovery" value={`${metrics.avgRecoveryTime}h`} color="#4ea7ff" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Alert Feed (30s polling)
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-xs text-slate-500">No active alerts from /api/alerts.</div>
              ) : alerts.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-700 bg-slate-900/40 px-2.5 py-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-wider ${a.level === 'critical' ? 'text-red-400' : a.level === 'high' ? 'text-orange-400' : 'text-blue-400'}`}>
                      {a.level}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-white mt-1">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Infrastructure Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-3">Prompt includes live node/dependency status automatically.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-700/50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && <Bot className="w-7 h-7 p-1.5 rounded-full bg-purple-600/20 text-purple-300" />}
                <div className={`max-w-[78%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-200'}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && <User className="w-7 h-7 p-1.5 rounded-full bg-blue-600/20 text-blue-300" />}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating response...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-slate-700">
            {!aiAvailable && (
              <div className="mb-2 text-xs text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Configure Gemini key to enable chat.
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!aiAvailable || sending || !token}
                placeholder="Ask about resilience, risk, or cascade strategy..."
                className="flex-1 px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !aiAvailable || sending || !token}
                className="px-3 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-900/35 rounded-lg px-2.5 py-2 border border-slate-700">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-base font-semibold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}
