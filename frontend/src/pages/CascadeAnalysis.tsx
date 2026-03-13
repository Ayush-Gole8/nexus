import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Zap, Play, SkipForward, RotateCcw, Box, GitBranch, AlertTriangle, Users, Shield, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line as RLine, CartesianGrid, Legend } from 'recharts';
import InfrastructureGraph from '../components/graph/InfrastructureGraph';
import { getGraphData, getNodes, getDependencies } from '../api/infrastructure';
import { runCascadeAnalysis, getCriticalNodes, getImpactMatrix, getVulnerability } from '../api/analysis';
import type { GraphData, CascadeResult, InfrastructureNode, Dependency } from '../types';
import { SECTOR_COLORS, SECTOR_LABELS, STATUS_COLORS } from '../types';
import { SectorModel } from '../components/map3d/SectorModels';
import { MumbaiGround } from '../components/map3d/MumbaiMap3D';
import {
  MUMBAI_COAST, NAVI_MUMBAI_COAST,
  WESTERN_EXPRESS_HWY, EASTERN_EXPRESS_HWY,
  WESTERN_RAILWAY, CENTRAL_RAILWAY,
  BWSL, ATAL_SETU, VASHI_BRIDGE,
  ZONE_LABELS,
} from '../components/map3d/MumbaiGeoData';

// ── Coordinate projection (same as MumbaiMap3D) ──
const MUMBAI_CENTER = { lat: 19.076, lng: 72.877 };
const SCALE = 85;
function latlngToWorld(lat: number, lng: number): [number, number, number] {
  return [(lng - MUMBAI_CENTER.lng) * SCALE, 0, -(lat - MUMBAI_CENTER.lat) * SCALE];
}
function toV3(coords: [number, number][], y = 0.01): THREE.Vector3[] {
  return coords.map(([lat, lng]) => {
    const [x, , z] = latlngToWorld(lat, lng);
    return new THREE.Vector3(x, y, z);
  });
}
function makeShape(pts: THREE.Vector3[]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, -pts[0].z);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, -pts[i].z);
  s.closePath();
  return s;
}

type ViewMode = '3d' | 'graph';

// ── 3D Node for Cascade View ──
interface CascadeNode3D {
  id: string; name: string; type: string; subtype: string; status: string;
  criticalityScore: number; currentLoad: number; capacity: number;
  position: [number, number, number]; lat: number; lng: number;
  cascadeStatus: 'failed' | 'degraded' | null;
  impactScore: number | null;
  propagationStep: number | null;
  reason: string | null;
}

