import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';

export interface MonsoonZone {
  _id?: string;
  zoneName: string;
  season: 'monsoon' | 'summer' | 'winter';
  riskMultiplier: number;
  floodZone: boolean;
  historicalFailures: number;
  location?: { lat: number; lng: number };
  affectedNodeIds: Array<
    string | {
      _id: string;
      name?: string;
      zone?: string;
      location?: { lat: number; lng: number };
      status?: string;
      type?: string;
      properties?: Record<string, unknown>;
    }
  >;
}

interface MonsoonContextValue {
  monsoonActive: boolean;
  setMonsoonActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  rainfall_mm: number;
  setRainfall_mm: (value: number) => void;
  monsoonRiskMap: Map<string, number>;
  monsoonZones: MonsoonZone[];
}

const MonsoonContext = createContext<MonsoonContextValue | null>(null);

const api = axios.create({ baseURL: '/api/weather' });

function authHeaders() {
  const token = localStorage.getItem('nexus_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function MonsoonProvider({ children }: { children: ReactNode }) {
  const [monsoonActive, setMonsoonActive] = useState(false);
  const [rainfall_mm, setRainfall_mm] = useState(100);
  const [monsoonRiskMap, setMonsoonRiskMap] = useState<Map<string, number>>(new Map());
  const [monsoonZones, setMonsoonZones] = useState<MonsoonZone[]>([]);

  const loadMonsoonZones = useCallback(async () => {
    try {
      const { data } = await api.get('/monsoon-zones', { headers: authHeaders() });
      setMonsoonZones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load monsoon zones', err);
      setMonsoonZones([]);
    }
  }, []);

  useEffect(() => {
    loadMonsoonZones();
  }, [loadMonsoonZones]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!monsoonActive) {
        setMonsoonRiskMap(new Map());
        return;
      }

      try {
        const { data } = await api.post('/monsoon-risk', { rainfall_mm }, { headers: authHeaders() });
        const rows = Array.isArray(data) ? data : [];
        const next = new Map<string, number>();
        rows.forEach((row: { nodeId?: string; adjustedFailProbPct?: number }) => {
          if (!row?.nodeId || typeof row.adjustedFailProbPct !== 'number') return;
          next.set(String(row.nodeId), row.adjustedFailProbPct);
        });
        setMonsoonRiskMap(next);
      } catch (err) {
        console.error('Failed to load monsoon risk map', err);
        setMonsoonRiskMap(new Map());
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [monsoonActive, rainfall_mm]);

  const value = useMemo(
    () => ({ monsoonActive, setMonsoonActive, rainfall_mm, setRainfall_mm, monsoonRiskMap, monsoonZones }),
    [monsoonActive, rainfall_mm, monsoonRiskMap, monsoonZones],
  );

  return <MonsoonContext.Provider value={value}>{children}</MonsoonContext.Provider>;
}

export function useMonsoon() {
  const ctx = useContext(MonsoonContext);
  if (!ctx) throw new Error('useMonsoon must be used within MonsoonProvider');
  return ctx;
}
