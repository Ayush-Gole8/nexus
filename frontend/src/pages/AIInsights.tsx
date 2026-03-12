import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Bot, User, AlertTriangle, Shield, TrendingUp, Loader2 } from 'lucide-react';
import { getAIStatus, getAIInsights, chatWithAI } from '../api/ai';
import type { AIInsights as AIInsightsType } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: 'Analyze critical risks', prompt: 'What are the most critical infrastructure risks in the network right now?' },
  { label: 'Sector health summary', prompt: 'Give me a summary of the health status across all infrastructure sectors.' },
  { label: 'Recommend improvements', prompt: 'What infrastructure improvements would most increase overall resilience?' },
  { label: 'Vulnerability assessment', prompt: 'Which nodes are most vulnerable to cascading failures and why?' },
];

export default function AIInsights() {
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [insights, setInsights] = useState<AIInsightsType | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAIStatus().then((s) => setAiAvailable(s.available)).catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGetInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const data = await getAIInsights();
      setInsights(data);
    } catch (err) {
      console.error('Failed to get insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await chatWithAI(msg, history);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please check your Gemini API key and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [input, messages]);

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
          <p className="text-sm text-slate-400 mt-1">
            Gemini-powered infrastructure analysis and recommendations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            aiAvailable ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${aiAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
            {aiAvailable ? 'AI Connected' : 'AI Unavailable'}
          </div>
          <button
            onClick={handleGetInsights}
            disabled={loadingInsights || !aiAvailable}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {loadingInsights ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100% - 60px)' }}>
        {/* Left - Insights Panel */}
        <div className="w-96 flex-shrink-0 space-y-4 overflow-y-auto">
          {!aiAvailable && (
            <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <p className="text-sm font-medium text-yellow-400">API Key Required</p>
              </div>
              <p className="text-xs text-yellow-300/80">
                Set your GEMINI_API_KEY in the backend .env file to enable AI features.
              </p>
            </div>
          )}

          {insights && (
            <>
              {/* Summary */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Summary
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{insights.summary}</p>
              </div>

              {/* Risks */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Risks
                </h3>
                <ul className="space-y-2">
                  {insights.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-red-400 mt-0.5">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Optimization Opportunities */}
              {insights.optimizationOpportunities && insights.optimizationOpportunities.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Optimization Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {insights.optimizationOpportunities.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-blue-400 mt-0.5">→</span>
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!insights && aiAvailable && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm text-slate-500">Click "Generate Insights" to analyze your infrastructure</p>
            </div>
          )}
        </div>

        {/* Right - Chat */}
        <div className="flex-1 flex flex-col bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Infrastructure Chat</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm mb-6">Ask me anything about your infrastructure network</p>
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.prompt)}
                      disabled={!aiAvailable}
                      className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-xs text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors disabled:opacity-50 text-left"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-700/50 text-slate-200 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions (when chat has messages) */}
          {messages.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-700/50 flex gap-2 overflow-x-auto">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  disabled={!aiAvailable || sending}
                  className="px-2.5 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-xs text-slate-400 hover:text-slate-300 hover:border-slate-500 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={aiAvailable ? 'Ask about infrastructure...' : 'AI unavailable — configure API key'}
                disabled={!aiAvailable || sending}
                className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || !aiAvailable || sending}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
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
