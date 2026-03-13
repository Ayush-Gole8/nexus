import { Router, Request, Response } from 'express';
import WeatherEvent from '../models/WeatherEvent';

const router = Router();

// POST /api/weather/monsoon-risk
// body: { rainfall_mm: number }
// Returns all nodes with monsoon WeatherEvent records, ranked by adjusted failure probability.
// adjustedFailProb = baseVulnerability * riskMultiplier * (rainfall_mm / 100), clamped to [0, 1]
router.post('/monsoon-risk', async (req: Request, res: Response) => {
  try {
    const { rainfall_mm } = req.body;

    if (typeof rainfall_mm !== 'number' || rainfall_mm < 0) {
      return res.status(400).json({ error: 'rainfall_mm must be a non-negative number' });
    }

    const events = await WeatherEvent.find({ season: 'monsoon' }).populate('nodeId');

    const results = events.map((event) => {
      const node = event.nodeId as unknown as Record<string, any>;

      // baseVulnerability blends load ratio (0–1) and status degradation
      const loadRatio = node.capacity > 0
        ? node.currentLoad / node.capacity
        : 0;
      const statusPenalty =
        node.status === 'failed'      ? 1.0 :
        node.status === 'degraded'    ? 0.6 :
        node.status === 'maintenance' ? 0.4 : 0.2;
      const baseVulnerability = Math.min(1, loadRatio * 0.6 + statusPenalty * 0.4);

      const adjustedFailProb = Math.min(
        1,
        baseVulnerability * event.riskMultiplier * (rainfall_mm / 100),
      );

      return {
        nodeId:             node._id,
        name:               node.name,
        type:               node.type,
        status:             node.status,
        zone:               event.zoneName,
        floodZone:          event.floodZone,
        riskMultiplier:     event.riskMultiplier,
        historicalFailures: event.historicalFailures,
        baseVulnerability:  Math.round(baseVulnerability * 1000) / 1000,
        adjustedFailProb:   Math.round(adjustedFailProb * 1000) / 1000,
      };
    });

    results.sort((a, b) => b.adjustedFailProb - a.adjustedFailProb);

    return res.json({
      rainfall_mm,
      totalNodesAssessed: results.length,
      highRiskCount:      results.filter((r) => r.adjustedFailProb >= 0.7).length,
      mediumRiskCount:    results.filter((r) => r.adjustedFailProb >= 0.4 && r.adjustedFailProb < 0.7).length,
      lowRiskCount:       results.filter((r) => r.adjustedFailProb < 0.4).length,
      nodes:              results,
    });
  } catch (err) {
    console.error('Monsoon risk error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/weather/flood-zones
// Returns all monsoon WeatherEvent records with basic node info, no rainfall calculation.
router.get('/flood-zones', async (_req: Request, res: Response) => {
  try {
    const events = await WeatherEvent.find({ floodZone: true, season: 'monsoon' })
      .populate('nodeId', 'name type status location criticalityScore')
      .sort({ riskMultiplier: -1 });

    return res.json(events);
  } catch (err) {
    console.error('Flood zones error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
