import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── colour palette ──────────────────────────────────────── */
const C = {
  power: '#ffb800',
  water: '#00d4ff',
  transport: '#00ff9d',
  telecom: '#b44dff',
  emergency: '#ff4d6d',
  steel: '#7a8fa0',
  concrete: '#5a6a7a',
  glass: '#8ac4e8',
  dark: '#2a3a4a',
  road: '#3a3a3a',
  red: '#cc3333',
  white: '#e8e8e8',
  blue: '#3366aa',
};

/* ─── shared materials (reuse = less GC) ─────────────────── */
function Mat({ color, m = 0.4, r = 0.5 }: { color: string; m?: number; r?: number }) {
  return <meshStandardMaterial color={color} metalness={m} roughness={r} />;
}

function GlowMat({ color, ei = 0.6, op = 1 }: { color: string; ei?: number; op?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={ei}
      metalness={0.3}
      roughness={0.4}
      transparent={op < 1}
      opacity={op}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   POWER SECTOR
   Subtypes: power_plant, substation, distribution, generator, transmission
   ═══════════════════════════════════════════════════════════ */
export function PowerModel({ subtype }: { subtype: string }) {
  const animRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!animRef.current) return;
    const mat = animRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 4) * 0.35;
  });

  const st = (subtype || '').toLowerCase();

  // ── SOLAR power plant ──
  if (st.includes('solar')) {
    return (
      <group>
        {[-0.28, 0, 0.28].map((x, i) => (
          <group key={i} position={[x, 0.14, 0]} rotation={[-0.4, 0, 0]}>
            <mesh><boxGeometry args={[0.22, 0.018, 0.36]} /><Mat color="#1a3a5c" m={0.8} r={0.2} /></mesh>
            <mesh position={[0, 0.013, 0]}><boxGeometry args={[0.19, 0.004, 0.33]} /><GlowMat color="#2255aa" ei={0.3} /></mesh>
          </group>
        ))}
        <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.018, 0.028, 0.08, 6]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
      </group>
    );
  }

  // ── GENERATOR (backup DG) ──
  if (st.includes('generator') || st.includes('dg') || st.includes('backup') || st.includes('standby')) {
    return (
      <group>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.32, 0.2, 0.22]} /><Mat color="#4a5a6a" m={0.6} r={0.3} /></mesh>
        <mesh position={[0, 0.1, 0.112]}>
          <boxGeometry args={[0.28, 0.16, 0.003]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.5} roughness={0.3} />
        </mesh>
        {[-0.08, 0.08].map((x, i) => (
          <mesh key={i} position={[x, 0.16, 0.115]}><boxGeometry args={[0.04, 0.03, 0.002]} /><GlowMat color="#00ff44" ei={0.6} /></mesh>
        ))}
        <mesh position={[0.12, 0.26, 0]}><cylinderGeometry args={[0.022, 0.028, 0.14, 8]} /><Mat color={C.dark} m={0.5} r={0.5} /></mesh>
        <mesh ref={animRef} position={[0, 0.22, 0.12]}><sphereGeometry args={[0.02, 8, 8]} /><GlowMat color={C.power} ei={0.8} /></mesh>
      </group>
    );
  }

  // ── TRANSMISSION hub (400kV) ──
  if (st.includes('transmission')) {
    return (
      <group>
        {[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].map((p, i) => (
          <mesh key={i} position={[p[0], 0.22, p[1]]}><cylinderGeometry args={[0.012, 0.028, 0.44, 6]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
        ))}
        {[0.12, 0.28, 0.38].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}><boxGeometry args={[0.24 - i * 0.04, 0.012, 0.24 - i * 0.04]} /><Mat color={C.steel} m={0.6} r={0.4} /></mesh>
        ))}
        <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.44, 0.012, 0.012]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
        {[-0.18, 0, 0.18].map((x, i) => (
          <mesh ref={i === 1 ? animRef : undefined} key={i} position={[x, 0.46, 0]}><sphereGeometry args={[0.018, 8, 8]} /><GlowMat color={C.power} ei={0.8} /></mesh>
        ))}
        {[-0.18, 0, 0.18].map((x, i) => (
          <mesh key={`w${i}`} position={[x, 0.48, 0]}><cylinderGeometry args={[0.003, 0.003, 0.05, 4]} /><GlowMat color={C.power} ei={0.4} /></mesh>
        ))}
      </group>
    );
  }

  // ── DISTRIBUTION hub ──
  if (st.includes('distribution')) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.3, 0.16, 0.2]} /><Mat color="#4a5a6a" m={0.5} r={0.4} /></mesh>
        <mesh position={[0, 0.08, 0.101]}><boxGeometry args={[0.26, 0.12, 0.003]} /><Mat color="#3a4a5a" m={0.4} r={0.4} /></mesh>
        {[-0.06, 0.06].map((x, i) => (
          <mesh key={i} position={[x, 0.1, 0.103]}><boxGeometry args={[0.06, 0.04, 0.002]} /><GlowMat color={C.power} ei={0.5} /></mesh>
        ))}
        <mesh position={[0, 0.18, 0]}><boxGeometry args={[0.34, 0.02, 0.24]} /><Mat color={C.steel} m={0.5} r={0.3} /></mesh>
        {[-0.12, 0.12].map((x, i) => (
          <mesh key={i} position={[x, 0.26, 0]}><cylinderGeometry args={[0.008, 0.008, 0.16, 4]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
        ))}
        <mesh ref={animRef} position={[0, 0.2, 0]}><sphereGeometry args={[0.015, 6, 6]} /><GlowMat color={C.power} ei={0.7} /></mesh>
      </group>
    );
  }

  // ── SUBSTATION (default) ──
  return (
    <group>
      {[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.18, p[1]]}><cylinderGeometry args={[0.014, 0.026, 0.36, 6]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
      ))}
      {[0.08, 0.22, 0.32].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}><boxGeometry args={[0.24 - i * 0.04, 0.013, 0.24 - i * 0.04]} /><Mat color={C.steel} m={0.6} r={0.4} /></mesh>
      ))}
      <mesh position={[0, 0.38, 0]}><boxGeometry args={[0.36, 0.013, 0.013]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
      {[-0.14, 0, 0.14].map((x, i) => (
        <mesh ref={i === 1 ? animRef : undefined} key={i} position={[x, 0.4, 0]}><sphereGeometry args={[0.018, 8, 8]} /><GlowMat color={C.power} ei={0.8} /></mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   WATER SECTOR
   Subtypes: treatment_plant, storage, pipeline_terminal, pump_station, distribution
   ═══════════════════════════════════════════════════════════ */
export function WaterModel({ subtype }: { subtype: string }) {
  const animRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!animRef.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.12;
    animRef.current.scale.set(s, 1, s);
    (animRef.current.material as THREE.MeshStandardMaterial).opacity = 0.6 - Math.sin(clock.elapsedTime * 2) * 0.25;
  });

  const st = (subtype || '').toLowerCase();

  // ── TREATMENT PLANT ──
  if (st.includes('treatment')) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.38, 0.16, 0.28]} /><Mat color={C.concrete} m={0.3} r={0.6} /></mesh>
        {[-0.1, 0.1].map((x, i) => (
          <group key={i} position={[x, 0.18, 0]}>
            <mesh><cylinderGeometry args={[0.07, 0.07, 0.04, 16]} /><Mat color="#446688" m={0.4} r={0.3} /></mesh>
            <mesh ref={i === 0 ? animRef : undefined} position={[0, 0.025, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.005, 16]} /><GlowMat color={C.water} ei={0.5} op={0.6} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.22, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
          <Mat color={C.steel} m={0.6} r={0.3} />
        </mesh>
      </group>
    );
  }

  // ── PUMP STATION ──
  if (st.includes('pump')) {
    return (
      <group>
        <mesh position={[0, 0.07, 0]}><boxGeometry args={[0.24, 0.14, 0.18]} /><Mat color={C.concrete} m={0.3} r={0.6} /></mesh>
        {[-0.1, 0.1].map((x, i) => (
          <mesh key={i} position={[x, 0.1, 0.1]}><cylinderGeometry args={[0.022, 0.022, 0.12, 8]} /><Mat color={C.steel} m={0.6} r={0.3} /></mesh>
        ))}
        <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.04, 0.04, 0.06, 12]} /><Mat color={C.blue} m={0.5} r={0.3} /></mesh>
        <mesh ref={animRef} position={[0, 0.15, 0]}><sphereGeometry args={[0.018, 8, 8]} /><GlowMat color={C.water} ei={0.8} op={0.6} /></mesh>
      </group>
    );
  }

  // ── PIPELINE TERMINAL ──
  if (st.includes('pipeline')) {
    return (
      <group>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.28, 0.12, 0.18]} /><Mat color={C.concrete} m={0.3} r={0.6} /></mesh>
        <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.4, 8]} /><Mat color={C.steel} m={0.6} r={0.3} /></mesh>
        <mesh position={[0.2, 0.04, 0]}><torusGeometry args={[0.04, 0.012, 8, 12]} /><Mat color="#446688" m={0.5} r={0.3} /></mesh>
        <mesh ref={animRef} position={[0, 0.13, 0]}><sphereGeometry args={[0.015, 6, 6]} /><GlowMat color={C.water} ei={0.7} op={0.6} /></mesh>
      </group>
    );
  }

  // ── DISTRIBUTION main ──
  if (st.includes('distribution')) {
    return (
      <group>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.22, 0.1, 0.16]} /><Mat color={C.concrete} m={0.3} r={0.6} /></mesh>
        {[-0.14, 0, 0.14].map((x, i) => (
          <mesh key={i} position={[x, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.015, 0.015, 0.08, 6]} /><GlowMat color={C.water} ei={0.3} op={0.5} /></mesh>
        ))}
        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.04, 0.04, 0.04, 8]} /><Mat color="#446688" m={0.4} r={0.4} /></mesh>
        <mesh ref={animRef} position={[0, 0.15, 0]}><cylinderGeometry args={[0.035, 0.035, 0.005, 12]} /><GlowMat color={C.water} ei={0.5} op={0.6} /></mesh>
      </group>
    );
  }

  // ── STORAGE / reservoir (default) ──
  return (
    <group>
      {[[-0.05, -0.05], [0.05, -0.05], [-0.05, 0.05], [0.05, 0.05]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.1, p[1]]}><cylinderGeometry args={[0.013, 0.018, 0.2, 6]} /><Mat color={C.concrete} m={0.3} r={0.6} /></mesh>
      ))}
      <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.1, 0.09, 0.12, 16]} /><Mat color="#336699" m={0.5} r={0.3} /></mesh>
      <mesh ref={animRef} position={[0, 0.31, 0]}><cylinderGeometry args={[0.09, 0.09, 0.008, 16]} /><GlowMat color={C.water} ei={0.6} op={0.6} /></mesh>
      <mesh position={[0, 0.32, 0]}><sphereGeometry args={[0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#336699" metalness={0.5} roughness={0.3} transparent opacity={0.6} /></mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRANSPORT SECTOR
   Subtypes: highway, arterial_road, bridge, transit_hub, airport, port, metro, bus_depot
   ═══════════════════════════════════════════════════════════ */
export function TransportModel({ subtype }: { subtype: string }) {
  const animRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!animRef.current) return;
    (animRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.3 + Math.sin(clock.elapsedTime * 3) * 0.4;
  });

  const st = (subtype || '').toLowerCase();

  // ── AIRPORT ──
  if (st.includes('airport')) {
    return (
      <group>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.46, 0.1, 0.22]} /><meshStandardMaterial color={C.glass} metalness={0.7} roughness={0.2} transparent opacity={0.8} /></mesh>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.5, 0.02, 0.26]} /><Mat color="#445566" m={0.5} r={0.3} /></mesh>
        <mesh position={[0.18, 0.22, 0]}><cylinderGeometry args={[0.025, 0.022, 0.22, 8]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
        <mesh position={[0.18, 0.35, 0]}><boxGeometry args={[0.07, 0.035, 0.07]} /><meshStandardMaterial color={C.glass} metalness={0.6} roughness={0.2} /></mesh>
        <mesh position={[0, 0.002, 0.18]}><boxGeometry args={[0.55, 0.003, 0.04]} /><Mat color={C.road} m={0.1} r={0.8} /></mesh>
        {[-0.22, -0.11, 0, 0.11, 0.22].map((x, i) => (
          <mesh ref={i === 2 ? animRef : undefined} key={i} position={[x, 0.006, 0.18]}><sphereGeometry args={[0.006, 6, 6]} /><GlowMat color="#00ff88" ei={0.8} /></mesh>
        ))}
      </group>
    );
  }

  // ── BRIDGE / sea link ──
  if (st.includes('bridge') || st.includes('sea link') || st.includes('setu') || st.includes('atal')) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.55, 0.025, 0.1]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
        {[-0.18, 0.18].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.2, 0]}><boxGeometry args={[0.025, 0.26, 0.025]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
            {[-0.12, -0.06, 0.06, 0.12].map((cx, j) => (
              <mesh key={j} position={[x + cx * 0.5, 0.18, 0]} rotation={[0, 0, cx * 0.55]}>
                <cylinderGeometry args={[0.002, 0.002, 0.18, 4]} /><Mat color={C.steel} m={0.5} r={0.4} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 0.095, 0]}><boxGeometry args={[0.5, 0.003, 0.004]} /><GlowMat color={C.white} ei={0.3} /></mesh>
      </group>
    );
  }

  // ── METRO line ──
  if (st.includes('metro')) {
    return (
      <group>
        <mesh position={[0, 0.035, 0]}><boxGeometry args={[0.32, 0.07, 0.14]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
        <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.35, 0.018, 0.16]} /><Mat color="#445566" m={0.5} r={0.3} /></mesh>
        {[-0.13, 0.13].map((x, i) => (
          <mesh key={i} position={[x, 0.09, 0.07]}><cylinderGeometry args={[0.01, 0.01, 0.1, 6]} /><Mat color={C.steel} m={0.6} r={0.3} /></mesh>
        ))}
        <mesh position={[0, 0.08, -0.02]}><boxGeometry args={[0.25, 0.05, 0.05]} /><GlowMat color={C.transport} ei={0.3} /></mesh>
        <mesh ref={animRef} position={[0.12, 0.08, -0.02]}><sphereGeometry args={[0.01, 6, 6]} /><GlowMat color={C.white} ei={1} /></mesh>
      </group>
    );
  }

  // ── PORT ──
  if (st.includes('port')) {
    return (
      <group>
        <mesh position={[0, 0.025, 0]}><boxGeometry args={[0.38, 0.05, 0.18]} /><Mat color={C.concrete} m={0.3} r={0.6} /></mesh>
        <mesh position={[-0.08, 0.18, 0]}><boxGeometry args={[0.02, 0.32, 0.02]} /><Mat color={C.power} m={0.6} r={0.3} /></mesh>
        <mesh position={[0.04, 0.34, 0]}><boxGeometry args={[0.28, 0.018, 0.02]} /><Mat color={C.power} m={0.6} r={0.3} /></mesh>
        <mesh position={[0.1, 0.06, 0.04]}><boxGeometry args={[0.1, 0.05, 0.05]} /><Mat color={C.red} m={0.3} r={0.4} /></mesh>
        <mesh position={[0.06, 0.06, -0.06]}><boxGeometry args={[0.08, 0.04, 0.04]} /><Mat color={C.blue} m={0.3} r={0.4} /></mesh>
      </group>
    );
  }

  // ── BUS DEPOT ──
  if (st.includes('bus')) {
    return (
      <group>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.34, 0.12, 0.22]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
        <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.36, 0.02, 0.24]} /><Mat color="#445566" m={0.5} r={0.3} /></mesh>
        {[-0.08, 0.08].map((x, i) => (
          <mesh key={i} position={[x, 0.02, 0.14]}><boxGeometry args={[0.08, 0.03, 0.04]} /><GlowMat color={C.transport} ei={0.3} /></mesh>
        ))}
        <mesh ref={animRef} position={[0, 0.16, 0]}><sphereGeometry args={[0.012, 6, 6]} /><GlowMat color={C.transport} ei={0.7} /></mesh>
      </group>
    );
  }

  // ── HIGHWAY / arterial road ──
  if (st.includes('highway') || st.includes('arterial') || st.includes('expressway') || st.includes('freeway')) {
    return (
      <group>
        <mesh position={[0, 0.01, 0]}><boxGeometry args={[0.5, 0.015, 0.14]} /><Mat color={C.road} m={0.1} r={0.8} /></mesh>
        <mesh position={[0, 0.018, 0]}><boxGeometry args={[0.46, 0.002, 0.003]} /><GlowMat color={C.white} ei={0.4} /></mesh>
        {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0.018, 0]}><boxGeometry args={[0.06, 0.002, 0.003]} /><GlowMat color={C.power} ei={0.3} /></mesh>
        ))}
        {[-0.22, 0.22].map((x, i) => (
          <mesh key={i} position={[x, 0.04, 0]}><cylinderGeometry args={[0.006, 0.006, 0.06, 4]} /><Mat color={C.steel} m={0.6} r={0.3} /></mesh>
        ))}
        {[-0.22, 0.22].map((x, i) => (
          <mesh ref={i === 0 ? animRef : undefined} key={`l${i}`} position={[x, 0.075, 0]}><sphereGeometry args={[0.008, 6, 6]} /><GlowMat color={C.transport} ei={0.6} /></mesh>
        ))}
      </group>
    );
  }

  // ── TRANSIT HUB / station (default) ──
  return (
    <group>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.32, 0.16, 0.22]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
      <mesh position={[0, 0.1, 0.112]}><boxGeometry args={[0.14, 0.14, 0.018]} /><meshStandardMaterial color={C.glass} metalness={0.6} roughness={0.2} transparent opacity={0.7} /></mesh>
      <mesh position={[0, 0.18, 0]}><boxGeometry args={[0.35, 0.025, 0.25]} /><Mat color="#445566" m={0.5} r={0.3} /></mesh>
      <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.025, 0.03, 0.16, 8]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
      <mesh ref={animRef} position={[0, 0.38, 0]}><sphereGeometry args={[0.018, 8, 8]} /><GlowMat color={C.transport} ei={0.8} /></mesh>
      {[-0.07, 0.07].map((z, i) => (
        <mesh key={i} position={[0, 0.004, z - 0.14]}><boxGeometry args={[0.38, 0.004, 0.018]} /><Mat color="#555555" m={0.7} r={0.3} /></mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   TELECOM SECTOR
   Subtypes: data_center, exchange, cell_tower, fiber_node, submarine_cable
   ═══════════════════════════════════════════════════════════ */
export function TelecomModel({ subtype }: { subtype: string }) {
  const signalRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!signalRef.current) return;
    signalRef.current.children.forEach((ring, i) => {
      const t = (clock.elapsedTime * 1.5 + i * 0.5) % 2;
      const s = 0.5 + t * 0.8;
      ring.scale.set(s, s, s);
      const mat = (ring as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = Math.max(0, 1 - t * 0.6);
        mat.opacity = Math.max(0, 0.6 - t * 0.35);
      }
    });
  });

  const st = (subtype || '').toLowerCase();

  // ── DATA CENTER / NOC ──
  if (st.includes('data') || st.includes('noc')) {
    return (
      <group>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.32, 0.2, 0.22]} /><Mat color="#2a3a4a" m={0.6} r={0.3} /></mesh>
        {[0, 1, 2].map(row =>
          [0, 1, 2, 3].map(col => (
            <mesh key={`${row}-${col}`} position={[-0.07 + col * 0.05, 0.04 + row * 0.06, 0.112]}>
              <boxGeometry args={[0.035, 0.018, 0.002]} /><GlowMat color={row === 1 ? '#00ff00' : C.telecom} ei={0.5} />
            </mesh>
          ))
        )}
        <mesh position={[0.18, 0.07, 0]}><boxGeometry args={[0.05, 0.14, 0.18]} /><Mat color={C.steel} m={0.5} r={0.4} /></mesh>
        <mesh position={[-0.08, 0.24, 0]} rotation={[0.3, 0, 0]}>
          <sphereGeometry args={[0.04, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.steel} metalness={0.7} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  // ── EXCHANGE ──
  if (st.includes('exchange')) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.28, 0.16, 0.2]} /><Mat color="#3a4a5a" m={0.5} r={0.4} /></mesh>
        <mesh position={[0, 0.08, 0.101]}><boxGeometry args={[0.24, 0.12, 0.003]} /><Mat color="#2a3a4a" m={0.4} r={0.4} /></mesh>
        {[0, 1, 2].map(row =>
          [0, 1].map(col => (
            <mesh key={`${row}-${col}`} position={[-0.04 + col * 0.08, 0.04 + row * 0.04, 0.103]}>
              <boxGeometry args={[0.04, 0.015, 0.002]} /><GlowMat color={C.telecom} ei={0.4} />
            </mesh>
          ))
        )}
        <group ref={signalRef} position={[0, 0.2, 0]}>
          {[0, 1].map(i => (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.04, 0.003, 6, 16]} /><GlowMat color={C.telecom} ei={0.5} op={0.4} /></mesh>
          ))}
        </group>
      </group>
    );
  }

  // ── FIBER NODE / backbone ──
  if (st.includes('fiber') || st.includes('backbone')) {
    return (
      <group>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.18, 0.1, 0.14]} /><Mat color="#3a4a5a" m={0.5} r={0.4} /></mesh>
        {[0, 1, 2, 3].map(i => {
          const angle = (i / 4) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.1, 0.035, Math.sin(angle) * 0.1]} rotation={[0, -angle, Math.PI / 4]}>
              <cylinderGeometry args={[0.006, 0.006, 0.12, 6]} /><GlowMat color={C.telecom} ei={0.4} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.11, 0.07]}><sphereGeometry args={[0.012, 6, 6]} /><GlowMat color="#00ff44" ei={1} /></mesh>
      </group>
    );
  }

  // ── SUBMARINE CABLE ──
  if (st.includes('submarine') || st.includes('cable')) {
    return (
      <group>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.24, 0.12, 0.16]} /><Mat color="#2a3a4a" m={0.6} r={0.3} /></mesh>
        <mesh position={[0, 0.06, 0.081]}><boxGeometry args={[0.2, 0.08, 0.003]} /><GlowMat color={C.telecom} ei={0.2} op={0.4} /></mesh>
        {[-0.1, 0, 0.1].map((x, i) => (
          <mesh key={i} position={[x, 0.001, 0.12]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.06, 6]} /><GlowMat color={C.telecom} ei={0.3} op={0.6} /></mesh>
        ))}
        <group ref={signalRef} position={[0, 0.14, 0]}>
          {[0, 1, 2].map(i => (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.05, 0.003, 6, 20]} /><GlowMat color={C.water} ei={0.6} op={0.4} /></mesh>
          ))}
        </group>
      </group>
    );
  }

  // ── CELL TOWER (default) ──
  return (
    <group>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.013, 0.022, 0.4, 6]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
      {[0, 120, 240].map((deg, i) => {
        const rad = (deg / 180) * Math.PI;
        return (
          <group key={i} position={[0, 0.34, 0]} rotation={[0, rad, 0]}>
            <mesh position={[0.055, 0, 0]}><boxGeometry args={[0.07, 0.035, 0.013]} /><Mat color={C.white} m={0.4} r={0.3} /></mesh>
          </group>
        );
      })}
      <group ref={signalRef} position={[0, 0.36, 0]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.05, 0.003, 6, 20]} /><GlowMat color={C.telecom} ei={0.5} op={0.4} /></mesh>
        ))}
      </group>
      <mesh position={[0, 0.004, 0]}><cylinderGeometry args={[0.05, 0.05, 0.008, 8]} /><Mat color={C.concrete} m={0.3} r={0.6} /></mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMERGENCY SECTOR
   Subtypes: hospital, fire_station, police_station, eoc, dispatch, rescue_unit, shelter, coast_guard
   ═══════════════════════════════════════════════════════════ */
