import { useRef, useMemo, useState, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Html, Float, Stars, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore - Ignore module not found if it's a false positive or path mapping issue
import { SectorModel } from './SectorModels';
import type { InfrastructureNode, Dependency } from '../../types';
import { SECTOR_COLORS, STATUS_COLORS } from '../../types';
import {
  MUMBAI_COAST, NAVI_MUMBAI_COAST, THANE_BOUNDARY,
  WESTERN_EXPRESS_HWY, EASTERN_EXPRESS_HWY, SCLR, JVLR, EASTERN_FREEWAY,
  PALM_BEACH_ROAD, SION_PANVEL,
  BWSL, ATAL_SETU, VASHI_BRIDGE, AIROLI_BRIDGE,
  WESTERN_RAILWAY, CENTRAL_RAILWAY, HARBOUR_LINE, METRO_LINE_1, NMMT_METRO,
  ZONE_LABELS, LANDMARKS, WARD_DIVIDERS,
} from './MumbaiGeoData';

// Timer/Clock check removed since it triggers a deprecation warning on import.

/* ─── coordinate projection ───────────────────────────────
   Map lat/lng to x/z in the 3D scene.
   Centre = approx Mumbai centre (19.076, 72.877)
   Scale so the full city (+/- 0.35 deg) maps to about ±30 units.
   ───────────────────────────────────────────────────────── */
const MUMBAI_CENTER = { lat: 19.076, lng: 72.877 };
const SCALE = 85; // units per degree

export function latlngToWorld(lat: number, lng: number): [number, number, number] {
  const x = (lng - MUMBAI_CENTER.lng) * SCALE;
  const z = -(lat - MUMBAI_CENTER.lat) * SCALE; // negate so north is -z
  return [x, 0, z];
}

/* ─── types ───────────────────────────────────────────── */
interface Node3DData {
  id: string;
  name: string;
  type: string;
  subtype: string;
  status: string;
  criticalityScore: number;
  currentLoad: number;
  capacity: number;
  position: [number, number, number];
  lat: number;
  lng: number;
  properties: Record<string, any>;
}

interface Edge3DData {
  id: string;
  source: string;
  target: string;
  dependencyType: string;
  strength: number;
}

interface MumbaiMap3DProps {
  nodes: InfrastructureNode[];
  dependencies: Dependency[];
  sectorFilter: string;
  statusFilter: string;
  onNodeSelect?: (node: InfrastructureNode | null) => void;
}

/* ═══════════════════════════════════════════════════════════
   Single 3D Node
   ═══════════════════════════════════════════════════════════ */
function NodeObject({
  node,
  isSelected,
  isHovered,
  onHover,
  onClick,
}: {
  node: Node3DData;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const baseScale = node.criticalityScore >= 90 ? 1.4 : node.criticalityScore >= 70 ? 1.1 : 0.85;
  const color = SECTOR_COLORS[node.type] || '#ffffff';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Gentle float
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.8 + node.position[0]) * 0.03;
    // Scale pulse on hover/select
    const targetScale = (isSelected || isHovered) ? baseScale * 1.25 : baseScale;
    const curr = groupRef.current.scale.x;
    const next = curr + (targetScale - curr) * 0.1;
    groupRef.current.scale.set(next, next, next);
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      onPointerOver={(e) => { e.stopPropagation(); onHover(node.id); }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
    >
      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1 : 0.4}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Status indicator ring (inner) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[0.14, 0.17, 32]} />
        <meshStandardMaterial
          color={STATUS_COLORS[node.status] || '#666'}
          emissive={STATUS_COLORS[node.status] || '#666'}
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3D sector model */}
      <SectorModel sector={node.type} subtype={node.subtype} />

      {/* Label */}
      <Text
        position={[0, -0.12, 0.25]}
        fontSize={0.06}
        color={color}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.003}
        outlineColor="#000000"
        maxWidth={1.5}
      >
        {node.name.length > 22 ? node.name.slice(0, 20) + '…' : node.name}
      </Text>

      {/* Criticality badge */}
      {node.criticalityScore >= 85 && (
        <Text
          position={[0.2, 0.4, 0]}
          fontSize={0.045}
          color="#ff4444"
          anchorX="center"
          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {`C:${node.criticalityScore}`}
        </Text>
      )}

      {/* Selection glow pillar */}
      {isSelected && (
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.6, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <Html
          position={[0, 0.55, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-slate-900/95 border border-slate-600 rounded-lg px-3 py-2 text-xs min-w-[180px] shadow-xl backdrop-blur-sm">
            <div className="font-bold text-white text-sm mb-1">{node.name}</div>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize" style={{ color }}>{node.type}</span>
              <span className="text-slate-500 mx-1">·</span>
              <span className="text-slate-400">{node.subtype}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span>Status: <span style={{ color: STATUS_COLORS[node.status] }}>{node.status}</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span>Load: {node.currentLoad}/{node.capacity} ({Math.round((node.currentLoad / node.capacity) * 100)}%)</span>
            </div>
            <div className="text-slate-400 mt-1">
              📍 {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   3D Connections between nodes
   ═══════════════════════════════════════════════════════════ */
const DEP_COLORS: Record<string, string> = {
  power_supply: '#ffcc33',
  water_supply: '#33ddff',
  data_link: '#c077ff',
  physical_access: '#33ffaa',
  operational: '#6688aa',
};

function ConnectionLines({
  edges,
  nodeMap,
}: {
  edges: Edge3DData[];
  nodeMap: Map<string, Node3DData>;
}) {
  return (
    <>
      {edges.map((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;

        const color = DEP_COLORS[edge.dependencyType] || '#555';
        const midY = 0.15 + edge.strength * 0.15; // arc height based on strength

        // Build a curved arc via 3 points
        const p1 = new THREE.Vector3(...src.position);
        const p3 = new THREE.Vector3(...tgt.position);
        const mid = p1.clone().lerp(p3, 0.5);
        mid.y = midY;

        const curve = new THREE.QuadraticBezierCurve3(p1, mid, p3);
        const points = curve.getPoints(20);

        return (
          <Line
            key={edge.id}
            points={points}
            color={color}
            lineWidth={0.8 + edge.strength * 1.2}
            transparent
            opacity={0.35}
          />
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Animated connection flow particles
   ═══════════════════════════════════════════════════════════ */
function FlowParticles({
  edges,
  nodeMap,
}: {
  edges: Edge3DData[];
  nodeMap: Map<string, Node3DData>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const curves = useMemo(() => {
    return edges.map((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return null;
      const p1 = new THREE.Vector3(...src.position);
      const p3 = new THREE.Vector3(...tgt.position);
      const mid = p1.clone().lerp(p3, 0.5);
      mid.y = 0.15 + edge.strength * 0.15;
      return { curve: new THREE.QuadraticBezierCurve3(p1, mid, p3), type: edge.dependencyType };
    }).filter(Boolean) as { curve: THREE.QuadraticBezierCurve3; type: string }[];
  }, [edges, nodeMap]);

  const count = Math.min(curves.length * 2, 200); // 2 particles per edge, max 200

  useFrame(({ clock }) => {
    if (!meshRef.current || curves.length === 0) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const curveIdx = i % curves.length;
      const curveData = curves[curveIdx];
      const offset = (i < curves.length) ? 0 : 0.5;
      const progress = ((t * 0.3 + offset + curveIdx * 0.1) % 1);
      const point = curveData.curve.getPoint(progress);
      dummy.position.copy(point);
      dummy.scale.setScalar(0.015);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (curves.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#88bbff"
        emissiveIntensity={1.5}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   Background Stars
   ═══════════════════════════════════════════════════════════ */
function BackgroundStars() {
  return (
    <Stars 
      radius={100} 
      depth={50} 
      count={5000} 
      factor={4} 
      saturation={0} 
      fade 
      speed={1} 
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   Ground plane — accurate Mumbai geography
   ═══════════════════════════════════════════════════════════ */
/** Convert [lat,lng][] → Vector3[] at a given Y height */
function toV3(coords: [number, number][], y = 0.01): THREE.Vector3[] {
  return coords.map(([lat, lng]) => {
    const [x, , z] = latlngToWorld(lat, lng);
    return new THREE.Vector3(x, y, z);
  });
}

/** Build a THREE.Shape from Vector3[] (uses x, z projected onto XY plane for ShapeGeometry) */
function makeShape(pts: THREE.Vector3[]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, -pts[0].z);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, -pts[i].z);
  s.closePath();
  return s;
}

export function MumbaiGround() {
  const gridRef = useRef<THREE.GridHelper>(null!);

  // Landmasses
  const mumbaiPts   = useMemo(() => toV3(MUMBAI_COAST), []);
  const naviPts     = useMemo(() => toV3(NAVI_MUMBAI_COAST), []);
  const thanePts    = useMemo(() => toV3(THANE_BOUNDARY), []);
  const mumbaiShape = useMemo(() => makeShape(mumbaiPts), [mumbaiPts]);
  const naviShape   = useMemo(() => makeShape(naviPts), [naviPts]);
  const thaneShape  = useMemo(() => makeShape(thanePts), [thanePts]);

  // Highways — Mumbai
  const wehPts    = useMemo(() => toV3(WESTERN_EXPRESS_HWY, 0.007), []);
  const eehPts    = useMemo(() => toV3(EASTERN_EXPRESS_HWY, 0.007), []);
  const sclrPts   = useMemo(() => toV3(SCLR, 0.007), []);
  const jvlrPts   = useMemo(() => toV3(JVLR, 0.007), []);
  const efPts     = useMemo(() => toV3(EASTERN_FREEWAY, 0.007), []);
  // Highways — Navi Mumbai
  const pbPts     = useMemo(() => toV3(PALM_BEACH_ROAD, 0.007), []);
  const spPts     = useMemo(() => toV3(SION_PANVEL, 0.007), []);

  // Bridges
  const bwslPts   = useMemo(() => toV3(BWSL, 0.009), []);
  const atalPts   = useMemo(() => toV3(ATAL_SETU, 0.009), []);
  const vashiPts  = useMemo(() => toV3(VASHI_BRIDGE, 0.009), []);
  const airoliPts = useMemo(() => toV3(AIROLI_BRIDGE, 0.009), []);

  // Railways
  const wrPts     = useMemo(() => toV3(WESTERN_RAILWAY, 0.006), []);
  const crPts     = useMemo(() => toV3(CENTRAL_RAILWAY, 0.006), []);
  const hlPts     = useMemo(() => toV3(HARBOUR_LINE, 0.006), []);
  const m1Pts     = useMemo(() => toV3(METRO_LINE_1, 0.006), []);
  const nmPts     = useMemo(() => toV3(NMMT_METRO, 0.006), []);

  // Ward dividers
  const wardPts   = useMemo(() => WARD_DIVIDERS.map(w => toV3(w, 0.004)), []);

  return (
    <group>
      {/* ── Ocean base ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#050c1a" />
      </mesh>

      {/* ── Water tint ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#071220" emissive="#071520"
          emissiveIntensity={0.18} transparent opacity={0.95} />
      </mesh>

      {/* ── Grid ── */}
      <gridHelper ref={gridRef} args={[100, 100, '#0a1830', '#070e1a']} position={[0, -0.045, 0]} />

      {/* ══ LANDMASSES ══ */}
      {/* Mumbai — slightly brighter teal-blue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <shapeGeometry args={[mumbaiShape]} />
        <meshStandardMaterial color="#0f1e32" emissive="#0d1a2c" emissiveIntensity={0.4} />
      </mesh>

      {/* Navi Mumbai — slightly greener tint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.022, 0]}>
        <shapeGeometry args={[naviShape]} />
        <meshStandardMaterial color="#0c1e28" emissive="#0a1c24" emissiveIntensity={0.38} />
      </mesh>

      {/* Thane — subtle purple tint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.023, 0]}>
        <shapeGeometry args={[thaneShape]} />
        <meshStandardMaterial color="#0e1a2a" emissive="#0a1428" emissiveIntensity={0.32} />
      </mesh>

      {/* ══ COASTLINES ══ */}
      <Line points={mumbaiPts} color="#245a88" lineWidth={2.5} transparent opacity={0.85} />
      <Line points={naviPts}   color="#1e6050" lineWidth={2.0} transparent opacity={0.75} />
      <Line points={thanePts}  color="#2a4a70" lineWidth={1.5} transparent opacity={0.60} />

      {/* ══ WARD DIVIDERS ══ */}
      {wardPts.map((pts, i) => (
        <Line key={`ward-${i}`} points={pts} color="#102030" lineWidth={1}
          transparent opacity={0.4} />
      ))}

      {/* ══ HIGHWAYS ══ */}
      {/* Mumbai highways — green */}
      <Line points={wehPts}  color="#1e4c30" lineWidth={2.0} transparent opacity={0.6} />
      <Line points={eehPts}  color="#1e4c30" lineWidth={2.0} transparent opacity={0.6} />
      <Line points={sclrPts} color="#1e4c30" lineWidth={1.4} transparent opacity={0.5} />
      <Line points={jvlrPts} color="#1e4c30" lineWidth={1.4} transparent opacity={0.5} />
      <Line points={efPts}   color="#1e4c30" lineWidth={1.4} transparent opacity={0.5} />
      {/* Navi Mumbai highways */}
      <Line points={pbPts}   color="#1e5040" lineWidth={1.6} transparent opacity={0.5} />
      <Line points={spPts}   color="#1e4c30" lineWidth={1.4} transparent opacity={0.5} />

      {/* ══ BRIDGES & SEA LINKS ══ */}
      <Line points={bwslPts}   color="#2e6878" lineWidth={2.5} transparent opacity={0.8} />
      <Line points={atalPts}   color="#2e6878" lineWidth={3.0} transparent opacity={0.75} />
      <Line points={vashiPts}  color="#2e6878" lineWidth={2.0} transparent opacity={0.65} />
      <Line points={airoliPts} color="#2e6878" lineWidth={1.8} transparent opacity={0.60} />

      {/* ══ RAILWAYS ══ */}
      <Line points={wrPts} color="#4a3820" lineWidth={1.6} transparent opacity={0.55} />
      <Line points={crPts} color="#4a2020" lineWidth={1.6} transparent opacity={0.55} />
      <Line points={hlPts} color="#204040" lineWidth={1.2} transparent opacity={0.45} />
      <Line points={m1Pts} color="#381850" lineWidth={1.5} transparent opacity={0.55} />
      <Line points={nmPts} color="#183840" lineWidth={1.3} transparent opacity={0.50} />

      {/* ══ LANDMARKS ══ */}
      {LANDMARKS.map((lm) => {
        const [x, , z] = latlngToWorld(lm.lat, lm.lng);
        return (
          <group key={lm.name}>
            <mesh position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.1, 20]} />
              <meshStandardMaterial color={lm.color} emissive={lm.color}
                emissiveIntensity={0.8} transparent opacity={0.7} />
            </mesh>
            <Text position={[x, 0.007, z + 0.18]} rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.10} color="#3a6080" anchorX="center" anchorY="top"
              outlineWidth={0.005} outlineColor="#000000">{lm.name}</Text>
          </group>
        );
      })}

      {/* ══ ZONE & WATER LABELS ══ */}
      {ZONE_LABELS.map((zone) => {
        const [x, , z] = latlngToWorld(zone.lat, zone.lng);
        const fs = zone.size || 0.18;
        return (
          <Text
            key={zone.name}
            position={[x, 0.006, z]}
            rotation={[-Math.PI / 2, 0, zone.rotation || 0]}
            fontSize={fs}
            color={zone.color || '#1e3a58'}
            anchorX="center"
            anchorY="middle"
            letterSpacing={fs > 0.3 ? 0.08 : 0.04}
            outlineWidth={fs > 0.3 ? 0.015 : 0.006}
            outlineColor="#000000"
            fontWeight={zone.bold ? 'bold' : 'normal'}
          >
            {zone.name}
          </Text>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   Camera controller – auto-fit to Mumbai & Focus logic
   ═══════════════════════════════════════════════════════════ */
function CameraSetup({ focusNode }: { focusNode?: Node3DData | null }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Initial camera setup
  useEffect(() => {
    camera.position.set(0, 22, 14);
    camera.lookAt(0, 0, -2);
  }, []);

  // Smoothly move camera when a node is focused/selected
  useFrame((state, delta) => {
    if (focusNode) {
      const [tx, ty, tz] = focusNode.position;
      
      // Target camera position: slightly above and behind the node
      const targetCamPos = new THREE.Vector3(tx, ty + 4, tz + 4);
      camera.position.lerp(targetCamPos, 0.08);

      // Target look-at point: the node itself
      if (controlsRef.current) {
        const targetLookAt = new THREE.Vector3(tx, ty, tz);
        controlsRef.current.target.lerp(targetLookAt, 0.08);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      maxPolarAngle={Math.PI / 2.1} 
      minDistance={2}
      maxDistance={45}
      makeDefault
      dampingFactor={0.05}
      enableDamping={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      }}
      screenSpacePanning={true}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function MumbaiMap3D({
  nodes,
  dependencies,
  sectorFilter,
  statusFilter,
  onNodeSelect,
}: MumbaiMap3DProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* Build 3D node data */
  const node3DData = useMemo<Node3DData[]>(() => {
    return nodes
      .filter((n) => (sectorFilter === 'all' || n.type === sectorFilter))
      .filter((n) => (statusFilter === 'all' || n.status === statusFilter))
      .map((n) => ({
        id: n._id,
        name: n.name,
        type: n.type,
        subtype: n.subtype,
        status: n.status,
        criticalityScore: n.criticalityScore,
        currentLoad: n.currentLoad,
        capacity: n.capacity,
        position: latlngToWorld(n.location.lat, n.location.lng),
        lat: n.location.lat,
        lng: n.location.lng,
        properties: n.properties,
      }));
  }, [nodes, sectorFilter, statusFilter]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, Node3DData>();
    node3DData.forEach((n) => m.set(n.id, n));
    return m;
  }, [node3DData]);

  /* Build edge data */
  const edgeData = useMemo<Edge3DData[]>(() => {
    const nodeIds = new Set(node3DData.map((n) => n.id));
    return dependencies
      .filter((d) => {
        const srcId = typeof d.sourceNodeId === 'string' ? d.sourceNodeId : d.sourceNodeId._id;
        const tgtId = typeof d.targetNodeId === 'string' ? d.targetNodeId : d.targetNodeId._id;
        return nodeIds.has(srcId) && nodeIds.has(tgtId);
      })
      .map((d) => ({
        id: d._id,
        source: typeof d.sourceNodeId === 'string' ? d.sourceNodeId : d.sourceNodeId._id,
        target: typeof d.targetNodeId === 'string' ? d.targetNodeId : d.targetNodeId._id,
        dependencyType: d.dependencyType,
        strength: d.strength,
      }));
  }, [dependencies, node3DData]);

  const handleClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    if (onNodeSelect) {
      const node = nodes.find((n) => n._id === id);
      onNodeSelect(node || null);
    }
  }, [nodes, onNodeSelect]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{ background: '#050a14' }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <CameraSetup focusNode={selectedId ? nodeMap.get(selectedId) : null} />

        {/* Global Interaction Helper */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.06, 0]} 
          onClick={() => {
            setSelectedId(null);
            if (onNodeSelect) onNodeSelect(null);
          }}
          visible={false}
        >
          <planeGeometry args={[200, 200]} />
        </mesh>

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[15, 25, 15]} 
          intensity={1.2} 
          color="#d0e0ff" 
          castShadow 
        />
        <pointLight position={[0, 12, 0]} intensity={0.65} color="#88aaff" distance={100} />

        {/* Background */}
        <BackgroundStars />

        {/* Fog for depth */}
        <fog attach="fog" args={['#050a14', 20, 100]} />

        <Suspense fallback={null}>
          {/* Ground */}
          <MumbaiGround />

          {/* Connections */}
          <ConnectionLines edges={edgeData} nodeMap={nodeMap} />
          <FlowParticles edges={edgeData} nodeMap={nodeMap} />

          {/* Nodes */}
          {node3DData.map((node) => (
            <NodeObject
              key={node.id}
              node={node}
              isSelected={selectedId === node.id}
              isHovered={hoveredId === node.id}
              onHover={setHoveredId}
              onClick={handleClick}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Stats overlay */}
      <div className="absolute top-3 left-3 text-xs text-slate-500 pointer-events-none select-none">
        <div className="bg-slate-900/80 backdrop-blur-sm rounded px-2 py-1 border border-slate-800">
          Nodes: {node3DData.length} &nbsp;·&nbsp; Connections: {edgeData.length}
        </div>
      </div>
    </div>
  );
}
