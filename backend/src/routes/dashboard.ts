import { Router, Request, Response } from 'express';
import InfrastructureNode from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';
import { getCriticalNodes } from '../services/graphService';

const router = Router();

// GET /api/dashboard/metrics — aggregated dashboard data
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const nodes = await InfrastructureNode.find().lean();
    const deps = await Dependency.find().lean();

    // Nodes by sector
    const bySector: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const node of nodes) {
      bySector[node.type] = (bySector[node.type] || 0) + 1;
      byStatus[node.status] = (byStatus[node.status] || 0) + 1;
    }

    // Dependencies by type
    const depsByType: Record<string, number> = {};
    for (const dep of deps) {
      depsByType[dep.dependencyType] = (depsByType[dep.dependencyType] || 0) + 1;
    }

    // Critical nodes
    let criticalNodes: Awaited<ReturnType<typeof getCriticalNodes>> = [];
    try {
      criticalNodes = await getCriticalNodes(10);
    } catch {
      // empty graph
    }

    // Resilience score (simple composite)
    const totalNodes = nodes.length || 1;
    const operationalPct = (byStatus['operational'] || 0) / totalNodes;
    const avgCriticality =
      nodes.reduce((sum, n) => sum + (n.criticalityScore || 50), 0) / totalNodes / 100;
    const connectivityRatio = deps.length / Math.max(1, totalNodes);
    const redundancyFactor = Math.min(1, connectivityRatio / 3);
    const resilienceScore = Math.round(
      (operationalPct * 40 + redundancyFactor * 30 + (1 - avgCriticality) * 30)
    );

    // Sector vulnerability (% of nodes with high criticality and few connections)
    const sectorVulnerability: Record<string, number> = {};
    for (const sector of Object.keys(bySector)) {
      const sectorNodes = nodes.filter((n) => n.type === sector);
      const vulnerable = sectorNodes.filter((n) => n.criticalityScore >= 70);
      sectorVulnerability[sector] = Math.round(
        (vulnerable.length / Math.max(1, sectorNodes.length)) * 100
      );
    }

    res.json({
      totalNodes: nodes.length,
      totalDependencies: deps.length,
      bySector,
      byStatus,
      depsByType,
      criticalNodes,
      resilienceScore,
      sectorVulnerability,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
