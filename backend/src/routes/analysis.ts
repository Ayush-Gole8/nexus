import { Router, Request, Response } from 'express';
import { runCascadeAnalysis } from '../services/cascadeEngine';
import { getCriticalNodes } from '../services/graphService';

const router = Router();

// POST /api/analysis/cascade — run cascade analysis for given node(s)
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

// GET /api/analysis/critical-nodes — get ranked critical nodes
router.get('/critical-nodes', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const criticalNodes = await getCriticalNodes(limit);
    res.json(criticalNodes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
