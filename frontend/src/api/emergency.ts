import axios from 'axios';

const api = axios.create({ baseURL: '/api/emergency' });

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