function CascadeNodeObject({ node, currentStep, isHovered, onHover, onClick }: {
  node: CascadeNode3D; currentStep: number | undefined;
  isHovered: boolean; onHover: (id: string | null) => void; onClick: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const pulseRef = useRef<THREE.Mesh>(null!);
  const baseScale = node.criticalityScore >= 90 ? 1.3 : node.criticalityScore >= 70 ? 1.0 : 0.8;
  const color = SECTOR_COLORS[node.type] || '#ffffff';

  const isVisible = currentStep === undefined || node.propagationStep === null || node.propagationStep <= currentStep;
  const showCascade = isVisible && node.cascadeStatus !== null;
  const cascadeColor = node.cascadeStatus === 'failed' ? '#ff2244' : node.cascadeStatus === 'degraded' ? '#ffaa00' : null;
  const activeColor = (showCascade && cascadeColor) ? cascadeColor : color;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.8 + node.position[0]) * 0.03;
    const targetScale = isHovered ? baseScale * 1.25 : baseScale;
    const curr = groupRef.current.scale.x;
    const next = curr + (targetScale - curr) * 0.1;
    groupRef.current.scale.set(next, next, next);
    // Pulse effect for cascade-affected nodes
    if (pulseRef.current && showCascade) {
      const s = 1 + Math.sin(clock.elapsedTime * 5) * 0.4;
      pulseRef.current.scale.set(s, s, s);
      (pulseRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.5 + Math.sin(clock.elapsedTime * 5) * 0.3;
    }
  });

  return (
    <group
      ref={groupRef} position={node.position}
      onPointerOver={(e) => { e.stopPropagation(); onHover(node.id); }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
    >
      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshStandardMaterial color={activeColor} emissive={activeColor}
          emissiveIntensity={showCascade ? 1.5 : 0.4} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Cascade impact ring (pulsing) */}
      {showCascade && (
        <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[0.24, 0.32, 32]} />
          <meshStandardMaterial color={cascadeColor!} emissive={cascadeColor!}
            emissiveIntensity={2} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 3D model */}
      <SectorModel sector={node.type} subtype={node.subtype} />

      {/* Label */}
      <Text position={[0, -0.12, 0.25]} fontSize={0.06} color={activeColor}
        anchorX="center" anchorY="top" outlineWidth={0.003} outlineColor="#000000" maxWidth={1.5}>
        {node.name.length > 22 ? node.name.slice(0, 20) + '…' : node.name}
      </Text>

      {/* Impact score badge */}
      {showCascade && node.impactScore !== null && (
        <Text position={[0.22, 0.4, 0]} fontSize={0.06} color={cascadeColor!}
          anchorX="center" outlineWidth={0.004} outlineColor="#000000" fontWeight="bold">
          {`${Math.round(node.impactScore * 100)}%`}
        </Text>
      )}

      {/* Failure pillar */}
      {showCascade && node.cascadeStatus === 'failed' && (
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.7, 8]} />
          <meshStandardMaterial color="#ff2244" emissive="#ff2244" emissiveIntensity={3}
            transparent opacity={0.6} />
        </mesh>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <Html position={[0, 0.6, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 border border-slate-600 rounded-lg px-3 py-2 text-xs min-w-[200px] shadow-xl backdrop-blur-sm">
            <div className="font-bold text-white text-sm mb-1">{node.name}</div>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize" style={{ color }}>{node.type}</span>
              <span className="text-slate-500 mx-1">·</span>
              <span className="text-slate-400">{node.subtype?.replace(/_/g, ' ')}</span>
            </div>
            {showCascade ? (
              <>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold" style={{ color: cascadeColor! }}>
                    {node.cascadeStatus?.toUpperCase()}
                  </span>
                  <span className="text-slate-500 ml-1">
                    (Impact: {Math.round((node.impactScore || 0) * 100)}%)
                  </span>
                </div>
                <div className="text-slate-400">Step: {node.propagationStep}</div>
                {node.reason && <div className="text-slate-500 mt-1 text-[10px] italic">{node.reason}</div>}
              </>
            ) : (
              <div className="text-green-400">✓ Not affected</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Cascade propagation lines (animated) ──
function CascadePropagationLines({ paths, nodeMap, currentStep }: {
  paths: CascadeResult['propagationPaths'];
  nodeMap: Map<string, CascadeNode3D>; currentStep: number | undefined;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const visiblePaths = useMemo(() =>
    paths.filter(p => currentStep === undefined || p.step <= currentStep), [paths, currentStep]);

  const curves = useMemo(() => visiblePaths.map(p => {
    const src = nodeMap.get(p.from); const tgt = nodeMap.get(p.to);
    if (!src || !tgt) return null;
    const p1 = new THREE.Vector3(...src.position);
    const p3 = new THREE.Vector3(...tgt.position);
    const mid = p1.clone().lerp(p3, 0.5);
    mid.y = 0.3 + (p.impactTransferred || p.strength) * 0.4;
    return { curve: new THREE.QuadraticBezierCurve3(p1, mid, p3), impact: p.impactTransferred || p.strength };
  }).filter(Boolean) as { curve: THREE.QuadraticBezierCurve3; impact: number }[], [visiblePaths, nodeMap]);

  const count = Math.min(curves.length * 2, 300);

  useFrame(({ clock }) => {
    if (!meshRef.current || curves.length === 0) return;
    for (let i = 0; i < count; i++) {
      const ci = i % curves.length;
      const offset = i < curves.length ? 0 : 0.5;
      const progress = ((clock.elapsedTime * 0.4 + offset + ci * 0.07) % 1);
      const point = curves[ci].curve.getPoint(progress);
      dummy.position.copy(point);
      dummy.scale.setScalar(0.02 + curves[ci].impact * 0.01);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (curves.length === 0) return null;

  return (
    <group>
      {/* Red propagation lines */}
      {curves.map((c, i) => {
        const pts = c.curve.getPoints(16);
        return (
          <Line key={i} points={pts} color="#ff3355" lineWidth={1.5 + c.impact * 2}
            transparent opacity={0.4 + c.impact * 0.3} />
        );
      })}
      {/* Animated particles */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#ff4466" emissive="#ff2244"
          emissiveIntensity={2} transparent opacity={0.9} />
      </instancedMesh>
    </group>
  );
}

// Removed simplified CascadeGround, using imported MumbaiGround instead

// ── Camera setup for cascade view ──
function CascadeCameraSetup() {
  const { camera } = useThree();
  useEffect(() => { camera.position.set(0, 22, 14); camera.lookAt(0, 0, -2); }, []);
  return (
    <OrbitControls makeDefault enableDamping dampingFactor={0.05}
      minDistance={2} maxDistance={45} maxPolarAngle={Math.PI / 2.1}
      screenSpacePanning mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN }} />
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function CascadeAnalysis() {
  const location = useLocation();
  const preselectedNodeId = (location.state as any)?.nodeId;

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [allNodes, setAllNodes] = useState<InfrastructureNode[]>([]);
  const [allDeps, setAllDeps] = useState<Dependency[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(preselectedNodeId ? [preselectedNodeId] : []);
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number | undefined>(undefined);
  const [maxStep, setMaxStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState('all');
  const [vulnerability, setVulnerability] = useState<Record<string, number>>({});
  const [criticalRanked, setCriticalRanked] = useState<Array<{ nodeId: string; name: string; score: number; type: string }>>([]);
  const [impactMatrix, setImpactMatrix] = useState<{ sectors: string[]; matrix: Record<string, Record<string, number>> }>({
    sectors: [],
    matrix: {},
  });

  useEffect(() => {
    Promise.all([
      getGraphData(),
      getNodes(),
      getDependencies(),
      getVulnerability(),
      getCriticalNodes(10),
      getImpactMatrix(),
    ]).then(([graph, nodeList, deps, vuln, critical, matrix]) => {
      setGraphData(graph);
      setAllNodes(nodeList);
      setAllDeps(deps);
      setVulnerability(vuln);
      setCriticalRanked(critical.map((n: any) => ({
        nodeId: n.nodeId,
        name: n.name,
        type: n.type,
        score: n.score ?? n.compositeScore ?? 0,
      })));
      setImpactMatrix(matrix);
    });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (selectedNodeIds.length === 0) return;
    setLoading(true); setCascadeResult(null); setCurrentStep(undefined);
    try {
      const result = await runCascadeAnalysis(selectedNodeIds);
      setCascadeResult(result);
      setMaxStep(result.summary.maxPropagationDepth);
      setCurrentStep(0);
    } catch (err) { console.error('Cascade analysis failed:', err); }
    finally { setLoading(false); }
  }, [selectedNodeIds]);

  useEffect(() => {
    if (!playing || currentStep === undefined || currentStep >= maxStep) { setPlaying(false); return; }
    const timer = setTimeout(() => setCurrentStep(s => (s ?? 0) + 1), 1200);
    return () => clearTimeout(timer);
  }, [playing, currentStep, maxStep]);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeIds(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
  };

  // ── Build 3D node data with cascade overlay ──
  const node3DData = useMemo<CascadeNode3D[]>(() => {
    return allNodes
      .filter(n => sectorFilter === 'all' || n.type === sectorFilter)
      .map(n => {
        const impact = cascadeResult?.impactedNodes.find(i => i.nodeId === n._id);
        return {
          id: n._id, name: n.name, type: n.type, subtype: n.subtype,
          status: n.status, criticalityScore: n.criticalityScore,
          currentLoad: n.currentLoad, capacity: n.capacity,
          position: latlngToWorld(n.location.lat, n.location.lng),
          lat: n.location.lat, lng: n.location.lng,
          cascadeStatus: impact ? impact.newStatus : null,
          impactScore: impact ? impact.impactScore : null,
          propagationStep: impact ? impact.propagationStep : null,
          reason: impact?.reason || null,
        };
      });
  }, [allNodes, cascadeResult, sectorFilter]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, CascadeNode3D>();
    node3DData.forEach(n => m.set(n.id, n));
    return m;
  }, [node3DData]);

  // filtered nodes for the selector
  const filteredNodes = useMemo(() => {
    if (sectorFilter === 'all') return allNodes;
    return allNodes.filter(n => n.type === sectorFilter);
  }, [allNodes, sectorFilter]);

  const sr = cascadeResult?.summary;
  const vulnerabilityChartData = useMemo(() =>
    Object.entries(vulnerability).map(([sector, value]) => ({
      sector,
      vulnerability: Math.round(value * 100),
    })), [vulnerability]);

  const timelineData = useMemo(() => {
    if (!cascadeResult) return [];
    const max = cascadeResult.summary.maxPropagationDepth;
    const sectors = ['power', 'water', 'transport', 'telecom', 'emergency'];
    const perStepImpacts = new Map<number, Record<string, number>>();

    for (const n of cascadeResult.impactedNodes) {
      const step = n.propagationStep ?? 0;
      if (!perStepImpacts.has(step)) perStepImpacts.set(step, {});
      const bucket = perStepImpacts.get(step)!;
      bucket[n.type] = (bucket[n.type] || 0) + (n.newStatus === 'failed' ? 18 : 10);
    }

    const health = Object.fromEntries(sectors.map((s) => [s, 100])) as Record<string, number>;
    const result: Array<Record<string, number>> = [];

    for (let step = 0; step <= max; step++) {
      const impact = perStepImpacts.get(step) || {};
      for (const sector of sectors) {
        health[sector] = Math.max(0, health[sector] - (impact[sector] || 0));
      }
      result.push({
        step,
        power: health.power,
        water: health.water,
        transport: health.transport,
        telecom: health.telecom,
        emergency: health.emergency,
      });
    }
    return result;
  }, [cascadeResult]);

  const matrixCellColor = (v: number) => {
    if (v >= 80) return 'rgba(255, 51, 102, 0.45)';
    if (v >= 50) return 'rgba(240, 165, 0, 0.40)';
    if (v >= 20) return 'rgba(51, 102, 153, 0.40)';
    return 'rgba(51, 68, 102, 0.18)';
  };

  return (
    <div className="space-y-3 h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cascade Analysis</h1>
          <p className="text-sm text-slate-400 mt-0.5">Simulate infrastructure failures and visualize cascading impacts in 3D</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            <button onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === '3d' ? 'bg-red-600/30 text-red-300 border-r border-slate-600' : 'bg-slate-800 text-slate-400 hover:text-white border-r border-slate-600'}`}>
              <Box className="w-3.5 h-3.5" /> 3D Map
            </button>
            <button onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'graph' ? 'bg-red-600/30 text-red-300' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <GitBranch className="w-3.5 h-3.5" /> Graph
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3" style={{ height: 'calc(100% - 56px)' }}>
        {/* ── Left Panel ── */}
        <div className="w-80 flex-shrink-0 space-y-3 overflow-y-auto pr-1">
          {/* Node Selection */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Failure Nodes</h3>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white mb-2">
              <option value="all">All Sectors</option>
              {Object.entries(SECTOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {filteredNodes.map(node => (
                <label key={node._id}
                  className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${selectedNodeIds.includes(node._id) ? 'bg-red-600/20 border border-red-500/30' : 'hover:bg-slate-700/50'}`}>
                  <input type="checkbox" checked={selectedNodeIds.includes(node._id)}
                    onChange={() => handleNodeSelect(node._id)} className="rounded border-slate-600 w-3 h-3" />
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SECTOR_COLORS[node.type] }} />
                  <span className="text-[11px] text-white truncate">{node.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button onClick={handleAnalyze} disabled={selectedNodeIds.length === 0 || loading}
              className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
              <Zap className="w-4 h-4" /> {loading ? 'Analyzing...' : `Analyze Cascade (${selectedNodeIds.length})`}
            </button>
            {cascadeResult && (
              <div className="flex gap-2">
                <button onClick={() => { setCurrentStep(0); setPlaying(true); }}
                  className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-red-600/30">
                  <Play className="w-3.5 h-3.5" /> Play
                </button>
                <button onClick={() => setCurrentStep(s => Math.min((s ?? 0) + 1, maxStep))}
                  className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-slate-600">
                  <SkipForward className="w-3.5 h-3.5" /> Step
                </button>
                <button onClick={() => { setCascadeResult(null); setCurrentStep(undefined); setPlaying(false); }}
                  className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Propagation Step Indicator */}
          {cascadeResult && currentStep !== undefined && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-400">PROPAGATION STEP</h3>
                <span className="text-sm font-mono text-white">{currentStep} / {maxStep}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-red-600 transition-all"
                  style={{ width: `${maxStep > 0 ? (currentStep / maxStep) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* Impact Summary */}
          {sr && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Impact Summary</h3>

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
                  <p className="text-xl font-bold text-red-400">{sr.totalAffected}</p>
                  <p className="text-[10px] text-slate-500">TOTAL AFFECTED</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
                  <p className="text-xl font-bold text-orange-400">{sr.maxPropagationDepth}</p>
                  <p className="text-[10px] text-slate-500">MAX DEPTH</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
                  <p className="text-xl font-bold text-red-500">{sr.totalFailed ?? 0}</p>
                  <p className="text-[10px] text-slate-500">FAILED</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
                  <p className="text-xl font-bold text-yellow-400">{sr.totalDegraded ?? 0}</p>
                  <p className="text-[10px] text-slate-500">DEGRADED</p>
                </div>
              </div>

              {/* Resilience & Population */}
              <div className="flex gap-2">
                {sr.resilienceScore !== undefined && (
                  <div className="flex-1 bg-slate-700/50 rounded-lg p-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className={`text-sm font-bold ${sr.resilienceScore > 70 ? 'text-green-400' : sr.resilienceScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {sr.resilienceScore}%
                      </p>
                      <p className="text-[9px] text-slate-500">RESILIENCE</p>
                    </div>
                  </div>
                )}
                {sr.populationAffected !== undefined && (
                  <div className="flex-1 bg-slate-700/50 rounded-lg p-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-400" />
                    <div>
                      <p className="text-sm font-bold text-orange-400">
                        {sr.populationAffected >= 1000000 ? `${(sr.populationAffected / 1000000).toFixed(1)}M` : `${(sr.populationAffected / 1000).toFixed(0)}K`}
                      </p>
                      <p className="text-[9px] text-slate-500">POP. AFFECTED</p>
                    </div>
                  </div>
                )}
              </div>

              {/* By Sector */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-1.5">By Sector</p>
                {Object.entries(sr.bySector).map(([sector, count]) => (
                  <div key={sector} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[sector] }} />
                      <span className="text-[11px] text-slate-400">{SECTOR_LABELS[sector] || sector}</span>
                    </div>
                    <span className="text-[11px] font-mono text-white">{count as number}</span>
                  </div>
                ))}
              </div>

              {/* Cascade Chains */}
              {sr.cascadeChains && sr.cascadeChains.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase mb-1.5">Longest Cascade Chains</p>
                  {sr.cascadeChains.map((chain, i) => (
                    <div key={i} className="text-[10px] text-slate-400 mb-1 leading-tight">
                      <span className="text-red-400">Chain {i + 1}:</span>{' '}
                      {chain.map((name, j) => (
                        <span key={j}>
                          {j > 0 && <span className="text-red-500 mx-0.5">→</span>}
                          <span className={j === chain.length - 1 ? 'text-red-300 font-medium' : ''}>{name.length > 18 ? name.slice(0, 16) + '…' : name}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Affected Nodes List */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase mb-1.5">Affected Nodes</p>
                <div className="space-y-0.5 max-h-36 overflow-y-auto">
                  {cascadeResult!.impactedNodes
                    .filter(n => currentStep === undefined || n.propagationStep <= (currentStep ?? Infinity))
                    .sort((a, b) => a.propagationStep - b.propagationStep)
                    .map(node => (
                      <div key={node.nodeId} className="flex items-center justify-between text-[11px] py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: node.newStatus === 'failed' ? '#EF4444' : '#F59E0B' }} />
                          <span className="text-slate-300 truncate">{node.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                          <span className="text-slate-500 font-mono">S{node.propagationStep}</span>
                          <span className={`font-mono font-bold ${node.newStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {Math.round(node.impactScore * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Vulnerability bar chart */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sector Vulnerability</h3>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={vulnerabilityChartData} layout="vertical" margin={{ top: 8, right: 12, left: 20, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis type="category" dataKey="sector" tick={{ fill: '#cbd5e1', fontSize: 10 }} width={68} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'vulnerability']} />
                  <Bar dataKey="vulnerability" radius={[0, 4, 4, 0]}>
                    {vulnerabilityChartData.map((row) => (
                      <Cell key={row.sector} fill={SECTOR_COLORS[row.sector] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Impact matrix 5x5 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Impact Matrix (5x5)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left text-slate-500 px-1.5 py-1">Src \ Tgt</th>
                    {impactMatrix.sectors.map((s) => (
                      <th key={s} className="text-slate-400 px-1.5 py-1 text-center uppercase">{s.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {impactMatrix.sectors.map((src) => (
                    <tr key={src}>
                      <td className="text-slate-400 px-1.5 py-1 uppercase">{src.slice(0, 3)}</td>
                      {impactMatrix.sectors.map((tgt) => {
                        const value = impactMatrix.matrix[src]?.[tgt] ?? 0;
                        return (
                          <td
                            key={`${src}-${tgt}`}
                            className="text-center px-1.5 py-1 text-white font-mono rounded"
                            style={{ background: matrixCellColor(value) }}
                          >
                            {value.toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical nodes list */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Critical Nodes Ranking</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {criticalRanked.map((n, idx) => (
                <div key={n.nodeId} className="flex items-center justify-between px-2 py-1 rounded bg-slate-700/30">
                  <div className="min-w-0">
                    <div className="text-[11px] text-white truncate">{idx + 1}. {n.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{n.type}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 font-mono">
                    {n.score.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cascade timeline */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cascade Timeline (Sector Health)</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={timelineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="step" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <RLine type="monotone" dataKey="power" stroke={SECTOR_COLORS.power} dot={false} strokeWidth={2} />
                  <RLine type="monotone" dataKey="water" stroke={SECTOR_COLORS.water} dot={false} strokeWidth={2} />
                  <RLine type="monotone" dataKey="transport" stroke={SECTOR_COLORS.transport} dot={false} strokeWidth={2} />
                  <RLine type="monotone" dataKey="telecom" stroke={SECTOR_COLORS.telecom} dot={false} strokeWidth={2} />
                  <RLine type="monotone" dataKey="emergency" stroke={SECTOR_COLORS.emergency} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Right - Visualization ── */}
        <div className="flex-1 border border-[rgba(60,40,40,0.4)] rounded-xl overflow-hidden relative"
          style={{ background: '#050810' }}>
          {viewMode === '3d' ? (
            <Canvas 
              camera={{ fov: 50, near: 0.1, far: 500 }}
              gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
              style={{ background: '#050a14' }}
              shadows={{ type: THREE.PCFShadowMap }}
            >
              <CascadeCameraSetup />
              <ambientLight intensity={0.4} />
              <directionalLight position={[15, 25, 15]} intensity={1.2} color="#d0e0ff" />
              <pointLight position={[0, 12, 0]} intensity={0.65} color="#88aaff" distance={100} />
              <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
              <fog attach="fog" args={['#050a14', 20, 100]} />
              <Suspense fallback={null}>
                <MumbaiGround />
                {/* Cascade propagation lines */}
                {cascadeResult && (
                  <CascadePropagationLines
                    paths={cascadeResult.propagationPaths}
                    nodeMap={nodeMap} currentStep={currentStep} />
                )}
                {/* Nodes */}
                {node3DData.map(node => (
                  <CascadeNodeObject key={node.id} node={node} currentStep={currentStep}
                    isHovered={hoveredId === node.id} onHover={setHoveredId}
                    onClick={handleNodeSelect} />
                ))}
              </Suspense>
            </Canvas>
          ) : (
            <InfrastructureGraph graphData={graphData} cascadeResult={cascadeResult}
              currentStep={currentStep} onAnalyzeCascade={handleNodeSelect} />
          )}

          {/* Stats badge */}
          <div className="absolute top-3 left-3 text-xs text-slate-500 pointer-events-none select-none">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded px-2 py-1 border border-slate-800">
              Nodes: {node3DData.length}
              {cascadeResult && <span className="text-red-400 ml-2">⚡ Affected: {cascadeResult.summary.totalAffected}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
