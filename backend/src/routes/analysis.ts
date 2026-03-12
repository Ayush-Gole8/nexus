import { Router, Request, Response } from 'express';
import { runCascadeAnalysis } from '../services/cascadeEngine';
import {
  buildGraph,
  computeBetweennessCentrality,
  getCriticalNodes,
} from '../services/graphService';
import InfrastructureNode from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';

const router = Router();

const SECTORS = ['power', 'water', 'transport', 'telecom', 'emergency'] as const;

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Deterministic BFS cascade (no randomness) — used internally for the impact
 * matrix so that the result is stable across requests.
 * A node fails if failProb >= threshold (default 0.5).
 */
function deterministicBFS(
  originId: string,
  magnitude: number,
  resilience: number,
  adjacency: Map<string, Array<{ targetId: string; weight: number; type: string }>>,
  threshold = 0.5,
): Set<string> {
  const affected = new Set<string>([originId]);
  let frontier = [originId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const nodeId of frontier) {
      for (const { targetId, weight, type } of (adjacency.get(nodeId) ?? [])) {
        if (affected.has(targetId)) continue;
        let failProb = magnitude * (weight / 5) * (1 - resilience);
        if (type === 'critical') failProb *= 1.5;
        if (Math.min(1.0, failProb) >= threshold) {
          affected.add(targetId);
          next.push(targetId);
        }
      }
    }
    frontier = next;
  }
  return affected;
}

// ── POST /api/analysis/cascade ──────────────────────────────────────────────

router.post('/cascade', async (req: Request, res: Response) => {
  try {
    const { nodeIds, options } = req.body;
    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
      return res.status(400).json({ error: 'nodeIds array is required' });
    }
    const result = await runCascadeAnalysis(nodeIds, options || {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analysis/centrality — betweenness centrality for every node ─────
// 3d

router.get('/centrality', async (_req: Request, res: Response) => {
  try {
    const { graph } = await buildGraph();
    const centrality = computeBetweennessCentrality(graph);
    const result: Record<string, number> = {};
    centrality.forEach((score, nodeId) => {
      result[nodeId] = Math.round(score * 100000) / 100000;
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analysis/critical-nodes — top 10 by betweenness × criticality ──
// 3e (overrides previous implementation)

router.get('/critical-nodes', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const { graph, nodeMap } = await buildGraph();
    const betweenness = computeBetweennessCentrality(graph);

    const ranked = Array.from(nodeMap.entries()).map(([nodeId, node]) => {
      const bc = betweenness.get(nodeId) ?? 0;
      const criticality = (node.criticalityScore ?? 50) / 100;
      const score = bc * criticality;
      return {
        nodeId,
        name: node.name,
        type: node.type,
        subtype: node.subtype,
        zone: (node as any).zone,
        criticalityScore: node.criticalityScore,
        betweennessCentrality: Math.round(bc * 100000) / 100000,
        score: Math.round(score * 100000) / 100000,
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    res.json(ranked.slice(0, limit));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analysis/impact-matrix — 5×5 cross-sector cascade matrix ────────
// 3f

router.get('/impact-matrix', async (_req: Request, res: Response) => {
  try {
    const { graph, nodeMap } = await buildGraph();

    // build adjacency (weight 0-5)
    type Nbr = { targetId: string; weight: number; type: string };
    const adjacency = new Map<string, Nbr[]>();
    graph.forEachNode((nodeId) => {
      const nbrs: Nbr[] = [];
      graph.forEachOutEdge(nodeId, (_e, attrs, _s, target) => {
        nbrs.push({
          targetId: target,
          weight: (attrs.strength ?? 0.5) * 5,
          type: attrs.dependencyType ?? 'operational',
        });
      });
      adjacency.set(nodeId, nbrs);
    });

    // sector → list of node IDs
    const sectorNodes: Record<string, string[]> = {};
    for (const sector of SECTORS) sectorNodes[sector] = [];
    nodeMap.forEach((node, nodeId) => {
      if (sectorNodes[node.type]) sectorNodes[node.type].push(nodeId);
    });

    // for each source sector find the highest-criticality node
    const topNode: Record<string, string | null> = {};
    for (const sector of SECTORS) {
      let best: string | null = null;
      let bestScore = -1;
      for (const nid of sectorNodes[sector]) {
        const cs = nodeMap.get(nid)?.criticalityScore ?? 0;
        if (cs > bestScore) { bestScore = cs; best = nid; }
      }
      topNode[sector] = best;
    }

    const matrix: Record<string, Record<string, number>> = {};
    for (const src of SECTORS) {
      matrix[src] = {};
      const origin = topNode[src];
      if (!origin) {
        for (const tgt of SECTORS) matrix[src][tgt] = 0;
        continue;
      }
      const affected = deterministicBFS(origin, 0.8, 0.2, adjacency);
      for (const tgt of SECTORS) {
        const total = sectorNodes[tgt].length;
        const hit = sectorNodes[tgt].filter((nid) => affected.has(nid)).length;
        matrix[src][tgt] = total > 0 ? Math.round((hit / total) * 1000) / 10 : 0;
      }
    }

    res.json({ sectors: SECTORS, matrix });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/analysis/vulnerability — per-sector avg incoming edge strength ──
// 3g

router.get('/vulnerability', async (_req: Request, res: Response) => {
  try {
    const { nodeMap } = await buildGraph();
    const deps = await Dependency.find().lean();

    // map targetNodeId → sector
    const idToSector = new Map<string, string>();
    nodeMap.forEach((node, id) => idToSector.set(id, node.type));

    const sectorStrengths: Record<string, number[]> = {};
    for (const sector of SECTORS) sectorStrengths[sector] = [];

    for (const dep of deps) {
      const targetId = dep.targetNodeId.toString();
      const sector = idToSector.get(targetId);
      if (sector) sectorStrengths[sector].push(dep.strength ?? 0.5);
    }

    const vulnerability: Record<string, number> = {};
    for (const sector of SECTORS) {
      const arr = sectorStrengths[sector];
      vulnerability[sector] =
        arr.length > 0
          ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 1000) / 1000
          : 0;
    }

    res.json(vulnerability);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
