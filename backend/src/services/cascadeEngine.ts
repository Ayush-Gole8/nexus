import { buildGraph } from './graphService';
import InfrastructureNode from '../models/InfrastructureNode';

// ── BFS Cascade ──────────────────────────────────────────────────────────────

export interface BFSCascadeResult {
  affectedNodes: string[];
  propagationSteps: string[][];
  cascadeDepth: number;
  impactBySector: Record<string, number>;
  populationImpactPct: number;
  recoveryHours: number;
}

/**
 * Probabilistic BFS cascade starting from a single origin node.
 * @param originId   MongoDB _id of the origin node (string)
 * @param magnitude  Failure magnitude [0, 1]
 * @param resilience Network resilience [0, 1]  (higher → more resistant)
 */
export async function runBFSCascade(
  originId: string,
  magnitude: number,
  resilience: number,
): Promise<BFSCascadeResult> {
  const { graph, nodeMap } = await buildGraph();

  if (!graph.hasNode(originId)) {
    return {
      affectedNodes: [],
      propagationSteps: [],
      cascadeDepth: 0,
      impactBySector: {},
      populationImpactPct: 0,
      recoveryHours: 0,
    };
  }

  // adjacency map: nodeId → [{targetId, weight ∈ [0,5], type}]
  type Neighbour = { targetId: string; weight: number; type: string };
  const adjacency = new Map<string, Neighbour[]>();
  graph.forEachNode((nodeId) => {
    const neighbours: Neighbour[] = [];
    graph.forEachOutEdge(nodeId, (_edge, attrs, _source, target) => {
      neighbours.push({
        targetId: target,
        weight: (attrs.strength ?? 0.5) * 5, // scale 0-1 → 0-5
        type: attrs.dependencyType ?? 'operational',
      });
    });
    adjacency.set(nodeId, neighbours);
  });

  const affected = new Set<string>([originId]);
  const propagationSteps: string[][] = [[originId]];
  let frontier: string[] = [originId];

  while (frontier.length > 0) {
    const nextFrontier: string[] = [];
    for (const nodeId of frontier) {
      for (const { targetId, weight, type } of (adjacency.get(nodeId) ?? [])) {
        if (affected.has(targetId)) continue;

        let failProb = magnitude * (weight / 5) * (1 - resilience);
        if (type === 'critical') failProb *= 1.5;
        failProb = Math.min(1.0, failProb);

        if (Math.random() < failProb) {
          affected.add(targetId);
          nextFrontier.push(targetId);
        }
      }
    }
    if (nextFrontier.length > 0) propagationSteps.push(nextFrontier);
    frontier = nextFrontier;
  }

  // per-sector counts
  const impactBySector: Record<string, number> = {};
  for (const nodeId of affected) {
    const node = nodeMap.get(nodeId);
    if (node) impactBySector[node.type] = (impactBySector[node.type] ?? 0) + 1;
  }

  // population impact estimate (Mumbai ~20 M)
  const POP_PER_NODE: Record<string, number> = {
    power: 300_000, water: 500_000, transport: 400_000, telecom: 200_000, emergency: 600_000,
  };
  const MUMBAI_POPULATION = 20_000_000;
  let popAffected = 0;
  for (const nodeId of affected) {
    const node = nodeMap.get(nodeId);
    if (node) popAffected += POP_PER_NODE[node.type] ?? 100_000;
  }
  const populationImpactPct =
    Math.min(100, Math.round((popAffected / MUMBAI_POPULATION) * 1000) / 10);

  const cascadeDepth = propagationSteps.length - 1;
  const recoveryHours = Math.round(
    (affected.size * 2 + cascadeDepth * 8) *
    Math.max(0.1, magnitude) *
    Math.max(0.5, 2 - resilience),
  );

  return {
    affectedNodes: Array.from(affected),
    propagationSteps,
    cascadeDepth,
    impactBySector,
    populationImpactPct,
    recoveryHours,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

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
    loadBefore: number;
    capacityBefore: number;
    reason: string;          // why this node was affected
  }>;
  propagationPaths: Array<{
    from: string;
    fromName: string;
    to: string;
    toName: string;
    step: number;
    strength: number;
    dependencyType: string;
    impactTransferred: number;
  }>;
  summary: {
    totalAffected: number;
    totalFailed: number;
    totalDegraded: number;
    bySector: Record<string, number>;
    criticalNodesHit: string[];
    maxPropagationDepth: number;
    cascadeChains: string[][];   // longest propagation chains
    populationAffected: number;  // estimate
    resilienceScore: number;     // 0-100: how resilient the network is
  };
}

export interface CascadeOptions {
  failureThreshold?: number;   // impact above which a node fails (default 0.6)
  degradeThreshold?: number;   // impact above which a node degrades (default 0.25)
  maxDepth?: number;           // max propagation steps (default 12)
  impactDecay?: number;        // multiplier per hop (default 0.8)
}

