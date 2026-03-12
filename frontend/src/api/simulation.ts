import axios from 'axios';
import type { Scenario, SimulationResult } from '../types';

const api = axios.create({ baseURL: '/api/scenarios' });

export async function getScenarios(): Promise<Scenario[]> {
  const { data } = await api.get('/');
  return data;
}

export async function getScenario(id: string): Promise<Scenario> {
  const { data } = await api.get(`/${id}`);
  return data;
}

export async function createScenario(scenario: Partial<Scenario>): Promise<Scenario> {
  const { data } = await api.post('/', scenario);
  return data;
}

export async function deleteScenario(id: string): Promise<void> {
  await api.delete(`/${id}`);
}

export async function runSimulation(scenarioId: string): Promise<SimulationResult> {
  const { data } = await api.post(`/${scenarioId}/run`);
  return data;
}

export async function getSimulationResults(scenarioId: string): Promise<SimulationResult[]> {
  const { data } = await api.get(`/${scenarioId}/results`);
  return data;
}
