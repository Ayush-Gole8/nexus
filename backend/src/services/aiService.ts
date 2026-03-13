import type { Response } from 'express';
import { getGeminiModel, isGeminiAvailable } from '../config/gemini';
import InfrastructureNode from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';

type ChatMessage = { role: string; content: string };

export interface LiveState {
  totalNodes: number;
  criticalCount: number;
  topRiskNode: { name: string; zone: string; uptime: number };
  resilienceIndex: number;
  detailedNodes: any[];
  detailedConnections: any[];
}

async function fetchLiveState(): Promise<LiveState> {
  const nodes = await InfrastructureNode.find().lean();
  const connections = await Dependency.find().lean();
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
    detailedNodes: nodes.map(n => ({ id: n._id, name: n.name, type: n.type, status: n.status, zone: n.zone, load: n.currentLoad, capacity: n.capacity })),
    detailedConnections: connections.map(c => ({ source: c.sourceNodeId, target: c.targetNodeId, type: c.dependencyType, strength: c.strength })),
  };
}

export function buildSystemPrompt(liveState: LiveState, role: string): string {
  const base = [
    'You are NEXUS AI, an advanced infrastructure intelligence and predictive analytics system for Mumbai City.',
    'Your primary objective is to parse real-time sensor and topological data to provide actionable insights, risk assessments, and impact mitigation strategies.',
    '--- CURRENT SYSTEM STATE SUMMARY ---',
    `Total Nodes Monitored: ${liveState.totalNodes}`,
    `Nodes in Critical/Failed State: ${liveState.criticalCount}`,
    `Top Risk Node: ${liveState.topRiskNode.name} (Zone: ${liveState.topRiskNode.zone}, Uptime: ${liveState.topRiskNode.uptime}%)`,
    `Overall City Resilience Index: ${liveState.resilienceIndex}/100`,
    '--------------------------------------',
    '--- LIVE INFRASTRUCTURE DATA PAYLOAD ---',
    `Detailed Nodes List (ID, Name, Sector, Status, Zone, Load vs Capacity): ${JSON.stringify(liveState.detailedNodes)}`,
    `Topological Connections & Dependencies: ${JSON.stringify(liveState.detailedConnections)}`,
    '----------------------------------------',
    'Instructions on using the data payload:',
    '1. Cross-reference connections with node statuses to predict cascading failures (e.g., a failed power node affecting connected water pumps).',
    '2. Identify bottlenecks or systemic vulnerabilities in the network topology.',
    '3. Base your analysis completely on the real-time data provided above.',
  ].join('\n');

  const roleInstructions: Record<string, string> = {
    official:
      '[TARGET AUDIENCE: City Official & Infrastructure Manager]\n' +
      'Structure your response with technical precision. Provide detailed risk scoring, pinpoint exact cascading failure vectors (using node IDs/names), and suggest strategic policy interventions or maintenance prioritizations. Use standard urban planning and infrastructure terminology.',
    responder:
      '[TARGET AUDIENCE: Emergency Responder / Disaster Management]\n' +
      'Structure your response for immediate field action. Identify critical route blockages, degraded transport nodes, and optimal resource deployment paths. Prioritize life-safety implications and immediate service restoration steps. Be extremely brief, clear, and actionable.',
    citizen:
      '[TARGET AUDIENCE: Mumbai Citizen]\n' +
      'Structure your response in plain, reassuring, everyday language. Translate technical failures into direct public impact (e.g., "Water supply in Andheri might be delayed," or "Avoid the Western Express Highway due to flooding"). Provide practical safety advice without unnecessary technical jargon.',
  };

  return `${base}\n\n${roleInstructions[role] ?? roleInstructions.citizen}\n\nDeliver your response adhering strictly to the needs of your current audience.`;
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
