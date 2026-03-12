import Graph from 'graphology';
import InfrastructureNode, { IInfrastructureNode } from '../models/InfrastructureNode';
import Dependency, { IDependency } from '../models/Dependency';

export interface GraphData {
  graph: Graph;
  nodeMap: Map<string, IInfrastructureNode>;
}

export async function buildGraph(): Promise<GraphData> {
  const nodes = await InfrastructureNode.find().lean<IInfrastructureNode[]>();
  const dependencies = await Dependency.find().lean<IDependency[]>();

  const graph = new Graph({ multi: false, type: 'directed' });
  const nodeMap = new Map<string, IInfrastructureNode>();

  for (const node of nodes) {
    const id = node._id.toString();
    nodeMap.set(id, node);
    graph.addNode(id, {
      name: node.name,
      type: node.type,
      subtype: node.subtype,
      status: node.status,
      criticalityScore: node.criticalityScore,
      capacity: node.capacity,
      currentLoad: node.currentLoad,
    });
  }

  for (const dep of dependencies) {
    const source = dep.sourceNodeId.toString();
    const target = dep.targetNodeId.toString();
    if (graph.hasNode(source) && graph.hasNode(target)) {
      if (!graph.hasEdge(source, target)) {
        graph.addEdge(source, target, {
          dependencyType: dep.dependencyType,
          strength: dep.strength,
          bidirectional: dep.bidirectional,
        });
      }
      if (dep.bidirectional && !graph.hasEdge(target, source)) {
        graph.addEdge(target, source, {
          dependencyType: dep.dependencyType,
          strength: dep.strength,
          bidirectional: true,
        });
      }
    }
  }

  return { graph, nodeMap };
}

export function computeDegreeCentrality(graph: Graph): Map<string, number> {
  const centrality = new Map<string, number>();
  const maxDegree = Math.max(1, graph.order - 1);
  graph.forEachNode((node) => {
    const degree = graph.degree(node);
    centrality.set(node, degree / maxDegree);
  });
  return centrality;
}

export function computeBetweennessCentrality(graph: Graph): Map<string, number> {
  const centrality = new Map<string, number>();
  graph.forEachNode((node) => centrality.set(node, 0));

  const nodes = graph.nodes();
  for (const s of nodes) {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();
    const delta = new Map<string, number>();

    graph.forEachNode((node) => {
      predecessors.set(node, []);
      sigma.set(node, 0);
      dist.set(node, -1);
      delta.set(node, 0);
    });

    sigma.set(s, 1);
    dist.set(s, 0);
    const queue: string[] = [s];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const dv = dist.get(v)!;

      graph.forEachOutNeighbor(v, (w) => {
        if (dist.get(w)! < 0) {
          queue.push(w);
          dist.set(w, dv + 1);
        }
        if (dist.get(w) === dv + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          predecessors.get(w)!.push(v);
        }
      });
    }

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of predecessors.get(w)!) {
        const contribution = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contribution);
      }
      if (w !== s) {
        centrality.set(w, centrality.get(w)! + delta.get(w)!);
      }
    }
  }

  // Normalize
  const n = graph.order;
  const normFactor = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;
  centrality.forEach((val, key) => {
    centrality.set(key, val * normFactor);
  });

  return centrality;
}

export function computeSectorBridgingScore(graph: Graph): Map<string, number> {
  const scores = new Map<string, number>();
  graph.forEachNode((node) => {
    const nodeType = graph.getNodeAttribute(node, 'type');
    const neighborSectors = new Set<string>();
    graph.forEachNeighbor(node, (neighbor) => {
      const nType = graph.getNodeAttribute(neighbor, 'type');
      if (nType !== nodeType) {
        neighborSectors.add(nType);
      }
    });
    scores.set(node, neighborSectors.size / 4); // max 4 other sectors
  });
  return scores;
}

export interface CriticalNodeInfo {
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

export async function getCriticalNodes(limit: number = 10): Promise<CriticalNodeInfo[]> {
  const { graph, nodeMap } = await buildGraph();

  const degree = computeDegreeCentrality(graph);
  const betweenness = computeBetweennessCentrality(graph);
  const bridging = computeSectorBridgingScore(graph);

  const results: CriticalNodeInfo[] = [];

  graph.forEachNode((nodeId) => {
    const node = nodeMap.get(nodeId)!;
    const dc = degree.get(nodeId) || 0;
    const bc = betweenness.get(nodeId) || 0;
    const bs = bridging.get(nodeId) || 0;
    const inherent = (node.criticalityScore || 50) / 100;

    const compositeScore = (dc * 0.25 + bc * 0.3 + bs * 0.25 + inherent * 0.2) * 100;

    results.push({
      nodeId,
      name: node.name,
      type: node.type,
      subtype: node.subtype,
      criticalityScore: node.criticalityScore,
      degreeCentrality: Math.round(dc * 1000) / 1000,
      betweennessCentrality: Math.round(bc * 1000) / 1000,
      sectorBridgingScore: Math.round(bs * 1000) / 1000,
      compositeScore: Math.round(compositeScore * 100) / 100,
    });
  });

  results.sort((a, b) => b.compositeScore - a.compositeScore);
  return results.slice(0, limit);
}
