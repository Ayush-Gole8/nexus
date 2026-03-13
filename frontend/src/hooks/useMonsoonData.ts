import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export interface MonsoonZone {
  _id?: string;
  nodeId?: string | { _id?: string };
  affectedNodes?: Array<string | { _id?: string }>;
  riskMultiplier: number;
  floodZone: boolean;
  zoneName?: string;
  location?: { lat: number; lng: number };
}

const api = axios.create({ baseURL: '/api/weather' });

function toNodeId(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    const id = (value as Record<string, unknown>)._id;
    return typeof id === 'string' ? id : null;
  }
  return null;
}

export function useMonsoonData() {
  const [floodZoneIds, setFloodZoneIds] = useState<Set<string>>(new Set());
  const [zones, setZones] = useState<MonsoonZone[]>([]);
  const [monsoonActive, setMonsoonActive] = useState(false);

  const loadZones = useCallback(async () => {
    let payload: MonsoonZone[] = [];
    try {
      const { data } = await api.get('/monsoon-zones');
      payload = Array.isArray(data) ? data : [];
    } catch {
      const { data } = await api.get('/flood-zones');
      payload = Array.isArray(data) ? data : [];
    }

    setZones(payload);

    const ids = new Set<string>();
    payload.forEach((z) => {
      const nodeId = toNodeId(z.nodeId);
      if (nodeId) ids.add(nodeId);

      if (Array.isArray(z.affectedNodes)) {
        z.affectedNodes.forEach((entry) => {
          const id = toNodeId(entry);
          if (id) ids.add(id);
        });
      }
    });

    setFloodZoneIds(ids);
  }, []);

  useEffect(() => {
    loadZones().catch((err) => {
      console.error('Failed to load monsoon flood zones', err);
      setFloodZoneIds(new Set());
      setZones([]);
    });
  }, [loadZones]);

  return { floodZoneIds, monsoonActive, setMonsoonActive, zones };
}
