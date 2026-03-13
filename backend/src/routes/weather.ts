import { Router, Request, Response } from 'express';
import WeatherEvent from '../models/WeatherEvent';
import InfrastructureNode from '../models/InfrastructureNode';
import { authenticate as authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/weather/monsoon-risk
// body: { rainfall_mm: number }
router.post('/monsoon-risk', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { rainfall_mm } = req.body;

    if (typeof rainfall_mm !== 'number' || rainfall_mm < 50 || rainfall_mm > 500) {
      return res.status(400).json({ error: 'rainfall_mm must be a number between 50 and 500' });
    }

    const [events, nodes] = await Promise.all([
      WeatherEvent.find({ season: 'monsoon' }).lean(),
      InfrastructureNode.find().lean(),
    ]);

    const riskMap = new Map<string, { riskMultiplier: number; floodZone: boolean; zoneName: string }>();
    for (const event of events) {
      const zoneEntry = {
        riskMultiplier: event.riskMultiplier,
        floodZone: event.floodZone,
        zoneName: event.zoneName,
      };

      for (const id of event.affectedNodeIds || []) {
        const nodeId = id.toString();
        const existing = riskMap.get(nodeId);
        if (!existing || zoneEntry.riskMultiplier > existing.riskMultiplier) {
          riskMap.set(nodeId, zoneEntry);
        }
      }
    }

    const results = nodes.map((node) => {
      const uptime = typeof (node.properties as Record<string, unknown> | undefined)?.uptime === 'number'
        ? Number((node.properties as Record<string, unknown>).uptime)
        : 100;
      const baseVuln = 1 - uptime / 100;
      const zoneData = riskMap.get(node._id.toString()) ?? {
        riskMultiplier: 0.5,
        floodZone: false,
        zoneName: 'None',
      };

      const adjustedFailProb = Math.min(
        1,
        baseVuln * zoneData.riskMultiplier * (rainfall_mm / 100),
      );
      const adjustedFailProbPct = Math.round(adjustedFailProb * 1000) / 10;

      return {
        nodeId: node._id,
        name: node.name,
        zone: node.zone,
        type: node.type,
        status: node.status,
        uptime,
        adjustedFailProbPct,
        floodZone: zoneData.floodZone,
        zoneName: zoneData.zoneName,
      };
    });

    results.sort((a, b) => b.adjustedFailProbPct - a.adjustedFailProbPct);

    return res.json(results);
  } catch (err) {
    console.error('Monsoon risk error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/weather/flood-zones
router.get('/flood-zones', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const events = await WeatherEvent.find({ floodZone: true, season: 'monsoon' })
      .select('zoneName riskMultiplier affectedNodeIds floodZone historicalFailures season')
      .sort({ riskMultiplier: -1 })
      .lean();

    return res.json(events);
  } catch (err) {
    console.error('Flood zones error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/weather/monsoon-zones
router.get('/monsoon-zones', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const zones = await WeatherEvent.find({ season: 'monsoon' })
      .populate('affectedNodeIds', 'name type zone location status properties')
      .sort({ riskMultiplier: -1 })
      .lean();
    return res.json(zones);
  } catch (err) {
    console.error('Monsoon zones error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
