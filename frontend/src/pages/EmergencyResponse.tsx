import { useState } from 'react';
import {
  Flame, Ambulance, Shield, MapPin, Clock, Navigation,
  AlertTriangle, Phone, Activity,
} from 'lucide-react';
import { getEmergencyResponse } from '../api/emergency';

interface ResponseUnit {
  name: string;
  type: string;
  distance: number;
  eta: number;
  status: string;
  location: { lat: number; lng: number };
}

interface EmergencyData {
  fire: ResponseUnit[];
  ambulance: ResponseUnit[];
  police: ResponseUnit[];
  nearestOverall: { type: string; name: string; eta: number };
}

const EMERGENCY_TYPES = [
  { id: 'fire', label: 'Fire Emergency', icon: Flame, color: '#ff6b2b' },
  { id: 'medical', label: 'Medical Emergency', icon: Ambulance, color: '#22d97a' },
  { id: 'security', label: 'Security Incident', icon: Shield, color: '#7b68ff' },
  { id: 'disaster', label: 'Natural Disaster', icon: AlertTriangle, color: '#f0a500' },
];

// Predefined Mumbai locations for easy selection
const MUMBAI_LOCATIONS = [
  { name: 'Colaba (South Mumbai)', lat: 18.9067, lng: 72.8147 },
  { name: 'CSMT Station', lat: 18.9398, lng: 72.8355 },
  { name: 'BKC Complex', lat: 19.0590, lng: 72.8652 },
  { name: 'Andheri West', lat: 19.1364, lng: 72.8296 },
  { name: 'Powai (IIT Area)', lat: 19.1176, lng: 72.9060 },
  { name: 'Dadar Junction', lat: 19.0176, lng: 72.8420 },
  { name: 'Bandra Reclamation', lat: 19.0440, lng: 72.8206 },
  { name: 'Thane Station', lat: 19.1860, lng: 72.9750 },
  { name: 'Navi Mumbai (Vashi)', lat: 19.0771, lng: 72.9986 },
  { name: 'Mulund East', lat: 19.1726, lng: 72.9566 },
];

