import axios from 'axios';
import type { CascadeResult, CriticalNode } from '../types';

const api = axios.create({ baseURL: '/api/analysis' });

export async function runCascadeAnalysis(
  nodeIds: string[],
  options?: { failureThreshold?: number; degradeThreshold?: number; maxDepth?: number }
): Promise<CascadeResult> {
  const { data } = await api.post('/cascade', { nodeIds, options });
  return data;
}

export async function getCriticalNodes(limit?: number): Promise<CriticalNode[]> {
  const { data } = await api.get('/critical-nodes', { params: limit ? { limit } : {} });
  return data;
}
