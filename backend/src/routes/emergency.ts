import { Router, Request, Response } from 'express';
import {
  calculateEmergencyResponse,
  getZoneResilience,
  getPredictiveFailures,
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

export default router;
