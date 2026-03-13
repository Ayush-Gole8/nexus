import axios from 'axios';
import type { AIInsights } from '../types';

const api = axios.create({ baseURL: '/api/ai' });

export async function getAIStatus(): Promise<{ available: boolean }> {
  const { data } = await api.get('/status');
  return data;
}

export async function getAIInsights(context?: string, query?: string): Promise<AIInsights> {
  const { data } = await api.post('/insights', { context, query });
  return data;
}

export async function chatWithAI(
  message: string,
  history?: Array<{ role: string; content: string }>,
  token?: string,
): Promise<string> {
  let full = '';
  await streamChatWithAI(message, history || [], token || '', (chunk) => {
    full += chunk;
  });
  return full;
}

export async function streamChatWithAI(
  message: string,
  history: Array<{ role: string; content: string }>,
  token: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI chat request failed with status ${response.status}`);
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const line = event
        .split('\n')
        .find((l) => l.startsWith('data: '));
      if (!line) continue;

      const payload = line.slice(6);
      if (payload === '[DONE]') return;

      try {
        const parsed = JSON.parse(payload) as { text?: string };
        if (parsed.text) onChunk(parsed.text);
      } catch {
        // Ignore malformed chunks.
      }
    }
  }
}

export interface AlertFeedItem {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
}

export async function getAlertFeed(): Promise<AlertFeedItem[]> {
  try {
    const { data } = await api.get('/alerts');
    return Array.isArray(data) ? data : [];
  } catch {
    // Fallback when /api/alerts is not yet available.
    return [];
  }
}
