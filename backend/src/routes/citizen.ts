import { Router, Request, Response } from 'express';
import InfrastructureNode from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';
import WeatherEvent from '../models/WeatherEvent';
import Alert from '../models/Alert';
import { authenticate as authMiddleware } from '../middleware/auth';
import { calculateETA } from '../services/emergencyResponseService';

const router = Router();

function getUptime(node: any): number {
  const val = node?.uptime ?? node?.properties?.uptime;
  if (typeof val !== 'number') return 100;
  return Math.max(0, Math.min(100, val));
}

function getCriticality(node: any): number {
  const val = node?.criticality ?? node?.criticalityScore ?? node?.properties?.criticality;
  if (typeof val !== 'number') return 50;
  return Math.max(0, Math.min(100, val));
}

function getNodeLatLng(node: any): { lat: number; lng: number } | null {
  if (node?.location?.lat != null && node?.location?.lng != null) {
    return { lat: Number(node.location.lat), lng: Number(node.location.lng) };
  }
  if (Array.isArray(node?.location?.coordinates) && node.location.coordinates.length >= 2) {
    return { lat: Number(node.location.coordinates[1]), lng: Number(node.location.coordinates[0]) };
  }
  return null;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

router.use(authMiddleware);

// GET /api/citizen/passport/:wardId
router.get('/passport/:wardId', async (req: Request, res: Response) => {
  try {
    const wardId = String(req.params.wardId || '');
    let wardNodes = await InfrastructureNode.find({ zone: new RegExp(wardId, 'i') }).lean();

    if (wardNodes.length === 0) {
      const zones = await WeatherEvent.find({
        season: 'monsoon',
        zoneName: new RegExp(wardId, 'i'),
      }).lean();
      const ids = zones.flatMap((z) => z.affectedNodeIds || []);
      if (ids.length > 0) {
        wardNodes = await InfrastructureNode.find({ _id: { $in: ids } }).lean();
      }
    }

    if (wardNodes.length === 0) {
      return res.status(404).json({ error: 'No nodes found for ward' });
    }

    const wardNodeIds = wardNodes.map((n: any) => n._id);
    const uptimeValues = wardNodes.map((n) => getUptime(n));
    const avgUptime = uptimeValues.reduce((a, b) => a + b, 0) / uptimeValues.length;
    const critCount = wardNodes.filter((n) => n.status === 'failed' || n.status === 'degraded').length;
    const criticalFraction = critCount / wardNodes.length;
    const overallResilienceScore = Math.max(
      0,
      Math.min(100, Math.round(avgUptime * (1 - criticalFraction))),
    );

    const powerNodes = wardNodes
      .filter((n) => n.type === 'power')
      .sort((a, b) => getCriticality(b) - getCriticality(a));
    const waterNodes = wardNodes
      .filter((n) => n.type === 'water')
      .sort((a, b) => getCriticality(b) - getCriticality(a));

    const powerOutageRiskHrs = powerNodes.length > 0
      ? Math.round(((1 - getUptime(powerNodes[0]) / 100) * 24 * getCriticality(powerNodes[0]) / 10) * 10) / 10
      : 0;

    const waterDisruptionHrs = waterNodes.length > 0
      ? Math.round(((1 - getUptime(waterNodes[0]) / 100) * 24 * getCriticality(waterNodes[0]) / 10) * 10) / 10
      : 0;

    const wardCentreNode: any = wardNodes.find((n) => n.type === 'transport') || wardNodes[0];
    const etaResult = await calculateETA('ambulance', wardCentreNode._id.toString());
    const ambulanceETA = etaResult.adjustedETA;

    const zones = await WeatherEvent.find({
      affectedNodeIds: { $in: wardNodeIds },
      season: 'monsoon',
    }).lean();

    let monsoonRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (zones.some((z) => z.floodZone)) monsoonRisk = 'HIGH';
    else if (zones.some((z) => z.riskMultiplier > 1.5)) monsoonRisk = 'MEDIUM';

    const dependencyCount = await Dependency.countDocuments({ sourceNodeId: { $in: wardNodeIds } });

    const shelters = await InfrastructureNode.find({
      type: 'emergency',
      $or: [{ name: /shelter/i }, { name: /EOC/i }, { subtype: 'shelter' }],
    }).lean();

    let nearestShelter = { name: 'N/A', distanceKm: 0 };
    const wardCenter = getNodeLatLng(wardCentreNode);

    if (wardCenter && shelters.length > 0) {
      const withDist = shelters
        .map((s) => {
          const loc = getNodeLatLng(s);
          if (!loc) return null;
          return { name: s.name, distanceKm: haversineKm(wardCenter, loc) };
        })
        .filter(Boolean) as Array<{ name: string; distanceKm: number }>;

      if (withDist.length > 0) {
        withDist.sort((a, b) => a.distanceKm - b.distanceKm);
        nearestShelter = {
          name: withDist[0].name,
          distanceKm: Math.round(withDist[0].distanceKm * 10) / 10,
        };
      }
    }

    return res.json({
      overallResilienceScore,
      powerOutageRiskHrs,
      waterDisruptionHrs,
      ambulanceETA,
      monsoonRisk,
      dependencyCount,
      nearestShelter,
      totalNodes: wardNodes.length,
      criticalNodes: critCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/citizen/alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const wardId = String(req.query.wardId || '').trim();
    if (!wardId) {
      return res.status(400).json({ error: 'wardId is required' });
    }

    const alerts = await Alert.find({ wardId: new RegExp(`^${wardId}$`, 'i') })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('nodeId', 'name zone type status')
      .lean();

    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/citizen/checklist/:wardId
router.get('/checklist/:wardId', async (req: Request, res: Response) => {
  try {
    const wardId = String(req.params.wardId || '');

    const isFloodZone =
      (await WeatherEvent.countDocuments({
        season: 'monsoon',
        floodZone: true,
        zoneName: new RegExp(wardId, 'i'),
      })) > 0;

    const baseItems = [
      { id: 'c1', text: 'Store 3 litres of drinking water per person per day', category: 'water', priority: 1 },
      { id: 'c2', text: 'Keep mobile phone charged above 80% at night', category: 'power', priority: 1 },
      { id: 'c3', text: 'Save KEM Hospital number: 022-24107000', category: 'emergency', priority: 1 },
      { id: 'c4', text: 'Know your nearest BEST bus depot for evacuation', category: 'emergency', priority: 2 },
      { id: 'c5', text: 'Keep a torch with working batteries at home', category: 'power', priority: 2 },
      { id: 'c6', text: 'Check your building water tank level weekly', category: 'water', priority: 2 },
      { id: 'c7', text: 'Save Mumbai Disaster Management helpline: 1916', category: 'emergency', priority: 1 },
      { id: 'c8', text: 'Note your nearest emergency shelter address', category: 'emergency', priority: 3 },
    ];

    const floodItems = [
      { id: 'f1', text: 'Keep waterproofed documents in a raised waterproof bag', category: 'monsoon', priority: 1 },
      { id: 'f2', text: 'Do not walk through flooded streets — 30cm water can knock you down', category: 'monsoon', priority: 1 },
      { id: 'f3', text: 'Register on the MCGM MyBMC flood alert WhatsApp channel', category: 'monsoon', priority: 2 },
    ];

    return res.json(isFloodZone ? [...baseItems, ...floodItems] : baseItems);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
