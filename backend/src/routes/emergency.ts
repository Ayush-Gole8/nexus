import { Router, Request, Response } from 'express';
import {
  calculateEmergencyResponse,
  getZoneResilience,
  getPredictiveFailures,
  calculateETA,
  getServiceCoverage,
} from '../services/emergencyResponseService';

const router = Router();

// POST /api/emergency/response — calculate emergency response times
router.post('/response', async (req: Request, res: Response) => {
  try {
    const { lat, lng, type } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const result = await calculateEmergencyResponse(
      parseFloat(lat),
      parseFloat(lng),
      type || 'fire'
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/emergency/zone-resilience — zone-wise resilience scores
router.get('/zone-resilience', async (_req: Request, res: Response) => {
  try {
    const resilience = await getZoneResilience();
    res.json(resilience);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/emergency/predictive-failures — predictive failure analysis
router.get('/predictive-failures', async (_req: Request, res: Response) => {
  try {
    const failures = await getPredictiveFailures();
    res.json(failures);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/emergency/eta — single-service ETA calculation
// body: { serviceType: 'fire'|'ambulance'|'police', incidentNodeId: string }
router.post('/eta', async (req: Request, res: Response) => {
  try {
    const { serviceType, incidentNodeId } = req.body;
    if (!serviceType || !['fire', 'ambulance', 'police'].includes(serviceType)) {
      return res.status(400).json({ error: 'serviceType must be fire, ambulance, or police' });
    }
    if (!incidentNodeId || typeof incidentNodeId !== 'string') {
      return res.status(400).json({ error: 'incidentNodeId is required' });
    }
    const result = await calculateETA(serviceType, incidentNodeId);
    res.json(result);
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

// GET /api/emergency/coverage — coverage radius per emergency service base
router.get('/coverage', async (_req: Request, res: Response) => {
  try {
    const coverage = await getServiceCoverage();
    res.json(coverage);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/emergency/simulate-incident — run all 3 service ETAs in parallel
// body: { nodeId: string, type: string }
router.post('/simulate-incident', async (req: Request, res: Response) => {
  try {
    const { nodeId, type } = req.body;
    if (!nodeId || typeof nodeId !== 'string') {
      return res.status(400).json({ error: 'nodeId is required' });
    }

    const [fireETA, ambulanceETA, policeETA] = await Promise.all([
      calculateETA('fire', nodeId),
      calculateETA('ambulance', nodeId),
      calculateETA('police', nodeId),
    ]);

    const firstResponder = [fireETA, ambulanceETA, policeETA].reduce((best, cur) =>
      cur.adjustedETA < best.adjustedETA ? cur : best,
    );

    res.json({
      incidentNodeId: nodeId,
      incidentType: type || 'unknown',
      services: { fire: fireETA, ambulance: ambulanceETA, police: policeETA },
      summary: {
        firstResponder: firstResponder.serviceType,
        firstArrivalETA: firstResponder.adjustedETA,
        allServicesETA: {
          fire: fireETA.adjustedETA,
          ambulance: ambulanceETA.adjustedETA,
          police: policeETA.adjustedETA,
        },
        maxGoldenHourPct: Math.max(
          fireETA.goldenHourPct,
          ambulanceETA.goldenHourPct,
          policeETA.goldenHourPct,
        ),
        totalBlockedNodes: [
          ...new Set([
            ...fireETA.blockedNodes,
            ...ambulanceETA.blockedNodes,
            ...policeETA.blockedNodes,
          ]),
        ],
      },
    });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

export default router;
