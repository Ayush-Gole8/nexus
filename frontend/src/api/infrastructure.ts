import axios from 'axios';
import type { InfrastructureNode, Dependency, GraphData } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function getNodes(filters?: { type?: string; status?: string; search?: string }): Promise<InfrastructureNode[]> {
  const { data } = await api.get('/nodes', { params: filters });
  return data;
}

export async function getNode(id: string): Promise<{ node: InfrastructureNode; dependencies: Dependency[] }> {
  const { data } = await api.get(`/nodes/${id}`);
  return data;
}

export async function createNode(node: Partial<InfrastructureNode>): Promise<InfrastructureNode> {
  const { data } = await api.post('/nodes', node);
  return data;
}

export async function updateNode(id: string, updates: Partial<InfrastructureNode>): Promise<InfrastructureNode> {
  const { data } = await api.put(`/nodes/${id}`, updates);
  return data;
}

export async function deleteNode(id: string): Promise<void> {
  await api.delete(`/nodes/${id}`);
}

export async function getDependencies(type?: string): Promise<Dependency[]> {
  const { data } = await api.get('/dependencies', { params: type ? { type } : {} });
  return data;
}

export async function createDependency(dep: Partial<Dependency>): Promise<Dependency> {
  const { data } = await api.post('/dependencies', dep);
  return data;
}

export async function updateDependency(id: string, updates: Partial<Dependency>): Promise<Dependency> {
  const { data } = await api.put(`/dependencies/${id}`, updates);
  return data;
}

export async function deleteDependency(id: string): Promise<void> {
  await api.delete(`/dependencies/${id}`);
}

export async function getGraphData(): Promise<GraphData> {
  const { data } = await api.get('/graph');
  return data;
}
