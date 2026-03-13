import axios from 'axios';

const api = axios.create({ baseURL: '/api/citizen' });

function authHeaders() {
  const token = localStorage.getItem('nexus_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export interface CitizenPassport {
  overallResilienceScore: number;
  powerOutageRiskHrs: number;
  waterDisruptionHrs: number;
  ambulanceETA: number;
  monsoonRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  dependencyCount: number;
  nearestShelter: { name: string; distanceKm: number };
  totalNodes: number;
  criticalNodes: number;
}

export async function getCitizenPassport(wardId: string): Promise<CitizenPassport> {
  const { data } = await api.get(`/passport/${wardId}`, { headers: authHeaders() });
  return data;
}

export interface CitizenAlert {
  _id: string;
  nodeId?: { _id: string; name: string; zone: string; type: string; status: string };
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  wardId: string;
  createdAt: string;
  acknowledged: boolean;
}

export async function getCitizenAlerts(wardId: string): Promise<CitizenAlert[]> {
  const { data } = await api.get('/alerts', {
    params: { wardId },
    headers: authHeaders(),
  });
  return Array.isArray(data) ? data : [];
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  priority: number;
}

export async function getCitizenChecklist(wardId: string): Promise<ChecklistItem[]> {
  const { data } = await api.get(`/checklist/${wardId}`, { headers: authHeaders() });
  return Array.isArray(data) ? data : [];
}
