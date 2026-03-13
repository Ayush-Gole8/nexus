import type { Response } from 'express';
import { getGeminiModel, isGeminiAvailable } from '../config/gemini';
import InfrastructureNode from '../models/InfrastructureNode';

type ChatMessage = { role: string; content: string };

export interface LiveState {
  totalNodes: number;
  criticalCount: number;
  topRiskNode: { name: string; zone: string; uptime: number };
  resilienceIndex: number;
}

async function fetchLiveState(): Promise<LiveState> {
  const nodes = await InfrastructureNode.find().lean();
  const totalNodes = nodes.length;
  const criticalCount = nodes.filter((n) => n.status === 'failed' || n.status === 'degraded').length;

  const withUptime = nodes.map((n) => {
    const uptime = typeof (n.properties as Record<string, unknown> | undefined)?.uptime === 'number'
      ? Number((n.properties as Record<string, unknown>).uptime)
      : 100;
    return { node: n, uptime };
  });

  const top = withUptime.sort((a, b) => {
    const aScore = (100 - a.uptime) + a.node.criticalityScore;
    const bScore = (100 - b.uptime) + b.node.criticalityScore;
    return bScore - aScore;
  })[0];

  const avgUptime = withUptime.length
    ? withUptime.reduce((sum, n) => sum + n.uptime, 0) / withUptime.length
    : 100;
  const resilienceIndex = Math.max(0, Math.min(100, Math.round(avgUptime - (criticalCount / Math.max(1, totalNodes)) * 30)));

  return {
    totalNodes,
    criticalCount,
    topRiskNode: {
      name: top?.node.name ?? 'N/A',
      zone: top?.node.zone ?? 'Mumbai',
      uptime: top?.uptime ?? 100,
    },
    resilienceIndex,
  };
}

export function buildSystemPrompt(liveState: LiveState, role: string): string {
  const base = [
    'You are NEXUS AI, an assistant for Mumbai City Infrastructure Intelligence.',
    `Live system state: ${liveState.totalNodes} nodes tracked, ${liveState.criticalCount} currently critical.`,
    `Top risk node: ${liveState.topRiskNode.name} in ${liveState.topRiskNode.zone} (uptime: ${liveState.topRiskNode.uptime}%).`,
    `Overall resilience index: ${liveState.resilienceIndex}/100.`,
  ].join(' ');

  const roleInstructions: Record<string, string> = {
    official:
      'You are speaking with a City Official. Provide technical detail, exact risk scores, affected node counts, cascade depth, and policy options. Use infrastructure terminology.',
    responder:
      'You are speaking with an Emergency Responder. Focus on ETAs, blocked transport routes, nearest service bases, and resource deployment priorities. Be brief and actionable.',
    citizen:
      'You are speaking with a Citizen. Use plain everyday language. Explain what infrastructure failures mean for water, power, and commute. Do not use technical jargon.',
  };

  return `${base} ${roleInstructions[role] ?? roleInstructions.citizen}`;
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

export async function generateInfrastructureInsight(prompt: string, role: string): Promise<string> {
  if (!isGeminiAvailable()) {
    return 'AI analysis unavailable — Gemini API key not configured.';
  }

  const liveState = await fetchLiveState();
  const system = buildSystemPrompt(liveState, role);
  const model = getGeminiModel();

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${system}\n\n${prompt}` }] }],
  });

  return response.response.text();
}

export async function streamChatResponse(messages: ChatMessage[], role: string, res: Response): Promise<void> {
  if (!isGeminiAvailable()) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ text: 'AI chat unavailable — configure GEMINI_API_KEY.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const liveState = await fetchLiveState();
  const system = buildSystemPrompt(liveState, role);
  const model = getGeminiModel();
  const stream = await model.generateContentStream({
    contents: [
      { role: 'user', parts: [{ text: `System instruction: ${system}` }] },
      ...toGeminiContents(messages),
    ],
  });

  for await (const chunk of stream.stream) {
    const text = chunk.text();
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

export async function getAIInsights(
  context?: string,
  specificQuery?: string
): Promise<{
  summary: string;
  risks: string[];
  recommendations: string[];
  criticalFindings: string[];
}> {
  const query = [context, specificQuery].filter(Boolean).join('\n\n')
    || 'Provide a comprehensive infrastructure resilience analysis as JSON with summary, risks, recommendations, and criticalFindings.';
  const summary = await generateInfrastructureInsight(query, 'official');
  return {
    summary,
    risks: [],
    recommendations: [],
    criticalFindings: [],
  };
}

export async function chatWithAI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  const messages = [...conversationHistory, { role: 'user', content: message }];
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  return generateInfrastructureInsight(prompt, 'citizen');
}
