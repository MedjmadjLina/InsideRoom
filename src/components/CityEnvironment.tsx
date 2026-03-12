// ============================================
// CityEnvironment.tsx — NYC-style exterior
// Visible through apartment windows.
// Deterministic building grid, no random flicker.
// ============================================

"use client";

import { useMemo } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useLightingStore, getSkyColor } from "@/store/lightingStore";
import * as THREE from "three";

// ── Seeded PRNG (mulberry32) — fully deterministic ──
function createPRNG(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Building data types ──
interface BuildingData {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  windowRows: number;
  windowCols: number;
}

// NYC color palette
const BUILDING_COLORS = [
  "#3d3c3a", // dark concrete
  "#4a4540", // brownstone dark
  "#5c5248", // brownstone mid
  "#44484e", // steel gray
  "#383c40", // slate
  "#5a4e46", // terracotta dark
  "#4e5258", // blue-gray
  "#3f3b38", // charcoal
];

function generateBuildings(roomWidth: number, roomLength: number): BuildingData[] {
  const rng = createPRNG(42); // fixed seed → same scene every time
  const buildings: BuildingData[] = [];
  const wallZ = -roomLength / 2;

  // ── Near row: right across the street ──
  {
    const rowZ = wallZ - 8;        // ~8m across the street
    const streetW = roomWidth + 14; // wider than room for panorama
    let x = -streetW / 2;
    while (x < streetW / 2) {
      const w = 3 + rng() * 5;     // 3–8m wide
      const d = 4 + rng() * 5;     // 4–9m deep
      const h = 5 + rng() * 22;    // 5–27m tall
      const cx = x + w / 2;
      buildings.push({
        x: cx,
        z: rowZ - d / 2,
        w, d, h,
        color: BUILDING_COLORS[Math.floor(rng() * BUILDING_COLORS.length)],
        windowRows: Math.max(2, Math.floor(h / 3.2)),
        windowCols: Math.max(1, Math.floor(w / 2.2)),
      });
      x += w + 0.25 + rng() * 0.5; // small gaps between buildings
    }
  }

  // ── Mid row: 2nd block further back ──
  {
    const rowZ = wallZ - 24;
    const streetW = roomWidth + 30;
    let x = -streetW / 2;
    while (x < streetW / 2) {
      const w = 4 + rng() * 7;
      const d = 5 + rng() * 6;
      const h = 10 + rng() * 45;   // taller for depth
      const cx = x + w / 2;
      buildings.push({
        x: cx,
        z: rowZ - d / 2,
        w, d, h,
        color: BUILDING_COLORS[Math.floor(rng() * BUILDING_COLORS.length)],
        windowRows: Math.max(3, Math.floor(h / 3.2)),
        windowCols: Math.max(1, Math.floor(w / 2.2)),
      });
      x += w + 0.2 + rng() * 0.3;
    }
  }

  // ── Far row: skyline silhouette ──
  {
    const rowZ = wallZ - 50;
    const streetW = roomWidth + 50;
    let x = -streetW / 2;
    while (x < streetW / 2) {
      const w = 5 + rng() * 10;
      const d = 6 + rng() * 8;
      const h = 20 + rng() * 80;  // skyscrapers
      const cx = x + w / 2;
      buildings.push({
        x: cx,
        z: rowZ - d / 2,
        w, d, h,
        // far buildings slightly darker/foggier
        color: `hsl(${210 + rng() * 30}, ${8 + rng() * 6}%, ${18 + rng() * 10}%)`,
        windowRows: 0,  // too far for window detail
        windowCols: 0,
      });
      x += w + 0.15 + rng() * 0.25;
    }
  }

  return buildings;
}

// ── Single building mesh ──
function Building({ b, ambient, fogColor }: { b: BuildingData; ambient: number; fogColor: string }) {
  // Atmospheric perspective: far buildings (large |z|) tint toward fogColor
  const atmosphericColor = useMemo(() => {
    const depth = Math.abs(b.z); // distance behind window wall
    const t = Math.min(1, (depth - 6) / 55); // 0 = near, 1 = very far
    if (t <= 0) return b.color;
    // Lerp between building color and fog/sky color
    const bc = new THREE.Color(b.color);
    const fc = new THREE.Color(fogColor);
    bc.lerp(fc, t * 0.65);
    return `#${bc.getHexString()}`;
  }, [b.color, b.z, fogColor]);

  return (
    <group position={[b.x, b.h / 2, b.z]}>
      {/* Main mass */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial
          color={atmosphericColor}
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>

      {/* Window grid — small emissive planes on front face */}
      {b.windowCols > 0 && b.windowRows > 0 && (
        <WindowGrid
          bw={b.w}
          bh={b.h}
          bd={b.d}
          cols={b.windowCols}
          rows={b.windowRows}
          ambient={ambient}
        />
      )}
    </group>
  );
}

// ── Window grid overlay on building face ──
function WindowGrid({
  bw, bh, bd, cols, rows, ambient,
}: {
  bw: number; bh: number; bd: number;
  cols: number; rows: number;
  ambient: number;
}) {
  const rng = createPRNG(Math.round(bw * 1000 + bh * 100 + bd * 10));

  // Window positions relative to building center
  const winW = Math.min(0.7, (bw * 0.72) / cols);
  const winH = Math.min(1.0, (bh * 0.78) / rows);
  const gapX = (bw * 0.72) / cols;
  const gapY = (bh * 0.78) / rows;
  const startX = -(cols - 1) * gapX / 2;
  const startY = -(rows - 1) * gapY / 2;
  const faceZ = bd / 2 + 0.01;

  // Some windows lit, some dark — deterministic per building
  const litColor = "#d4c8a0"; // warm interior
  const darkColor = "#1a1e22";

  return (
    <group>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const lit = rng() > 0.35; // ~65% of windows lit
          return (
            <mesh
              key={`${r}-${c}`}
              position={[startX + c * gapX, startY + r * gapY, faceZ]}
            >
              <planeGeometry args={[winW, winH]} />
              <meshStandardMaterial
                color={lit ? litColor : darkColor}
                emissive={lit ? litColor : "#000000"}
                emissiveIntensity={lit ? Math.max(0, 1.2 - ambient * 2) : 0}
                roughness={0.3}
                metalness={0.25}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ── Lampadaire haussmannien parisien (un seul, centré) ──
function ParisianLamp({ wallZ, timeOfDay }: { wallZ: number; timeOfDay: number }) {
  const isOn = timeOfDay >= 17 || timeOfDay < 5;
  const iron = "#2a2720";
  const amber = "#ffca78";
  const POLE_H = 4.5;

  // Bras : part du sommet du fût en direction -Z (vers la rue) avec légère montée
  // Direction normalisée vers [-Z, +Y] : atan2(armDZ, armDY) donne l'angle Rx
  const armDY = 0.3;   // montée verticale du bras
  const armDZ = -1.5;  // extension vers la rue (-Z)
  const armLen = Math.sqrt(armDY * armDY + armDZ * armDZ); // ≈ 1.53 m
  // Rotation Rx : après rotation, l'axe Y du cylindre pointe vers (0, cos θ, sin θ)
  // On veut (0, armDY/armLen, armDZ/armLen) → θ = atan2(armDZ, armDY)
  const armAngle = Math.atan2(armDZ, armDY); // ≈ -79° (vers -Z avec légère hausse)

  // Centre du bras et position de la lanterne en espace local
  const armCY = POLE_H + armDY / 2;
  const armCZ = armDZ / 2;
  const lanternY = POLE_H + armDY;
  const lanternZ = armDZ;

  return (
    // Lampadaire centré, sur le trottoir côté immeuble
    <group position={[0, 0, wallZ - 2.0]}>
      {/* ── Socle ── */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.17, 0.24, 8]} />
        <meshStandardMaterial color={iron} roughness={0.6} metalness={0.7} />
      </mesh>

      {/* ── Fût (légèrement conique) ── */}
      <mesh position={[0, POLE_H / 2 + 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.030, 0.052, POLE_H, 8]} />
        <meshStandardMaterial color={iron} roughness={0.55} metalness={0.75} />
      </mesh>

      {/* ── Bague décorative à mi-hauteur ── */}
      <mesh position={[0, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.066, 0.019, 6, 16]} />
        <meshStandardMaterial color={iron} roughness={0.5} metalness={0.82} />
      </mesh>

      {/* ── Couronne au sommet du fût ── */}
      <mesh position={[0, POLE_H + 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.058, 0.020, 6, 16]} />
        <meshStandardMaterial color={iron} roughness={0.5} metalness={0.82} />
      </mesh>

      {/* ── Bras incliné vers la rue ── */}
      <mesh position={[0, armCY, armCZ]} rotation={[armAngle, 0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.024, armLen, 6]} />
        <meshStandardMaterial color={iron} roughness={0.5} metalness={0.78} />
      </mesh>

      {/* ── Lanterne ── */}
      <group position={[0, lanternY, lanternZ]}>
        {/* Cage hexagonale en fonte */}
        <mesh castShadow>
          <cylinderGeometry args={[0.118, 0.102, 0.42, 6]} />
          <meshStandardMaterial color={iron} roughness={0.5} metalness={0.72} transparent opacity={0.82} />
        </mesh>
        {/* Verre ambré */}
        <mesh>
          <cylinderGeometry args={[0.086, 0.076, 0.31, 6]} />
          <meshStandardMaterial
            color={isOn ? amber : "#0e0e0e"}
            emissive={isOn ? new THREE.Color(amber) : new THREE.Color("#000")}
            emissiveIntensity={isOn ? 2.8 : 0}
            transparent
            opacity={isOn ? 0.88 : 0.4}
            roughness={0.08}
            metalness={0.0}
          />
        </mesh>
        {/* Chapeau conique */}
        <mesh position={[0, 0.31, 0]}>
          <coneGeometry args={[0.14, 0.24, 6]} />
          <meshStandardMaterial color={iron} roughness={0.5} metalness={0.72} />
        </mesh>
        {/* Boule finale */}
        <mesh position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.030, 6, 5]} />
          <meshStandardMaterial color={iron} roughness={0.4} metalness={0.85} />
        </mesh>

        {/* ── Lumière ambrée sur le trottoir ── */}
        {isOn && (
          <pointLight
            color={amber}
            intensity={48}
            distance={16}
            decay={1.6}
            castShadow={false}
          />
        )}
      </group>
    </group>
  );
}

// ── Street / sidewalk ──
function Street({ roomWidth, wallZ }: { roomWidth: number; wallZ: number }) {
  return (
    <group>
      {/* Building base apron / ground plane between city and room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, wallZ - 2]} receiveShadow>
        <planeGeometry args={[roomWidth + 20, 6]} />
        <meshStandardMaterial color="#4f4b44" roughness={0.95} metalness={0} />
      </mesh>
      {/* Sidewalk flags */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, wallZ - 8]} receiveShadow>
        <planeGeometry args={[roomWidth + 20, 9]} />
        <meshStandardMaterial color="#4a463f" roughness={0.95} metalness={0} />
      </mesh>
      {/* Street asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, wallZ - 18]} receiveShadow>
        <planeGeometry args={[roomWidth + 20, 16]} />
        <meshStandardMaterial color="#32302c" roughness={1} metalness={0} />
      </mesh>
      {/* Yellow center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, wallZ - 18]}>
        <planeGeometry args={[0.12, 14]} />
        <meshBasicMaterial color="#c8a830" />
      </mesh>
      {/* Curb ledge */}
      <mesh position={[0, 0.07, wallZ - 3.5]} castShadow receiveShadow>
        <boxGeometry args={[roomWidth + 20, 0.14, 0.35]} />
        <meshStandardMaterial color="#605c56" roughness={0.88} metalness={0} />
      </mesh>
    </group>
  );
}

// ── Sky backdrop with gradient horizon glow ──
function SkyBackdrop({ wallZ, skyColor, timeOfDay }: {
  wallZ: number;
  skyColor: string;
  timeOfDay: number;
}) {
  // Zenith: deeper blue/dark above
  const zenithColor = useMemo(() => {
    const t = timeOfDay;
    if (t < 5 || t >= 20) return "#07070f";
    if (t < 7)  return "#1a3560";
    if (t < 10) return "#4a7ab5";
    if (t < 14) return "#5b8dc8";
    if (t < 17) return "#5080b0";
    if (t < 19) return "#2a4070";
    return "#0d1530";
  }, [timeOfDay]);

  // Horizon glow: warm at sunrise/sunset, pale blue midday, orange-pink at dusk
  const horizonColor = useMemo(() => {
    const t = timeOfDay;
    if (t < 5 || t >= 20) return "#0d0d1a";
    if (t < 6.5) return "#7a3a10";
    if (t < 8)  return "#e8803a";
    if (t < 10) return "#c8d8f0";
    if (t < 14) return "#d8e8f8";
    if (t < 17) return "#c8d4e8";
    if (t < 18) return "#e09050";
    if (t < 19) return "#c05518";
    return "#2a1520";
  }, [timeOfDay]);

  // Night city glow on horizon
  const cityGlow = (timeOfDay < 6 || timeOfDay >= 19);

  return (
    <group>
      {/* Zenith sky — large plane far behind */}
      <mesh position={[0, 55, wallZ - 100]}>
        <planeGeometry args={[250, 80]} />
        <meshBasicMaterial color={zenithColor} />
      </mesh>

      {/* Horizon band */}
      <mesh position={[0, 14, wallZ - 95]}>
        <planeGeometry args={[250, 32]} />
        <meshBasicMaterial color={horizonColor} />
      </mesh>

      {/* Street-level sky fill */}
      <mesh position={[0, -1, wallZ - 90]}>
        <planeGeometry args={[250, 14]} />
        <meshBasicMaterial color={skyColor} />
      </mesh>

      {/* Night: warm amber city-glow bloom near horizon */}
      {cityGlow && (
        <mesh position={[0, 8, wallZ - 85]}>
          <planeGeometry args={[200, 18]} />
          <meshBasicMaterial color="#5a3010" transparent opacity={0.45} />
        </mesh>
      )}
    </group>
  );
}

// ── Main export ──
export default function CityEnvironment() {
  const room = useRoomStore((s) => s.room);
  const sun = useLightingStore((s) => s.sun);
  const ambient = useLightingStore((s) => s.ambient);

  const wallZ = -room.length / 2;
  const skyColor = useMemo(() => getSkyColor(sun.timeOfDay), [sun.timeOfDay]);
  const buildings = useMemo(
    () => generateBuildings(room.width, room.length),
    [room.width, room.length]
  );

  return (
    <group>
      <SkyBackdrop wallZ={wallZ} skyColor={skyColor} timeOfDay={sun.timeOfDay} />
      <Street roomWidth={room.width} wallZ={wallZ} />
      <ParisianLamp wallZ={wallZ} timeOfDay={sun.timeOfDay} />

      {/* Atmospheric haze layers between building rows */}
      {(sun.timeOfDay >= 7 && sun.timeOfDay < 18) && (
        <>
          {/* Near haze — subtle ground fog at street level */}
          <mesh position={[0, 1.2, wallZ - 12]} rotation={[0, 0, 0]}>
            <planeGeometry args={[room.width + 18, 5]} />
            <meshBasicMaterial color={skyColor} transparent opacity={0.12} depthWrite={false} />
          </mesh>
          {/* Mid haze — atmospheric layer above mid-row buildings */}
          <mesh position={[0, 12, wallZ - 32]}>
            <planeGeometry args={[room.width + 40, 10]} />
            <meshBasicMaterial color={skyColor} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        </>
      )}

      {buildings.map((b, i) => (
        <Building key={i} b={b} ambient={ambient.intensity} fogColor={skyColor} />
      ))}
    </group>
  );
}
