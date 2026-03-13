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
  history?: Array<{ role: string; content: string }>
): Promise<string> {
  const { data } = await api.post('/chat', { message, history });
  return data.response;
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
