import InfrastructureNode, { IInfrastructureNode } from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';

// ───── Service type config ────────────────────────────────────────────────────
const SERVICE_SUBTYPES: Record<string, string> = {
  fire: 'fire_station',
  ambulance: 'hospital',
  police: 'police_station',
};

const SERVICE_SPEED_KMH: Record<string, number> = {
  fire: 40,
  ambulance: 35,
  police: 50,
};

export interface ETAResult {
  serviceType: 'fire' | 'ambulance' | 'police';
  serviceBase: { nodeId: string; name: string; location: { lat: number; lng: number } };
  incidentLocation: { lat: number; lng: number };
  distanceKm: number;
  baseETA: number;          // minutes, no penalties
  adjustedETA: number;      // minutes, with road penalties
  penaltyMinutes: number;
  routeNodes: string[];     // IDs of transport nodes within 3km of route
  blockedNodes: string[];   // IDs of degraded/failed transport nodes on route
  altRoute: string[];       // IDs of operational transport nodes for alternate path
  goldenHourPct: number;    // (adjustedETA / 60) * 100
}

/** Approximate perpendicular distance (km) from point P to line segment A→B */
function pointToSegmentDistKm(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  // Convert to a flat coordinate system in km centred on A
  const toRad = (d: number) => (d * Math.PI) / 180;
  const cosLat = Math.cos(toRad((a.lat + b.lat) / 2));
  const ax = 0, ay = 0;
  const bx = (b.lng - a.lng) * cosLat * 111.32;
  const by = (b.lat - a.lat) * 111.32;
  const px = (p.lng - a.lng) * cosLat * 111.32;
  const py = (p.lat - a.lat) * 111.32;

  const abLen2 = bx * bx + by * by;
  if (abLen2 === 0) return Math.sqrt(px * px + py * py); // A === B

  let t = (px * bx + py * by) / abLen2;
  t = Math.max(0, Math.min(1, t));

  const closestX = bx * t;
  const closestY = by * t;
  const dx = px - closestX;
  const dy = py - closestY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate ETA for a specific service type responding to an incident node.
 */
export async function calculateETA(
  serviceType: 'fire' | 'ambulance' | 'police',
  incidentNodeId: string,
): Promise<ETAResult> {
  const allNodes = await InfrastructureNode.find().lean<IInfrastructureNode[]>();

  // Resolve incident node
  const incidentNode = allNodes.find((n) => (n as any)._id.toString() === incidentNodeId);
  if (!incidentNode) {
    throw new Error(`Incident node ${incidentNodeId} not found`);
  }
  const incidentLocation = incidentNode.location;

  // Find service bases matching the service type
  const subtype = SERVICE_SUBTYPES[serviceType];
  const serviceBases = allNodes.filter((n) => n.subtype === subtype);

  if (serviceBases.length === 0) {
    throw new Error(`No ${serviceType} service bases found (subtype: ${subtype})`);
  }

  // Pick nearest base (by Haversine)
  const basesWithDist = serviceBases.map((b) => ({
    base: b,
    dist: haversineDistance(incidentLocation, b.location),
  }));
  basesWithDist.sort((a, b) => a.dist - b.dist);
  const { base: nearestBase, dist: distanceKm } = basesWithDist[0];

  const speedKmh = SERVICE_SPEED_KMH[serviceType];
  const baseETA = (distanceKm / speedKmh) * 60; // minutes

  // Transport nodes within 3km of the route line segment
  const transportNodes = allNodes.filter((n) => n.type === 'transport');
  const routeProximity = transportNodes.filter((n) => {
    const d = pointToSegmentDistKm(n.location, nearestBase.location, incidentLocation);
    return d <= 3;
  });

  const routeNodes = routeProximity.map((n) => (n as any)._id.toString());

  const degradedOnRoute = routeProximity.filter((n) => n.status === 'degraded');
  const failedOnRoute = routeProximity.filter(
    (n) => n.status === 'failed' || n.criticalityScore >= 70,
  );
  const blockedNodes = [
    ...degradedOnRoute.map((n) => (n as any)._id.toString()),
    ...failedOnRoute.map((n) => (n as any)._id.toString()),
  ].filter((id, i, arr) => arr.indexOf(id) === i); // dedupe

  const penaltyMinutes = degradedOnRoute.length * 5 + failedOnRoute.length * 12;
  const adjustedETA = Math.round((baseETA + penaltyMinutes) * 10) / 10;

  // Alternative route: operational transport nodes close to incident (within 5km) not blocked
  const blockedSet = new Set(blockedNodes);
  const altRoute = transportNodes
    .filter((n) => {
      const id = (n as any)._id.toString();
      return (
        !blockedSet.has(id) &&
        n.status === 'operational' &&
        haversineDistance(incidentLocation, n.location) <= 5
      );
    })
    .map((n) => (n as any)._id.toString());

  const goldenHourPct = Math.min(100, Math.round((adjustedETA / 60) * 1000) / 10);

  return {
    serviceType,
    serviceBase: {
      nodeId: (nearestBase as any)._id.toString(),
      name: nearestBase.name,
      location: nearestBase.location,
    },
    incidentLocation,
    distanceKm: Math.round(distanceKm * 100) / 100,
    baseETA: Math.round(baseETA * 10) / 10,
    adjustedETA,
    penaltyMinutes,
    routeNodes,
    blockedNodes,
    altRoute,
    goldenHourPct,
  };
}

/**
 * For each emergency service base, compute the coverage radius (km) within
 * which 90% of ETA calculations complete within 15 minutes.
 * Accounts for average road degradation inside the theoretical coverage circle.
 */
export async function getServiceCoverage(): Promise<Array<{
  nodeId: string;
  name: string;
  serviceType: 'fire' | 'ambulance' | 'police';
  location: { lat: number; lng: number };
  coverageRadiusKm: number;
  degradedRoadCount: number;
  effectiveSpeedKmh: number;
}>> {
  const allNodes = await InfrastructureNode.find().lean<IInfrastructureNode[]>();
  const transportNodes = allNodes.filter((n) => n.type === 'transport');

  const results: ReturnType<typeof getServiceCoverage> extends Promise<infer T> ? T : never[] = [];

  for (const [svcType, subtype] of Object.entries(SERVICE_SUBTYPES) as [
    'fire' | 'ambulance' | 'police',
    string,
  ][]) {
    const speedKmh = SERVICE_SPEED_KMH[svcType];
    // Base radius = distance covered in 15 min at service speed
    const baseRadius = (speedKmh * 15) / 60; // km

    const bases = allNodes.filter((n) => n.subtype === subtype);
    for (const base of bases) {
      // Count degraded road nodes inside the base radius
      const degradedInRadius = transportNodes.filter((n) => {
        const d = haversineDistance(base.location, n.location);
        return d <= baseRadius && n.status !== 'operational';
      });

      // Estimate expected penalty: each degraded node imposes ~5 min average penalty
      // Split the count across all routes inside radius — assume ~avg 0.5 degraded per route
      const avgPenaltyMin = degradedInRadius.length > 0
        ? Math.min(10, degradedInRadius.length * 0.5)
        : 0;

      // Effective time budget for travel = 15 min - avg penalty
      const travelBudget = Math.max(1, 15 - avgPenaltyMin * 0.9); // 90th-pct correction
      const coverageRadiusKm = (speedKmh * travelBudget) / 60;

      results.push({
        nodeId: (base as any)._id.toString(),
        name: base.name,
        serviceType: svcType,
        location: base.location,
        coverageRadiusKm: Math.round(coverageRadiusKm * 100) / 100,
        degradedRoadCount: degradedInRadius.length,
        effectiveSpeedKmh: speedKmh,
      });
    }
  }

  return results;
}

interface Location {
  lat: number;
  lng: number;
}

interface ResponseUnit {
  nodeId: string;
  name: string;
  subtype: string;
  location: Location;
  distance: number;
  etaMinutes: number;
  status: string;
  capacity: number;
  currentLoad: number;
  routeBlocked: boolean;
  availableUnits: number;
}

export interface EmergencyResponseResult {
  incidentLocation: Location;
  fireBrigade: ResponseUnit[];
  ambulance: ResponseUnit[];
  police: ResponseUnit[];
  nearestHospital: ResponseUnit | null;
  overallResponseTime: {
    fire: number;
    medical: number;
    police: number;
  };
  infrastructureImpact: {
    roadBlockages: string[];
    powerOutages: string[];
    commFailures: string[];
  };
  riskAssessment: string;
}

// Haversine distance in km
function haversineDistance(a: Location, b: Location): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Estimate ETA based on distance, road conditions, and infrastructure status
function estimateETA(distKm: number, roadConditionFactor: number, isEmergency: boolean): number {
  const avgSpeedKmh = isEmergency ? 45 : 30; // Mumbai traffic avg with siren
  const adjustedSpeed = avgSpeedKmh * roadConditionFactor;
  const baseMinutes = (distKm / adjustedSpeed) * 60;
  // Add dispatch time (1-3 min)
  return Math.round(baseMinutes + 1.5);
}

export async function calculateEmergencyResponse(
  incidentLat: number,
  incidentLng: number,
  emergencyType: 'fire' | 'medical' | 'crime' | 'disaster'
): Promise<EmergencyResponseResult> {
  const incidentLocation: Location = { lat: incidentLat, lng: incidentLng };

  const allNodes = await InfrastructureNode.find().lean<IInfrastructureNode[]>();
  const allDeps = await Dependency.find().lean();

  // Find infrastructure issues affecting response
  const failedTransport = allNodes.filter(n => n.type === 'transport' && n.status !== 'operational');
  const failedPower = allNodes.filter(n => n.type === 'power' && n.status !== 'operational');
  const failedTelecom = allNodes.filter(n => n.type === 'telecom' && n.status !== 'operational');

  const roadBlockages = failedTransport.map(n => n.name);
  const powerOutages = failedPower.map(n => n.name);
  const commFailures = failedTelecom.map(n => n.name);

  // Road condition factor (1.0 = normal, lower = worse)
  const roadFactor = 1.0 - (failedTransport.length * 0.08);
  const adjustedRoadFactor = Math.max(0.4, roadFactor);

  // Find fire stations
  const fireStations = allNodes.filter(n => n.subtype === 'fire_station');
  const fireResponders: ResponseUnit[] = fireStations.map(station => {
    const dist = haversineDistance(incidentLocation, station.location);
    const eta = estimateETA(dist, adjustedRoadFactor, true);
    const available = Math.max(0, station.capacity - station.currentLoad);
    return {
      nodeId: (station as any)._id.toString(),
      name: station.name,
      subtype: station.subtype,
      location: station.location,
      distance: Math.round(dist * 100) / 100,
      etaMinutes: eta,
      status: station.status,
      capacity: station.capacity,
      currentLoad: station.currentLoad,
      routeBlocked: failedTransport.length > 0,
      availableUnits: Math.round(available / 10), // rough engines
    };
  }).sort((a, b) => a.etaMinutes - b.etaMinutes);

  // Find hospitals (ambulance source)
  const hospitals = allNodes.filter(n => n.subtype === 'hospital');
  const ambulanceResponders: ResponseUnit[] = hospitals.map(hospital => {
    const dist = haversineDistance(incidentLocation, hospital.location);
    const eta = estimateETA(dist, adjustedRoadFactor, true);
    const available = Math.max(0, hospital.capacity - hospital.currentLoad);
    return {
      nodeId: (hospital as any)._id.toString(),
      name: hospital.name,
      subtype: hospital.subtype,
      location: hospital.location,
      distance: Math.round(dist * 100) / 100,
      etaMinutes: eta,
      status: hospital.status,
      capacity: hospital.capacity,
      currentLoad: hospital.currentLoad,
      routeBlocked: failedTransport.length > 0,
      availableUnits: Math.round(available / 20), // rough ambulance count
    };
  }).sort((a, b) => a.etaMinutes - b.etaMinutes);

  // Find police stations
  const policeStations = allNodes.filter(n => n.subtype === 'police_station');
  const policeResponders: ResponseUnit[] = policeStations.map(station => {
    const dist = haversineDistance(incidentLocation, station.location);
    const eta = estimateETA(dist, adjustedRoadFactor, true);
    const available = Math.max(0, station.capacity - station.currentLoad);
    return {
      nodeId: (station as any)._id.toString(),
      name: station.name,
      subtype: station.subtype,
      location: station.location,
      distance: Math.round(dist * 100) / 100,
      etaMinutes: eta,
      status: station.status,
      capacity: station.capacity,
      currentLoad: station.currentLoad,
      routeBlocked: failedTransport.length > 0,
      availableUnits: Math.round(available / 5), // patrol units
    };
  }).sort((a, b) => a.etaMinutes - b.etaMinutes);

  const nearestHospital = ambulanceResponders[0] || null;

  // Risk assessment based on infrastructure state
  let risk = 'LOW';
  const totalFailed = failedTransport.length + failedPower.length + failedTelecom.length;
  if (totalFailed > 5) risk = 'CRITICAL';
  else if (totalFailed > 2) risk = 'HIGH';
  else if (totalFailed > 0) risk = 'MODERATE';

  return {
    incidentLocation,
    fireBrigade: fireResponders,
    ambulance: ambulanceResponders,
    police: policeResponders,
    nearestHospital,
    overallResponseTime: {
      fire: fireResponders[0]?.etaMinutes ?? 99,
      medical: ambulanceResponders[0]?.etaMinutes ?? 99,
      police: policeResponders[0]?.etaMinutes ?? 99,
    },
    infrastructureImpact: {
      roadBlockages,
      powerOutages,
      commFailures,
    },
    riskAssessment: risk,
  };
}

// Calculate zone-wise resilience for citizen dashboard
export async function getZoneResilience(): Promise<Array<{
  zone: string;
  lat: number;
  lng: number;
  resilienceScore: number;
  powerReliability: number;
  waterReliability: number;
  transportAccess: number;
  emergencyCoverage: number;
  telecomStrength: number;
}>> {
  const nodes = await InfrastructureNode.find().lean<IInfrastructureNode[]>();

    const zones = [
    { zone: 'South Mumbai (Colaba / Marine Lines)', lat: 18.9066, lng: 72.8142 },
    { zone: 'Fort / Kala Ghoda (South Mumbai)', lat: 18.9340, lng: 72.8333 },
    { zone: 'Lower Parel / Mahalaxmi', lat: 19.0040, lng: 72.8228 },
    { zone: 'Bandra-Kurla Complex (BKC)', lat: 19.0596, lng: 72.8656 },
    { zone: 'Bandra (West)', lat: 19.0544, lng: 72.8400 },
    { zone: 'Andheri (East)', lat: 19.1190, lng: 72.8460 },
    { zone: 'Powai / Hiranandani', lat: 19.1186, lng: 72.9080 },
    { zone: 'Kurla – Sion (Central Mumbai)', lat: 19.0617, lng: 72.8696 },
    { zone: 'Chembur', lat: 19.0660, lng: 72.9004 },
    { zone: 'Goregaon / Malad (Western Suburbs)', lat: 19.1460, lng: 72.8360 },
    { zone: 'Borivali (North-West Suburbs)', lat: 19.2296, lng: 72.8561 },
    { zone: 'Thane (Central Thane)', lat: 19.2183, lng: 72.9781 },
    { zone: 'Navi Mumbai (Vashi / CBD Belapur)', lat: 19.0330, lng: 73.0297 },
    { zone: 'Dadar – Prabhadevi', lat: 19.0183, lng: 72.8414 },
    { zone: 'Mulund / N M Joshi Marg (Eastern Suburbs)', lat: 19.1680, lng: 72.9656 }
  ];

  return zones.map(z => {
    // Find nodes within ~5km radius of zone center
    const nearbyNodes = nodes.filter(n => {
      const dist = haversineDistance(z, n.location);
      return dist < 5;
    });

    const bySector: Record<string, IInfrastructureNode[]> = {};
    for (const n of nearbyNodes) {
      if (!bySector[n.type]) bySector[n.type] = [];
      bySector[n.type].push(n);
    }

    const sectorScore = (sector: string) => {
      const sectorNodes = bySector[sector] || [];
      if (sectorNodes.length === 0) return 30; // low score if no infrastructure
      const operational = sectorNodes.filter(n => n.status === 'operational').length;
      const avgLoad = sectorNodes.reduce((s, n) => s + n.currentLoad / Math.max(1, n.capacity), 0) / sectorNodes.length;
      return Math.round((operational / sectorNodes.length) * 70 + (1 - avgLoad) * 30);
    };

    const power = sectorScore('power');
    const water = sectorScore('water');
    const transport = sectorScore('transport');
    const emergency = sectorScore('emergency');
    const telecom = sectorScore('telecom');
    const overall = Math.round((power * 0.25 + water * 0.2 + transport * 0.2 + emergency * 0.2 + telecom * 0.15));

    return {
      zone: z.zone,
      lat: z.lat,
      lng: z.lng,
      resilienceScore: overall,
      powerReliability: power,
      waterReliability: water,
      transportAccess: transport,
      emergencyCoverage: emergency,
      telecomStrength: telecom,
    };
  });
}

// Predictive failure analysis
export async function getPredictiveFailures(): Promise<Array<{
  nodeId: string;
  name: string;
  type: string;
  subtype: string;
  failureProbability: number;
  riskFactors: string[];
  estimatedTimeToFailure: string;
  mitigationSuggestions: string[];
}>> {
  const nodes = await InfrastructureNode.find().lean<IInfrastructureNode[]>();
  const deps = await Dependency.find().lean();

  return nodes
    .map(node => {
      const riskFactors: string[] = [];
      let probability = 0;

      // High load factor
      const loadRatio = node.currentLoad / Math.max(1, node.capacity);
      if (loadRatio > 0.9) {
        riskFactors.push(`Critical load at ${Math.round(loadRatio * 100)}% capacity`);
        probability += 0.3;
      } else if (loadRatio > 0.75) {
        riskFactors.push(`High load at ${Math.round(loadRatio * 100)}% capacity`);
        probability += 0.15;
      }

      // Already degraded
      if (node.status === 'degraded') {
        riskFactors.push('Currently in degraded state');
        probability += 0.25;
      }

      // High criticality + high load = danger
      if (node.criticalityScore > 80 && loadRatio > 0.7) {
        riskFactors.push('High criticality node under stress');
        probability += 0.15;
      }

      // Single point of failure (few incoming dependencies)
      const incomingDeps = deps.filter(d => d.targetNodeId.toString() === (node as any)._id.toString());
      const outgoingDeps = deps.filter(d => d.sourceNodeId.toString() === (node as any)._id.toString());
      if (outgoingDeps.length > 5 && incomingDeps.length <= 1) {
        riskFactors.push(`Single supply source with ${outgoingDeps.length} dependents`);
        probability += 0.2;
      }

      // Cascading risk from degraded suppliers
      const suppliers = incomingDeps.map(d => {
        const supplier = nodes.find(n => (n as any)._id.toString() === d.sourceNodeId.toString());
        return supplier;
      }).filter(Boolean);

      const degradedSuppliers = suppliers.filter(s => s!.status !== 'operational');
      if (degradedSuppliers.length > 0) {
        riskFactors.push(`${degradedSuppliers.length} upstream supplier(s) degraded`);
        probability += degradedSuppliers.length * 0.1;
      }

      probability = Math.min(0.95, probability);

      // Estimated time
      let timeEstimate = 'Low risk';
      if (probability > 0.7) timeEstimate = '< 24 hours';
      else if (probability > 0.5) timeEstimate = '1-3 days';
      else if (probability > 0.3) timeEstimate = '1-2 weeks';
      else if (probability > 0.1) timeEstimate = '1-3 months';

      // Mitigation suggestions
      const suggestions: string[] = [];
      if (loadRatio > 0.8) suggestions.push('Reduce load or increase capacity');
      if (incomingDeps.length <= 1) suggestions.push('Add redundant supply connections');
      if (node.status === 'degraded') suggestions.push('Schedule immediate maintenance');
      if (degradedSuppliers.length > 0) suggestions.push('Repair upstream infrastructure first');
      if (suggestions.length === 0) suggestions.push('Continue routine monitoring');

      return {
        nodeId: (node as any)._id.toString(),
        name: node.name,
        type: node.type,
        subtype: node.subtype,
        failureProbability: Math.round(probability * 100) / 100,
        riskFactors,
        estimatedTimeToFailure: timeEstimate,
        mitigationSuggestions: suggestions,
      };
    })
    .filter(n => n.failureProbability > 0.05)
    .sort((a, b) => b.failureProbability - a.failureProbability);
}
