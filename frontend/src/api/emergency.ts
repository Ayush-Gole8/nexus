import axios from 'axios';

const api = axios.create({ baseURL: '/api/emergency' });

export interface SimulateIncidentResult {
  incidentNodeId: string;
  incidentType: string;
  services: {
    fire: EmergencyETA;
    ambulance: EmergencyETA;
    police: EmergencyETA;
  };
  summary: {
    firstResponder: 'fire' | 'ambulance' | 'police';
    firstArrivalETA: number;
    allServicesETA: { fire: number; ambulance: number; police: number };
    maxGoldenHourPct: number;
    totalBlockedNodes: string[];
  };
}

export interface EmergencyETA {
  serviceType: 'fire' | 'ambulance' | 'police';
  serviceBase: { nodeId: string; name: string; location: { lat: number; lng: number } };
  incidentLocation: { lat: number; lng: number };
  distanceKm: number;
  baseETA: number;
  adjustedETA: number;
  penaltyMinutes: number;
  routeNodes: string[];
  blockedNodes: string[];
  altRoute: string[];
  goldenHourPct: number;
}

export async function getEmergencyResponse(lat: number, lng: number, type: string) {
  const { data } = await api.post('/response', { lat, lng, type });
  return data;
}

export async function getZoneResilience() {
  const { data } = await api.get('/zone-resilience');
  return data;
}

export async function getPredictiveFailures() {
  const { data } = await api.get('/predictive-failures');
  return data;
}

export async function simulateIncident(nodeId: string, type = 'incident'): Promise<SimulateIncidentResult> {
  const { data } = await api.post('/simulate-incident', { nodeId, type });
  return data;
}