// Cross-sector dependency amplification: when a power node fails,
// water/telecom/emergency nodes that depend on it suffer amplified impact
const CROSS_SECTOR_AMPLIFICATION: Record<string, Record<string, number>> = {
  power:     { water: 1.4, telecom: 1.3, emergency: 1.5, transport: 1.2 },
  water:     { emergency: 1.3, power: 1.1, telecom: 1.0, transport: 1.0 },
  telecom:   { emergency: 1.4, power: 1.1, water: 1.0, transport: 1.1 },
  transport: { emergency: 1.2, power: 1.0, water: 1.0, telecom: 1.0 },
  emergency: { power: 1.0, water: 1.0, telecom: 1.1, transport: 1.0 },
};

// Dependency type severity: power_supply failures are more severe than operational
const DEP_TYPE_SEVERITY: Record<string, number> = {
  power_supply: 1.0,
  water_supply: 0.9,
  data_link: 0.75,
  physical_access: 0.6,
  operational: 0.5,
};

export async function runCascadeAnalysis(
  failedNodeIds: string[],
  options: CascadeOptions = {}
): Promise<CascadeResult> {
  const {
    failureThreshold = 0.6,
    degradeThreshold = 0.25,
    maxDepth = 12,
    impactDecay = 0.8,
  } = options;

  const { graph, nodeMap } = await buildGraph();

  const impactedNodes: CascadeResult['impactedNodes'] = [];
  const propagationPaths: CascadeResult['propagationPaths'] = [];
  const visited = new Map<string, number>(); // nodeId -> cumulative impact
  const bySector: Record<string, number> = {};
  const criticalNodesHit: string[] = [];
  const parentMap = new Map<string, string[]>(); // for chain reconstruction

  // Initialize queue with directly failed nodes
  type QueueItem = { nodeId: string; impact: number; step: number; from: string | null };
  const queue: QueueItem[] = [];

  for (const nodeId of failedNodeIds) {
    if (!graph.hasNode(nodeId)) continue;
    visited.set(nodeId, 1.0);
    queue.push({ nodeId, impact: 1.0, step: 0, from: null });

    const node = nodeMap.get(nodeId)!;
    impactedNodes.push({
      nodeId,
      name: node.name,
      type: node.type,
      subtype: node.subtype,
      impactLevel: 'direct',
      newStatus: 'failed',
      propagationStep: 0,
      impactScore: 1.0,
      loadBefore: node.currentLoad,
      capacityBefore: node.capacity,
      reason: 'Initial failure point (user-selected)',
    });

    bySector[node.type] = (bySector[node.type] || 0) + 1;
    if (node.criticalityScore >= 70) {
      criticalNodesHit.push(nodeId);
    }
  }

  let maxPropagationDepth = 0;

  // BFS cascade propagation with enhanced calculations
  while (queue.length > 0) {
    const { nodeId, impact, step } = queue.shift()!;
    if (step >= maxDepth) continue;

    const sourceNode = nodeMap.get(nodeId);
    if (!sourceNode) continue;

    graph.forEachOutNeighbor(nodeId, (neighbor) => {
      if (failedNodeIds.includes(neighbor)) return;

      const edgeKey = graph.edge(nodeId, neighbor);
      if (!edgeKey) return;

      const edgeStrength = graph.getEdgeAttribute(edgeKey, 'strength') || 0.5;
      const depType = graph.getEdgeAttribute(edgeKey, 'dependencyType') || 'operational';
      const targetNode = nodeMap.get(neighbor);
      if (!targetNode) return;

      // ── Enhanced impact calculation ──

      // 1. Base propagation: impact × edge strength × decay
      let propagatedImpact = impact * edgeStrength * impactDecay;

      // 2. Dependency type severity multiplier
      const depSeverity = DEP_TYPE_SEVERITY[depType] || 0.5;
      propagatedImpact *= depSeverity;

      // 3. Cross-sector amplification (e.g. power→hospital is 1.5×)
      const crossAmp = CROSS_SECTOR_AMPLIFICATION[sourceNode.type]?.[targetNode.type] || 1.0;
      propagatedImpact *= crossAmp;

      // 4. Load stress factor: nodes near capacity are more vulnerable
      const loadRatio = targetNode.capacity > 0
        ? targetNode.currentLoad / targetNode.capacity
        : 0.5;
      const stressFactor = 0.8 + loadRatio * 0.4; // ranges from 0.8 to 1.2
      propagatedImpact *= stressFactor;

      // 5. Criticality factor: high-criticality nodes resist slightly better
      //    (they usually have redundancy) but still propagate if hit
      const critResistance = 1 - (targetNode.criticalityScore / 100) * 0.15;
      propagatedImpact *= critResistance;

      // Noise floor
      if (propagatedImpact < 0.03) return;

      const existingImpact = visited.get(neighbor) || 0;
      const newCumulativeImpact = Math.min(1, existingImpact + propagatedImpact);

      // Build reason string
      const depLabel = depType.replace(/_/g, ' ');
      const reason = `${depLabel} dependency from ${sourceNode.name} (impact: ${(propagatedImpact * 100).toFixed(0)}%${crossAmp > 1 ? `, cross-sector ×${crossAmp}` : ''})`;

      // Always record propagation path
      propagationPaths.push({
        from: nodeId,
        fromName: sourceNode.name,
        to: neighbor,
        toName: targetNode.name,
        step: step + 1,
        strength: edgeStrength,
        dependencyType: depType,
        impactTransferred: Math.round(propagatedImpact * 1000) / 1000,
      });

      if (newCumulativeImpact > existingImpact) {
        visited.set(neighbor, newCumulativeImpact);

        const newStep = step + 1;
        maxPropagationDepth = Math.max(maxPropagationDepth, newStep);

        // Track parent for chain reconstruction
        if (!parentMap.has(neighbor)) parentMap.set(neighbor, []);
        parentMap.get(neighbor)!.push(nodeId);

        let newStatus: 'degraded' | 'failed';
        if (newCumulativeImpact >= failureThreshold) {
          newStatus = 'failed';
        } else if (newCumulativeImpact >= degradeThreshold) {
          newStatus = 'degraded';
        } else {
          return; // below threshold
        }

        // Update or add impacted node
        const existingIdx = impactedNodes.findIndex((n) => n.nodeId === neighbor);
        if (existingIdx >= 0) {
          impactedNodes[existingIdx].impactScore = newCumulativeImpact;
          impactedNodes[existingIdx].newStatus = newStatus;
          impactedNodes[existingIdx].reason = reason;
        } else {
          impactedNodes.push({
            nodeId: neighbor,
            name: targetNode.name,
            type: targetNode.type,
            subtype: targetNode.subtype,
            impactLevel: 'cascading',
            newStatus,
            propagationStep: newStep,
            impactScore: Math.round(newCumulativeImpact * 1000) / 1000,
            loadBefore: targetNode.currentLoad,
            capacityBefore: targetNode.capacity,
            reason,
          });

          bySector[targetNode.type] = (bySector[targetNode.type] || 0) + 1;
          if (targetNode.criticalityScore >= 70) {
            criticalNodesHit.push(neighbor);
          }
        }

        // Continue propagation: failed nodes propagate fully, degraded partially
        if (newStatus === 'failed') {
          queue.push({ nodeId: neighbor, impact: newCumulativeImpact, step: newStep, from: nodeId });
        } else if (newStatus === 'degraded' && newCumulativeImpact > 0.4) {
          // Degraded nodes propagate at reduced intensity
          queue.push({ nodeId: neighbor, impact: newCumulativeImpact * 0.5, step: newStep, from: nodeId });
        }
      }
    });
  }

  // ── Build cascade chains (longest paths from initial failures) ──
  const cascadeChains: string[][] = [];
  const failedNodes = impactedNodes.filter(n => n.newStatus === 'failed');
  // Find deepest nodes and trace back
  const deepest = impactedNodes
    .filter(n => n.impactLevel === 'cascading')
    .sort((a, b) => b.propagationStep - a.propagationStep)
    .slice(0, 3);

  for (const deep of deepest) {
    const chain: string[] = [deep.name];
    let current = deep.nodeId;
    let safety = 20;
    while (parentMap.has(current) && safety-- > 0) {
      const parents = parentMap.get(current)!;
      const parent = parents[0];
      const parentNode = nodeMap.get(parent);
      if (parentNode) chain.unshift(parentNode.name);
      current = parent;
    }
    cascadeChains.push(chain);
  }

  // ── Estimate population affected ──
  let populationAffected = 0;
  for (const node of impactedNodes) {
    if (node.type === 'water') populationAffected += node.newStatus === 'failed' ? 500000 : 200000;
    if (node.type === 'power') populationAffected += node.newStatus === 'failed' ? 300000 : 100000;
    if (node.type === 'transport') populationAffected += node.newStatus === 'failed' ? 400000 : 150000;
    if (node.type === 'telecom') populationAffected += node.newStatus === 'failed' ? 200000 : 80000;
    if (node.type === 'emergency') populationAffected += node.newStatus === 'failed' ? 600000 : 250000;
  }

  // ── Resilience score: 100 = no cascade, 0 = total collapse ──
  const totalNodes = nodeMap.size;
  const affectedRatio = impactedNodes.length / totalNodes;
  const failedRatio = failedNodes.length / totalNodes;
  const resilienceScore = Math.max(0, Math.round((1 - affectedRatio * 0.6 - failedRatio * 0.4) * 100));

  const totalFailed = impactedNodes.filter(n => n.newStatus === 'failed').length;
  const totalDegraded = impactedNodes.filter(n => n.newStatus === 'degraded').length;

  return {
    impactedNodes,
    propagationPaths,
    summary: {
      totalAffected: impactedNodes.length,
      totalFailed,
      totalDegraded,
      bySector,
      criticalNodesHit,
      maxPropagationDepth,
      cascadeChains,
      populationAffected,
      resilienceScore,
    },
  };
}
