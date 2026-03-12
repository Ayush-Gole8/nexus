// Shared TypeScript interfaces matching the backend models

export interface InfrastructureNode {
  _id: string;
  name: string;
  type: 'power' | 'water' | 'transport' | 'telecom' | 'emergency';
  subtype: string;
  location: { lat: number; lng: number };
  status: 'operational' | 'degraded' | 'failed' | 'maintenance' | 'unknown';
  capacity: number;
  currentLoad: number;
  criticalityScore: number;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Dependency {
  _id: string;
  sourceNodeId: string | InfrastructureNode;
  targetNodeId: string | InfrastructureNode;
  dependencyType: 'power_supply' | 'water_supply' | 'data_link' | 'physical_access' | 'operational';
  strength: number;
  bidirectional: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scenario {
  _id: string;
  name: string;
  description: string;
  type: string;
  status?: 'draft' | 'running' | 'completed' | 'failed';
  initialFailures: Array<{ nodeId: string; failureType: string }> | string[];
  parameters: Record<string, any>;
  createdAt: string;
}

export interface CascadeResult {
  impactedNodes: Array<{
    nodeId: string;
    name: string;
    type: string;
    subtype: string;
    impactLevel: 'direct' | 'cascading';
    newStatus: 'degraded' | 'failed';
    propagationStep: number;
    impactScore: number;
    loadBefore?: number;
    capacityBefore?: number;
    reason?: string;
  }>;
  propagationPaths: Array<{
    from: string;
    fromName?: string;
    to: string;
    toName?: string;
    step: number;
    strength: number;
    dependencyType?: string;
    impactTransferred?: number;
  }>;
  summary: {
    totalAffected: number;
    totalFailed?: number;
    totalDegraded?: number;
    bySector: Record<string, number>;
    criticalNodesHit: string[];
    maxPropagationDepth: number;
    cascadeChains?: string[][];
    populationAffected?: number;
    resilienceScore?: number;
  };
}

export interface SimulationResult extends CascadeResult {
  simulationResultId: string;
}

export interface CriticalNode {
  nodeId: string;
  name: string;
  type: string;
  subtype: string;
  criticalityScore: number;
  degreeCentrality: number;
  betweennessCentrality: number;
  sectorBridgingScore: number;
  compositeScore: number;
}

export interface DashboardMetrics {
  totalNodes: number;
  totalDependencies: number;
  bySector: Record<string, number>;
  byStatus: Record<string, number>;
  depsByType: Record<string, number>;
  criticalNodes: CriticalNode[];
  resilienceScore: number;
  sectorVulnerability: Record<string, number>;
}

export interface AIInsights {
  summary: string;
  risks: string[];
  recommendations: string[];
  criticalFindings: string[];
  optimizationOpportunities?: string[];
}

export interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: InfrastructureNode & { color: string };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    animated: boolean;
    style: Record<string, any>;
    data: { dependencyType: string; strength: number };
  }>;
}

// Emergency & USP interfaces
export interface EmergencyResponseUnit {
  name: string;
  type: string;
  distance: number;
  eta: number;
  status: string;
  location: { lat: number; lng: number };
}

export interface ZoneResilience {
  zone: string;
  overallScore: number;
  sectorScores: Record<string, number>;
  nodeCount: number;
  failedCount: number;
  degradedCount: number;
}

export interface PredictiveFailure {
  nodeId: string;
  name: string;
  type: string;
  subtype: string;
  failureProbability: number;
  riskFactors: string[];
  currentLoad: number;
  capacity: number;
  status: string;
  criticalityScore: number;
  estimatedTimeToFailure?: string;
  mitigationSuggestions: string[];
}

export const SECTOR_COLORS: Record<string, string> = {
  power:     '#ffe234',
  water:     '#00d4b8',
  transport: '#ff6b2b',
  telecom:   '#7b68ff',
  emergency: '#ff3355',
};

export const SECTOR_LABELS: Record<string, string> = {
  power: 'Power Grid',
  water: 'Water Supply',
  transport: 'Transportation',
  telecom: 'Telecommunications',
  emergency: 'Emergency Services',
};

export const STATUS_COLORS: Record<string, string> = {
  operational: '#22d97a',
  degraded:    '#f0a500',
  failed:      '#ff3355',
  maintenance: '#7b68ff',
  unknown:     '#5c5649',
};
