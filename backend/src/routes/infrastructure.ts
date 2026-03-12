import { Router, Request, Response } from 'express';
import InfrastructureNode from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';

const router = Router();

// ========== NODES ==========

// GET /api/nodes — list all nodes with optional filters
router.get('/nodes', async (req: Request, res: Response) => {
  try {
    const { type, status, search } = req.query;
    const filter: Record<string, any> = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const nodes = await InfrastructureNode.find(filter).sort({ criticalityScore: -1 });
    res.json(nodes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/nodes/:id — single node
router.get('/nodes/:id', async (req: Request, res: Response) => {
  try {
    const node = await InfrastructureNode.findById(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });

    const dependencies = await Dependency.find({
      $or: [{ sourceNodeId: node._id }, { targetNodeId: node._id }],
    })
      .populate('sourceNodeId', 'name type subtype')
      .populate('targetNodeId', 'name type subtype');

    res.json({ node, dependencies });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/nodes — create node
router.post('/nodes', async (req: Request, res: Response) => {
  try {
    const node = await InfrastructureNode.create(req.body);
    res.status(201).json(node);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/nodes/:id — update node
router.put('/nodes/:id', async (req: Request, res: Response) => {
  try {
    const node = await InfrastructureNode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json(node);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/nodes/:id — delete node + its dependencies
router.delete('/nodes/:id', async (req: Request, res: Response) => {
  try {
    const node = await InfrastructureNode.findByIdAndDelete(req.params.id);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    await Dependency.deleteMany({
      $or: [{ sourceNodeId: node._id }, { targetNodeId: node._id }],
    });
    res.json({ message: 'Node and associated dependencies deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== DEPENDENCIES ==========

// GET /api/dependencies
router.get('/dependencies', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const filter: Record<string, any> = {};
    if (type) filter.dependencyType = type;
    const deps = await Dependency.find(filter)
      .populate('sourceNodeId', 'name type subtype')
      .populate('targetNodeId', 'name type subtype');
    res.json(deps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dependencies
router.post('/dependencies', async (req: Request, res: Response) => {
  try {
    const dep = await Dependency.create(req.body);
    res.status(201).json(dep);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/dependencies/:id
router.put('/dependencies/:id', async (req: Request, res: Response) => {
  try {
    const dep = await Dependency.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!dep) return res.status(404).json({ error: 'Dependency not found' });
    res.json(dep);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/dependencies/:id
router.delete('/dependencies/:id', async (req: Request, res: Response) => {
  try {
    const dep = await Dependency.findByIdAndDelete(req.params.id);
    if (!dep) return res.status(404).json({ error: 'Dependency not found' });
    res.json({ message: 'Dependency deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== GRAPH (React Flow format) ==========

router.get('/graph', async (_req: Request, res: Response) => {
  try {
    const nodes = await InfrastructureNode.find().lean();
    const deps = await Dependency.find().lean();

    const sectorColors: Record<string, string> = {
      power: '#ffb800',
      water: '#00d4ff',
      transport: '#00ff9d',
      telecom: '#b44dff',
      emergency: '#ff4d6d',
    };

    // Group nodes by sector for clustered layout
    const sectorGroups: Record<string, any[]> = {};
    for (const node of nodes) {
      const t = (node as any).type || 'unknown';
      if (!sectorGroups[t]) sectorGroups[t] = [];
      sectorGroups[t].push(node);
    }

    const sectors = Object.keys(sectorGroups);
    const centerX = 900;
    const centerY = 600;
    const clusterRadius = 420;
    const nodeMap = new Map<string, { x: number; y: number }>();

    sectors.forEach((sector, si) => {
      const angle = (si / sectors.length) * 2 * Math.PI - Math.PI / 2;
      const cx = centerX + Math.cos(angle) * clusterRadius;
      const cy = centerY + Math.sin(angle) * clusterRadius;
      const group = sectorGroups[sector];
      const innerRadius = Math.max(80, group.length * 22);

      group.forEach((node: any, ni: number) => {
        const nodeAngle = (ni / group.length) * 2 * Math.PI;
        const r = innerRadius * (0.4 + 0.6 * (ni % 3) / 2);
        nodeMap.set(node._id.toString(), {
          x: cx + Math.cos(nodeAngle) * r,
          y: cy + Math.sin(nodeAngle) * r,
        });
      });
    });

    // Simple force-repulsion pass to reduce overlap
    const allPositions = Array.from(nodeMap.entries());
    for (let iter = 0; iter < 30; iter++) {
      for (let i = 0; i < allPositions.length; i++) {
        for (let j = i + 1; j < allPositions.length; j++) {
          const dx = allPositions[j][1].x - allPositions[i][1].x;
          const dy = allPositions[j][1].y - allPositions[i][1].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 210;
          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.3;
            allPositions[i][1].x -= dx * force;
            allPositions[i][1].y -= dy * force;
            allPositions[j][1].x += dx * force;
            allPositions[j][1].y += dy * force;
          }
        }
      }
    }

    // Write back resolved positions
    for (const [id, pos] of allPositions) {
      nodeMap.set(id, pos);
    }

    const rfNodes = nodes.map((node: any) => {
      const pos = nodeMap.get(node._id.toString()) || { x: 0, y: 0 };
      return {
        id: node._id.toString(),
        type: 'infrastructureNode',
        position: { x: Math.round(pos.x), y: Math.round(pos.y) },
        data: {
          ...node,
          _id: node._id.toString(),
          color: sectorColors[node.type] || '#6B7280',
        },
      };
    });

    const rfEdges = deps.map((dep: any) => {
      const sourceType = nodes.find((n: any) => n._id.toString() === dep.sourceNodeId.toString())?.type;
      return {
        id: dep._id.toString(),
        source: dep.sourceNodeId.toString(),
        target: dep.targetNodeId.toString(),
        type: 'smoothstep',
        animated: dep.strength > 0.7,
        style: {
          stroke: sectorColors[sourceType as string] || '#94A3B8',
          strokeWidth: Math.max(1, dep.strength * 3),
          opacity: 0.5 + dep.strength * 0.3,
        },
        data: {
          dependencyType: dep.dependencyType,
          strength: dep.strength,
        },
      };
    });

    res.json({ nodes: rfNodes, edges: rfEdges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