export default function EmergencyResponse() {
  const [selectedType, setSelectedType] = useState('fire');
  const [selectedLocation, setSelectedLocation] = useState(MUMBAI_LOCATIONS[0]);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [response, setResponse] = useState<EmergencyData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const lat = useCustom ? parseFloat(customLat) : selectedLocation.lat;
      const lng = useCustom ? parseFloat(customLng) : selectedLocation.lng;
      const data = await getEmergencyResponse(lat, lng, selectedType);
      setResponse(data);
    } catch (err) {
      console.error('Emergency dispatch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatETA = (minutes: number) => {
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  const getETAColor = (minutes: number) => {
    if (minutes <= 5) return 'var(--st-op)';
    if (minutes <= 10) return 'var(--amber)';
    if (minutes <= 20) return '#ff6b2b';
    return 'var(--st-fail)';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,107,43,0.15)', border: '1px solid rgba(255,107,43,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame style={{ width: 18, height: 18, color: '#ff6b2b' }} />
            </div>
            Emergency Response System
          </h1>
          <p className="page-subtitle">Real-time ETA predictions for emergency services across Mumbai</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(34,217,122,0.08)', border: '1px solid rgba(34,217,122,0.2)', borderRadius: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--st-op)', boxShadow: '0 0 6px var(--st-op)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--st-op)', textTransform: 'uppercase' }}>Live System</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Emergency Configuration */}
        <div className="space-y-4">
          {/* Emergency Type Selection */}
          <div className="nexus-card" style={{ padding: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>Emergency Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {EMERGENCY_TYPES.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setSelectedType(id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 8,
                    border: `1px solid ${selectedType === id ? color : 'var(--border-hairline)'}`,
                    backgroundColor: selectedType === id ? color + '18' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Icon style={{ width: 14, height: 14, color }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: selectedType === id ? color : 'var(--text-secondary)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location Selection */}
          <div className="nexus-card" style={{ padding: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin style={{ width: 12, height: 12, color: 'var(--amber)' }} />
              Incident Location
            </h3>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setUseCustom(false)}
                style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-data)', cursor: 'pointer', border: !useCustom ? '1px solid var(--border-default)' : '1px solid transparent', background: !useCustom ? 'var(--amber-glow)' : 'transparent', color: !useCustom ? 'var(--amber)' : 'var(--text-muted)' }}
              >
                Preset
              </button>
              <button
                onClick={() => setUseCustom(true)}
                style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-data)', cursor: 'pointer', border: useCustom ? '1px solid var(--border-default)' : '1px solid transparent', background: useCustom ? 'var(--amber-glow)' : 'transparent', color: useCustom ? 'var(--amber)' : 'var(--text-muted)' }}
              >
                Custom
              </button>
            </div>

            {!useCustom ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 192, overflowY: 'auto' }}>
                {MUMBAI_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => setSelectedLocation(loc)}
                    style={{
                      textAlign: 'left', padding: '7px 10px', borderRadius: 6, cursor: 'pointer', border: 'none',
                      background: selectedLocation.name === loc.name ? 'var(--amber-glow)' : 'transparent',
                      color: selectedLocation.name === loc.name ? 'var(--amber-bright)' : 'var(--text-secondary)',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 11 }}>{loc.name}</div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="number" step="0.0001" placeholder="Latitude (e.g. 19.0760)"
                  value={customLat} onChange={(e) => setCustomLat(e.target.value)}
                  style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-data)', fontSize: 12, outline: 'none' }}
                />
                <input
                  type="number" step="0.0001" placeholder="Longitude (e.g. 72.8777)"
                  value={customLng} onChange={(e) => setCustomLng(e.target.value)}
                  style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-data)', fontSize: 12, outline: 'none' }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleDispatch}
            disabled={loading}
            className="btn-amber"
            style={{ width: '100%', padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? (
              <>
                <Activity style={{ width: 14, height: 14 }} />
                Calculating ETAs...
              </>
            ) : (
              <>
                <Phone style={{ width: 14, height: 14 }} />
                Calculate Emergency Response
              </>
            )}
          </button>
        </div>

        {/* Center + Right - Response Results */}
        <div className="lg:col-span-2 space-y-4">
          {!response ? (
            <div className="nexus-card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Navigation style={{ width: 30, height: 30, color: 'var(--text-muted)' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>Select Location &amp; Type</h3>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto' }}>
                Choose an emergency type and incident location, then click "Calculate Emergency Response" to see real-time ETAs for fire, ambulance, and police units.
              </p>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-3 gap-3">
                <ResponseSummaryCard title="Fire Brigade" icon={Flame} units={response.fire} color="#ff6b2b" />
                <ResponseSummaryCard title="Ambulance" icon={Ambulance} units={response.ambulance} color="#22d97a" />
                <ResponseSummaryCard title="Police" icon={Shield} units={response.police} color="#7b68ff" />
              </div>

              {/* Detailed Unit List */}
              {(['fire', 'ambulance', 'police'] as const).map((svc) => {
                const units = response[svc];
                const svcColors: Record<string, string> = { fire: '#ff6b2b', ambulance: '#22d97a', police: '#7b68ff' };
                const icons: Record<string, React.ComponentType<any>> = { fire: Flame, ambulance: Ambulance, police: Shield };
                const SvcIcon = icons[svc];
                const svcColor = svcColors[svc];
                return (
                  <div key={svc} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SvcIcon style={{ width: 14, height: 14, color: svcColor }} />
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{svc} Response Units</h3>
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-muted)' }}>{units.length} available</span>
                    </div>
                    <div>
                      {units.slice(0, 5).map((unit, i) => (
                        <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid var(--border-hairline)' : 'none' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: svcColor + '20', color: svcColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.name}</div>
                            <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-muted)' }}>{unit.distance.toFixed(1)} km away</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-data)', fontSize: 18, fontWeight: 700, color: getETAColor(unit.eta) }}>
                              {formatETA(unit.eta)}
                            </div>
                            <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ETA</div>
                          </div>
                          <div style={{ padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-data)', fontSize: 10, background: unit.status === 'operational' ? 'rgba(34,217,122,0.12)' : 'rgba(240,165,0,0.12)', color: unit.status === 'operational' ? 'var(--st-op)' : 'var(--amber)' }}>
                            {unit.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResponseSummaryCard({
  title, icon: Icon, units, color,
}: {
  title: string;
  icon: React.ComponentType<any>;
  units: ResponseUnit[];
  color: string;
}) {
  const fastest = units[0];
  return (
    <div style={{ background: color + '12', border: `1px solid ${color}35`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon style={{ width: 16, height: 16, color }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {fastest ? (
        <>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            {fastest.eta < 1 ? '<1' : Math.round(fastest.eta)} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span>
          </div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)' }}>{fastest.name}</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{fastest.distance.toFixed(1)} km • {units.length} units</div>
        </>
      ) : (
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-muted)' }}>No units available</div>
      )}
    </div>
  );
}
