import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Zap, Droplets, Car, Wifi, Heart,
  AlertTriangle, CheckCircle, XCircle,
  Building2, Radio, Waves, TrainFront, Plane,
  Ship, Fuel, BatteryCharging, Antenna, Hospital,
  Siren, Shield,
} from 'lucide-react';
import { SECTOR_COLORS, STATUS_COLORS } from '../../types';

const sectorIcons: Record<string, React.ComponentType<any>> = {
  power: Zap,
  water: Droplets,
  transport: Car,
  telecom: Wifi,
  emergency: Heart,
};

const subtypeIcons: Record<string, React.ComponentType<any>> = {
  thermal_plant: Fuel,
  coal_plant: Building2,
  solar_farm: BatteryCharging,
  substation: Zap,
  distribution: Zap,
  transmission_line: Antenna,
  generator: BatteryCharging,
  treatment_plant: Waves,
  pump_station: Droplets,
  reservoir: Droplets,
  distribution_main: Droplets,
  highway: Car,
  expressway: Car,
  bridge: Building2,
  railway_station: TrainFront,
  airport: Plane,
  port: Ship,
  metro_line: TrainFront,
  bus_depot: Car,
  interchange: Car,
  data_center: Building2,
  noc: Radio,
  exchange: Radio,
  cell_tower: Antenna,
  fiber_backbone: Wifi,
  submarine_cable: Waves,
  hospital: Hospital,
  fire_station: Siren,
  police_station: Shield,
  disaster_control: Siren,
  control_room: Radio,
  ndrf_battalion: Shield,
  shelter: Building2,
};

const statusIcons: Record<string, React.ComponentType<any>> = {
  operational: CheckCircle,
  degraded: AlertTriangle,
  failed: XCircle,
};

