import axios from 'axios';
import type { Scenario, SimulationResult } from '../types';

const api = axios.create({ baseURL: '/api/scenarios' });
const bfsApi = axios.create({ baseURL: '/api' });

export interface BFSSimulateResult {
  _id: string;
  originNodeId: string;
  magnitude: number;
  resilience: number;
  affectedNodes: string[];
  propagationSteps: string[][];
  populationImpactPct: number;
  recoveryHours: number;
}

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

export interface BFSSimulateOptions {
  originNodeId: string;
  magnitude?: number;
  resilience?: number;
  monsoonActive?: boolean;
  rainfall_mm?: number;
}

export async function runBFSSimulate(
  originNodeIdOrOptions: string | BFSSimulateOptions,
  magnitude = 0.8,
  resilience = 0.3,
): Promise<BFSSimulateResult> {
  const payload =
    typeof originNodeIdOrOptions === 'string'
      ? { originNodeId: originNodeIdOrOptions, magnitude, resilience }
      : {
          originNodeId: originNodeIdOrOptions.originNodeId,
          magnitude: originNodeIdOrOptions.magnitude ?? 0.8,
          resilience: originNodeIdOrOptions.resilience ?? 0.3,
          monsoonActive: originNodeIdOrOptions.monsoonActive,
          rainfall_mm: originNodeIdOrOptions.rainfall_mm,
        };

  const { data } = await bfsApi.post('/simulate', payload);
  return data;
}