export function EmergencyModel({ subtype }: { subtype: string }) {
  const pulseRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!pulseRef.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 4) * 0.25;
    pulseRef.current.scale.set(s, s, s);
    (pulseRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.5 + Math.sin(clock.elapsedTime * 4) * 0.5;
  });

  const st = (subtype || '').toLowerCase();

  // ── HOSPITAL ──
  if (st.includes('hospital')) {
    return (
      <group>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.32, 0.24, 0.22]} /><Mat color={C.white} m={0.2} r={0.5} /></mesh>
        {[-0.08, 0, 0.08].map((x, i) =>
          [0.06, 0.15].map((y, j) => (
            <mesh key={`${i}-${j}`} position={[x, y, 0.112]}><boxGeometry args={[0.04, 0.04, 0.002]} /><meshStandardMaterial color={C.glass} emissive="#aaddff" emissiveIntensity={0.3} transparent opacity={0.7} /></mesh>
          ))
        )}
        <group position={[0, 0.2, 0.113]}>
          <mesh><boxGeometry args={[0.07, 0.02, 0.002]} /><GlowMat color={C.emergency} ei={0.8} /></mesh>
          <mesh><boxGeometry args={[0.02, 0.07, 0.002]} /><GlowMat color={C.emergency} ei={0.8} /></mesh>
        </group>
        <mesh ref={pulseRef} position={[0, 0.26, 0]}><sphereGeometry args={[0.016, 8, 8]} /><GlowMat color={C.emergency} ei={1} /></mesh>
      </group>
    );
  }

  // ── FIRE STATION ──
  if (st.includes('fire')) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.32, 0.16, 0.22]} /><Mat color={C.red} m={0.3} r={0.4} /></mesh>
        {[-0.08, 0.08].map((x, i) => (
          <mesh key={i} position={[x, 0.05, 0.112]}><boxGeometry args={[0.08, 0.1, 0.002]} /><Mat color="#aa2222" m={0.4} r={0.3} /></mesh>
        ))}
        <mesh position={[0.13, 0.24, 0]}><cylinderGeometry args={[0.025, 0.03, 0.18, 8]} /><Mat color="#bb3333" m={0.3} r={0.4} /></mesh>
        <mesh ref={pulseRef} position={[0.13, 0.35, 0]}><coneGeometry args={[0.02, 0.035, 8]} /><GlowMat color={C.emergency} ei={1} /></mesh>
        <mesh position={[-0.08, 0.012, 0.16]}><boxGeometry args={[0.1, 0.035, 0.04]} /><Mat color="#dd2222" m={0.4} r={0.3} /></mesh>
      </group>
    );
  }

  // ── POLICE STATION ──
  if (st.includes('police')) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.28, 0.16, 0.2]} /><Mat color="#334466" m={0.3} r={0.4} /></mesh>
        <mesh position={[0, 0.05, 0.101]}><boxGeometry args={[0.07, 0.1, 0.008]} /><Mat color="#556688" m={0.4} r={0.3} /></mesh>
        <mesh position={[0, 0.13, 0.102]}><boxGeometry args={[0.05, 0.05, 0.002]} /><GlowMat color="#4488ff" ei={0.6} /></mesh>
        <mesh ref={pulseRef} position={[0, 0.18, 0]}><sphereGeometry args={[0.016, 8, 8]} /><GlowMat color="#4488ff" ei={1} /></mesh>
      </group>
    );
  }

  // ── EOC (Emergency Operations Centre) ──
  if (st.includes('eoc') || st.includes('control') || st.includes('disaster')) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.3, 0.16, 0.22]} /><Mat color="#2a3a4a" m={0.4} r={0.4} /></mesh>
        <mesh position={[0, 0.08, 0.112]}><boxGeometry args={[0.22, 0.1, 0.003]} /><GlowMat color="#4488ff" ei={0.3} op={0.5} /></mesh>
        <mesh position={[0.1, 0.22, 0]}><cylinderGeometry args={[0.005, 0.005, 0.12, 4]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
        <mesh position={[0.1, 0.3, 0]} rotation={[0.3, 0, 0]}><sphereGeometry args={[0.025, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={C.steel} metalness={0.7} roughness={0.2} side={THREE.DoubleSide} /></mesh>
        <mesh ref={pulseRef} position={[0, 0.18, 0]}><sphereGeometry args={[0.014, 8, 8]} /><GlowMat color={C.emergency} ei={1} /></mesh>
      </group>
    );
  }

  // ── DISPATCH (Dial 100 / 112) ──
  if (st.includes('dispatch')) {
    return (
      <group>
        <mesh position={[0, 0.07, 0]}><boxGeometry args={[0.26, 0.14, 0.18]} /><Mat color="#2a3a4a" m={0.4} r={0.4} /></mesh>
        {[-0.06, 0.06].map((x, i) => (
          <mesh key={i} position={[x, 0.09, 0.092]}><boxGeometry args={[0.06, 0.05, 0.003]} /><GlowMat color="#4488ff" ei={0.4} op={0.6} /></mesh>
        ))}
        <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.005, 0.005, 0.1, 4]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
        <mesh ref={pulseRef} position={[0, 0.24, 0]}><sphereGeometry args={[0.014, 8, 8]} /><GlowMat color={C.emergency} ei={1} /></mesh>
      </group>
    );
  }

  // ── RESCUE UNIT (NDRF) ──
  if (st.includes('rescue') || st.includes('ndrf')) {
    return (
      <group>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.28, 0.12, 0.2]} /><Mat color="#3a5a3a" m={0.3} r={0.5} /></mesh>
        <mesh position={[-0.06, 0.014, 0.14]}><boxGeometry args={[0.12, 0.04, 0.06]} /><Mat color="#4a6a4a" m={0.4} r={0.4} /></mesh>
        <mesh position={[0.06, 0.014, 0.14]}><boxGeometry args={[0.1, 0.035, 0.05]} /><Mat color="#4a6a4a" m={0.4} r={0.4} /></mesh>
        <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.06, 0.06, 0.002]} /><GlowMat color="#ff8800" ei={0.5} /></mesh>
        <mesh ref={pulseRef} position={[0, 0.18, 0]}><sphereGeometry args={[0.014, 8, 8]} /><GlowMat color="#ff8800" ei={1} /></mesh>
      </group>
    );
  }

  // ── SHELTER ──
  if (st.includes('shelter')) {
    return (
      <group>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.32, 0.12, 0.22]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
        <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.36, 0.03, 0.26]} /><Mat color="#556677" m={0.4} r={0.4} />
        </mesh>
        <mesh position={[0, 0.04, 0.112]}><boxGeometry args={[0.06, 0.08, 0.002]} /><Mat color="#667788" m={0.4} r={0.3} /></mesh>
        <mesh ref={pulseRef} position={[0, 0.18, 0]}><sphereGeometry args={[0.012, 8, 8]} /><GlowMat color={C.emergency} ei={0.7} /></mesh>
      </group>
    );
  }

  // ── COAST GUARD ──
  if (st.includes('coast')) {
    return (
      <group>
        <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.26, 0.08, 0.16]} /><Mat color={C.concrete} m={0.3} r={0.5} /></mesh>
        <mesh position={[0.08, 0.01, 0.12]}><boxGeometry args={[0.14, 0.025, 0.04]} /><Mat color={C.white} m={0.3} r={0.4} /></mesh>
        <mesh position={[0.1, 0.035, 0.12]}><boxGeometry args={[0.03, 0.03, 0.025]} /><Mat color="#445566" m={0.5} r={0.3} /></mesh>
        <mesh position={[-0.06, 0.12, 0]}><cylinderGeometry args={[0.005, 0.005, 0.1, 4]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
        <mesh ref={pulseRef} position={[-0.06, 0.18, 0]}><sphereGeometry args={[0.012, 8, 8]} /><GlowMat color="#4488ff" ei={1} /></mesh>
      </group>
    );
  }

  // ── DEFAULT emergency ──
  return (
    <group>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.26, 0.16, 0.18]} /><Mat color="#445566" m={0.3} r={0.4} /></mesh>
      <mesh position={[0.08, 0.2, 0]}><cylinderGeometry args={[0.005, 0.005, 0.12, 4]} /><Mat color={C.steel} m={0.7} r={0.3} /></mesh>
      <mesh position={[0, 0.12, 0.092]}><boxGeometry args={[0.05, 0.05, 0.002]} /><GlowMat color={C.emergency} ei={0.6} /></mesh>
      <mesh ref={pulseRef} position={[0, 0.18, 0]}><sphereGeometry args={[0.014, 8, 8]} /><GlowMat color={C.emergency} ei={1} /></mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   Factory function – returns model for given sector
   ═══════════════════════════════════════════════════════════ */
export function SectorModel({ sector, subtype }: { sector: string; subtype: string }) {
  switch (sector) {
    case 'power': return <PowerModel subtype={subtype} />;
    case 'water': return <WaterModel subtype={subtype} />;
    case 'transport': return <TransportModel subtype={subtype} />;
    case 'telecom': return <TelecomModel subtype={subtype} />;
    case 'emergency': return <EmergencyModel subtype={subtype} />;
    default: return <PowerModel subtype={subtype} />;
  }
}
