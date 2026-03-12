import axios from 'axios';
import type { DashboardMetrics } from '../types';

const api = axios.create({ baseURL: '/api/dashboard' });

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await api.get('/metrics');
  return data;
}