// Sector-specific 3D SVG illustration rendered behind the icon
function Sector3DVisual({ type, color }: { type: string; color: string }) {
  if (type === 'power') {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}>
        {/* Power tower / pylon shape */}
        <polygon points="24,4 32,20 28,20 34,36 26,36 30,44 18,44 22,36 14,36 20,20 16,20"
          fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <line x1="12" y1="44" x2="36" y2="44" stroke={color} strokeWidth="2" opacity="0.5" />
        {/* Electricity sparks */}
        <circle cx="24" cy="14" r="2" fill={color} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }
  if (type === 'water') {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}>
        {/* Water tower silhouette */}
        <rect x="18" y="24" width="12" height="20" rx="1" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
        <ellipse cx="24" cy="20" rx="14" ry="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.7" />
        <path d="M24 4 C24 4 16 14 16 20 C16 24 20 28 24 28 C28 28 32 24 32 20 C32 14 24 4 24 4Z"
          fill={color} opacity="0.15" stroke={color} strokeWidth="1" />
        {/* Ripple */}
        <circle cx="24" cy="20" r="6" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5">
          <animate attributeName="r" values="4;10;4" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }
  if (type === 'transport') {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}>
        {/* Road/track */}
        <rect x="6" y="30" width="36" height="6" rx="2" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="14" y1="33" x2="18" y2="33" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
        <line x1="22" y1="33" x2="26" y2="33" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
        <line x1="30" y1="33" x2="34" y2="33" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
        {/* Train/vehicle silhouette */}
        <rect x="14" y="14" width="20" height="14" rx="4" fill={color} opacity="0.12" stroke={color} strokeWidth="1.2" />
        <circle cx="19" cy="28" r="2.5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.7" />
        <circle cx="29" cy="28" r="2.5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.7" />
        {/* Moving indicator */}
        <rect x="16" y="18" width="4" height="6" rx="1" fill={color} opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="22" y="18" width="4" height="6" rx="1" fill={color} opacity="0.3">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="28" y="18" width="4" height="6" rx="1" fill={color} opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
        </rect>
      </svg>
    );
  }
  if (type === 'telecom') {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}>
        {/* Cell tower */}
        <line x1="24" y1="8" x2="24" y2="44" stroke={color} strokeWidth="2" opacity="0.6" />
        <line x1="18" y1="44" x2="24" y2="24" stroke={color} strokeWidth="1.2" opacity="0.4" />
        <line x1="30" y1="44" x2="24" y2="24" stroke={color} strokeWidth="1.2" opacity="0.4" />
        {/* Signal waves */}
        {[12, 18, 24].map((r, i) => (
          <path key={i} d={`M${24 - r / 2},${14 - r / 6} A${r / 2},${r / 3} 0 0,1 ${24 + r / 2},${14 - r / 6}`}
            fill="none" stroke={color} strokeWidth="1" opacity={0.6 - i * 0.15}>
            <animate attributeName="opacity" values={`${0.6 - i * 0.15};0.1;${0.6 - i * 0.15}`} dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
          </path>
        ))}
        <circle cx="24" cy="12" r="3" fill={color} opacity="0.8">
          <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }
  // emergency
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}>
      {/* Cross / hospital */}
      <rect x="20" y="8" width="8" height="32" rx="2" fill={color} opacity="0.2" stroke={color} strokeWidth="1.2" />
      <rect x="8" y="20" width="32" height="8" rx="2" fill={color} opacity="0.2" stroke={color} strokeWidth="1.2" />
      {/* Pulse */}
      <circle cx="24" cy="24" r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.5">
        <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="24" r="4" fill={color} opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as any;
  const SubIcon = subtypeIcons[nodeData.subtype] || sectorIcons[nodeData.type] || Zap;
  const StatusIcon = statusIcons[nodeData.status] || CheckCircle;
  const color = SECTOR_COLORS[nodeData.type] || '#6B7280';
  const statusColor = STATUS_COLORS[nodeData.status] || '#10B981';

  const isCascadeAffected = nodeData.cascadeStatus === 'failed' || nodeData.cascadeStatus === 'degraded';
  const cascadeColor = nodeData.cascadeStatus === 'failed' ? '#EF4444' : nodeData.cascadeStatus === 'degraded' ? '#F59E0B' : null;

  const activeColor = cascadeColor || color;
  const loadPct = Math.min(100, Math.round((nodeData.currentLoad / Math.max(1, nodeData.capacity)) * 100));
  const monsoonRisk = typeof nodeData.monsoonRisk === 'number' ? Math.max(0, Math.min(100, nodeData.monsoonRisk)) : null;
  const monsoonColor = monsoonRisk == null
    ? null
    : monsoonRisk >= 75
      ? '#EF4444'
      : monsoonRisk >= 45
        ? '#F59E0B'
        : '#38BDF8';

  return (
    <div
      className={`node-3d group ${selected ? 'node-3d-selected' : ''} ${isCascadeAffected ? 'animate-cascade' : ''}`}
      style={{
        '--node-color': activeColor,
        '--node-color-20': activeColor + '33',
        '--node-color-40': activeColor + '66',
        '--node-color-60': activeColor + '99',
        boxShadow: monsoonColor
          ? `0 0 0 1px ${monsoonColor}55, 0 0 16px ${monsoonColor}35`
          : undefined,
      } as React.CSSProperties}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !-top-1.5 !border-2 !border-slate-900 !rounded-full"
        style={{ background: activeColor }}
      />

      {/* Top glow bar */}
      <div
        className="absolute top-0 left-2 right-2 h-[2px] rounded-full opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)` }}
      />

      {/* 3D Visual Background */}
      <div className="absolute -top-6 -right-4 w-16 h-16 opacity-30 pointer-events-none">
        <Sector3DVisual type={nodeData.type} color={activeColor} />
      </div>

      {/* Header with icon */}
      <div className="node-3d-header relative z-10" style={{ background: `linear-gradient(135deg, ${activeColor}25 0%, ${activeColor}10 100%)` }}>
        <div
          className="node-3d-icon"
          style={{
            background: `linear-gradient(135deg, ${activeColor}40, ${activeColor}15)`,
            boxShadow: `0 0 12px ${activeColor}30, inset 0 0 8px ${activeColor}15`,
            border: `1px solid ${activeColor}40`,
          }}
        >
          <SubIcon className="w-4 h-4" style={{ color: activeColor, filter: `drop-shadow(0 0 4px ${activeColor}90)` }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-xs font-bold text-slate-100 truncate leading-tight">
            {nodeData.name}
          </span>
          <span className="block text-[9px] text-slate-400 uppercase tracking-wider truncate">
            {nodeData.subtype?.replace(/_/g, ' ')}
          </span>
        </div>
        <StatusIcon
          className="w-4 h-4 flex-shrink-0"
          style={{
            color: cascadeColor || statusColor,
            filter: `drop-shadow(0 0 4px ${cascadeColor || statusColor}60)`,
          }}
        />
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-2 relative z-10">
        {/* Load bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-slate-500 font-medium">LOAD</span>
            <span className="text-[9px] font-mono text-slate-400">{loadPct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${loadPct}%`,
                background: `linear-gradient(90deg, ${activeColor}90, ${activeColor})`,
                boxShadow: `0 0 8px ${activeColor}50`,
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cascadeColor || statusColor, boxShadow: `0 0 6px ${cascadeColor || statusColor}60` }} />
            <span className="text-[9px] text-slate-400 capitalize">{nodeData.status}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/50">
            <span className="text-[9px] text-slate-500">C</span>
            <span className={`text-[10px] font-bold font-mono ${
              nodeData.criticalityScore >= 80 ? 'text-red-400' :
              nodeData.criticalityScore >= 60 ? 'text-yellow-400' : 'text-slate-300'
            }`}>
              {nodeData.criticalityScore}
            </span>
          </div>
        </div>
      </div>

      {/* Cascade impact badge */}
      {nodeData.impactScore != null && (
        <div
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-slate-900 z-20"
          style={{
            backgroundColor: cascadeColor || '#EF4444',
            boxShadow: `0 0 12px ${cascadeColor || '#EF4444'}80, 0 2px 8px rgba(0,0,0,0.5)`,
          }}
        >
          {Math.round(nodeData.impactScore * 100)}
        </div>
      )}

      {monsoonRisk != null && nodeData.monsoonActive ? (
        <div
          className="absolute -bottom-2 left-2 px-1.5 py-[1px] rounded text-[9px] font-bold border border-slate-900 z-20"
          style={{
            backgroundColor: `${(monsoonColor ?? '#38BDF8')}33`,
            color: monsoonColor ?? '#38BDF8',
          }}
        >
          RISK {Math.round(monsoonRisk)}%
        </div>
      ) : null}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !-bottom-1.5 !border-2 !border-slate-900 !rounded-full"
        style={{ background: activeColor }}
      />
    </div>
  );
}

export default memo(CustomNode);
