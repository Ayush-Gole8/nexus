import type { Dependency, InfrastructureNode } from '../types';

export interface DNANode {
  nodeId: string;
  name: string;
  type: string;
  zone: string;
  status: string;
  cascadeProb: number;
  depth: number;
  children: DNANode[];
}

type EdgeRef = {
  targetId: string;
  weight: number;
  type: string;
};

function getNodeId(value: string | InfrastructureNode): string {
  return typeof value === 'string' ? value : value._id;
}

function getNodeById(nodes: InfrastructureNode[]): Map<string, InfrastructureNode> {
  const map = new Map<string, InfrastructureNode>();
  for (const node of nodes) {
    map.set(node._id, node);
  }
  return map;
}

function buildAdjacency(edges: Dependency[]): Map<string, EdgeRef[]> {
  const adjacency = new Map<string, EdgeRef[]>();

  const pushEdge = (from: string, to: string, edge: Dependency) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from)!.push({
      targetId: to,
      weight: Math.max(0, Math.min(5, Number(edge.strength) * 5)),
      type: edge.dependencyType,
    });
  };

  for (const edge of edges) {
    const source = getNodeId(edge.sourceNodeId);
    const target = getNodeId(edge.targetNodeId);
    pushEdge(source, target, edge);
    if (edge.bidirectional) {
      pushEdge(target, source, edge);
    }
  }

  return adjacency;
}

function edgeMultiplier(type: string): number {
  if (type === 'critical') return 1.5;
  if (type === 'direct') return 1.0;
  return 0.6;
}

export function computeFailureDNA(
  originId: string,
  nodes: InfrastructureNode[],
  edges: Dependency[],
  monsoonActive: boolean,
  floodZoneIds: Set<string>
): DNANode {
  const nodeMap = getNodeById(nodes);
  const adjacency = buildAdjacency(edges);

  const originNode = nodeMap.get(originId);
  const root: DNANode = {
    nodeId: originId,
    name: originNode?.name || originId,
    type: originNode?.type || 'unknown',
    zone: originNode?.zone || 'Mumbai',
    status: originNode?.status || 'unknown',
    cascadeProb: 100,
    depth: 0,
    children: [],
  };

  if (!originNode) return root;

  const visited = new Set<string>([originId]);
  const queue: DNANode[] = [root];

  while (queue.length > 0) {
    const parent = queue.shift()!;
    if (parent.depth >= 4) continue;

    const outgoing = adjacency.get(parent.nodeId) || [];
    for (const edge of outgoing) {
      if (visited.has(edge.targetId)) continue;

      const edgeMult = edgeMultiplier(edge.type);
      let prob = (parent.cascadeProb / 100) * (edge.weight / 5) * edgeMult * 100;
      if (monsoonActive && floodZoneIds.has(edge.targetId)) {
        prob *= 1.4;
      }
      prob = Math.min(prob, 100);
      prob = Math.round(prob * 10) / 10;

      const depth = parent.depth + 1;
      if (depth >= 4 || prob < 5) {
        continue;
      }

      const childNode = nodeMap.get(edge.targetId);
      const child: DNANode = {
        nodeId: edge.targetId,
        name: childNode?.name || edge.targetId,
        type: childNode?.type || 'unknown',
        zone: childNode?.zone || 'Mumbai',
        status: childNode?.status || 'unknown',
        cascadeProb: prob,
        depth,
        children: [],
      };

      parent.children.push(child);
      visited.add(edge.targetId);
      queue.push(child);
    }
  }

  return root;
}
