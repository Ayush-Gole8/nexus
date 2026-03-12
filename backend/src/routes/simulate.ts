import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { runBFSCascade } from '../services/cascadeEngine';
import SimulationResult from '../models/SimulationResult';

const router = Router();

// POST /api/simulate — run BFS cascade and persist result
router.post('/', async (req: Request, res: Response) => {
  try {
    const { scenario, originNodeId, magnitude = 0.7, resilience = 0.3 } = req.body;

    if (!originNodeId || typeof originNodeId !== 'string') {
      return res.status(400).json({ error: 'originNodeId is required' });
    }
    if (typeof magnitude !== 'number' || magnitude < 0 || magnitude > 1) {
      return res.status(400).json({ error: 'magnitude must be a number in [0, 1]' });
    }
    if (typeof resilience !== 'number' || resilience < 0 || resilience > 1) {
      return res.status(400).json({ error: 'resilience must be a number in [0, 1]' });
    }

    const bfsResult = await runBFSCascade(originNodeId, magnitude, resilience);

    // Map string node IDs to the format the SimulationResult model expects
    const impactedNodes = bfsResult.affectedNodes.flatMap((nid, idx) => {
      try {
        const oid = new mongoose.Types.ObjectId(nid);
        const step = bfsResult.propagationSteps.findIndex((s) => s.includes(nid));
        return [{
          nodeId: oid,
          impactLevel: idx === 0 ? ('direct' as const) : ('cascading' as const),
          newStatus: 'failed' as const,
          propagationStep: Math.max(0, step),
          impactScore: idx === 0 ? 1.0 : Math.max(0.3, 1.0 - step * 0.1),
        }];
      } catch {
        return [];
      }
    });

    const docData: any = {
      originNodeId,
      magnitude,
      resilience,
      affectedNodes: bfsResult.affectedNodes,
      propagationSteps: bfsResult.propagationSteps,
      populationImpactPct: bfsResult.populationImpactPct,
      recoveryHours: bfsResult.recoveryHours,
      impactedNodes,
      propagationPaths: [],
      summary: {
        totalAffected: bfsResult.affectedNodes.length,
        bySector: bfsResult.impactBySector,
        criticalNodesHit: [],
        maxPropagationDepth: bfsResult.cascadeDepth,
      },
    };

    if (scenario && mongoose.isValidObjectId(scenario)) {
      docData.scenarioId = new mongoose.Types.ObjectId(scenario);
    }

    const saved = await SimulationResult.create(docData);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/simulate/:id — fetch saved simulation result by its _id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await SimulationResult.findById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Simulation result not found' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
