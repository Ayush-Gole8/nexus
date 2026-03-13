import axios from 'axios';
import { getZoneResilience } from './emergency';

const api = axios.create({ baseURL: '/api/citizen' });

export interface CitizenPassport {
  wardId: string;
  wardName: string;
  resilienceScore: number;
  powerOutageRiskHrs: number;
  waterDisruptionRiskHrs: number;
  ambulanceEtaMin: number;
  monsoonRisk: 'high' | 'medium' | 'low';
  floodZone: boolean;
  alerts: Array<{ id: string; level: string; title: string; message: string; timestamp: string }>;
}

export async function getCitizenPassport(wardId: string): Promise<CitizenPassport> {
  try {
    const { data } = await api.get(`/passport/${wardId}`);
    return data;
  } catch {
    // Fallback while backend endpoint is pending.
    const zones = await getZoneResilience().catch(() => [] as any[]);
    const z = zones[0];
    return {
      wardId,
      wardName: z?.zone || wardId,
      resilienceScore: z?.overallScore || 62,
      powerOutageRiskHrs: 2.5,
      waterDisruptionRiskHrs: 3.1,
      ambulanceEtaMin: 14,
      monsoonRisk: z?.overallScore < 45 ? 'high' : z?.overallScore < 70 ? 'medium' : 'low',
      floodZone: true,
      alerts: [],
    };
  }
}
