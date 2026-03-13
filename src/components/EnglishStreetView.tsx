// ============================================
// EnglishStreetView.tsx - English street context
// Visible through apartment windows and from far out.
// Replaces CityEnvironment. Positioned correctly so
// the street is 3 floors below the apartment (y = STREET_Y).
// ============================================

"use client";

import { useMemo, type ReactElement } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useLightingStore, getSkyColor } from "@/store/lightingStore";
import { STREET_Y, FLOOR_H } from "./BuildingShell";
import * as THREE from "three";

function createPRNG(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPPOSITE_BRICKS = [
  "#b84c38",
  "#c86048",
  "#9e3c2c",
  "#d4a882",
  "#c8b898",
  "#e8e0d0",
  "#f0e8d8",
];
const STONE_WHITE = "#ece6dc";

function atmosphericColor(baseColor: string, depth: number, fogColor: string): string {
  const d = Math.max(0, depth - 8) / 60;
  if (d <= 0) return baseColor;
  const bc = new THREE.Color(baseColor);
  const fc = new THREE.Color(fogColor);
  bc.lerp(fc, Math.min(d * 0.7, 0.7));
  return `#${bc.getHexString()}`;
}

function StreetSurface({ roomWidth, facadeZ }: { roomWidth: number; facadeZ: number }) {
  const streetW = Math.max(roomWidth + 60, 180);
  const pavement = 2.2;
  const roadW = 8.5;
  const farPave = 2.0;
  const totalZ = pavement + roadW + farPave;

  return (
    <group position={[0, STREET_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, facadeZ - pavement / 2]}>
        <planeGeometry args={[streetW, pavement]} />
        <meshStandardMaterial color="#b8b0a8" roughness={0.95} metalness={0} />
      </mesh>

      <mesh position={[0, 0.055, facadeZ - pavement]}>
        <boxGeometry args={[streetW, 0.11, 0.18]} />
        <meshStandardMaterial color="#c8c0b8" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, facadeZ - pavement - roadW / 2]}>
        <planeGeometry args={[streetW, roadW]} />
        <meshStandardMaterial color="#4a4846" roughness={0.96} metalness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, facadeZ - pavement - roadW / 2]}>
        <planeGeometry args={[streetW, 0.12]} />
        <meshStandardMaterial color="#d8d0b8" roughness={0.88} />
      </mesh>

      <mesh position={[0, 0.055, facadeZ - pavement - roadW]}>
        <boxGeometry args={[streetW, 0.11, 0.18]} />
        <meshStandardMaterial color="#c8c0b8" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, facadeZ - pavement - roadW - farPave / 2]}>
        <planeGeometry args={[streetW, farPave]} />
        <meshStandardMaterial color="#b8b0a8" roughness={0.95} metalness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, facadeZ - totalZ - 55]}>
        <planeGeometry args={[streetW + 80, 140]} />
        <meshStandardMaterial color="#48443e" roughness={0.98} metalness={0} />
      </mesh>
    </group>
  );
}

interface OppBuilding {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  floors: number;
  winCols: number;
}

function OppositeBuilding({
  b,
  fogColor,
  reducedDetail = false,
}: {
  b: OppBuilding;
  fogColor: string;
  reducedDetail?: boolean;
}) {
  const rng = useMemo(() => createPRNG(Math.round(b.x * 100 + b.z * 10)), [b.x, b.z]);
  const aColor = useMemo(
    () => atmosphericColor(b.color, Math.abs(b.z), fogColor),
    [b.color, b.z, fogColor],
  );
  const stoneColor = useMemo(
    () => atmosphericColor(STONE_WHITE, Math.abs(b.z), fogColor),
    [b.z, fogColor],
  );

  const winW = Math.min(0.85, (b.w * 0.65) / b.winCols);
  const winH = 1.3;
  const gapX = (b.w * 0.65) / b.winCols;

  return (
    <group position={[b.x, STREET_Y + b.h / 2, b.z]}>
      <mesh receiveShadow castShadow={!reducedDetail}>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial color={aColor} roughness={0.92} metalness={0} />
      </mesh>

      {Array.from({ length: b.floors + 1 }, (_, i) => (
        <mesh key={i} position={[0, -b.h / 2 + i * FLOOR_H + 0.18, b.d / 2 + 0.008]}>
          <boxGeometry args={[b.w + 0.06, 0.28, 0.016]} />
          <meshStandardMaterial color={stoneColor} roughness={0.75} metalness={0.02} />
        </mesh>
      ))}

      {Array.from({ length: b.floors }, (_, fi) =>
        Array.from({ length: b.winCols }, (_, ci) => {
          const lit = rng() > 0.28;
          const wx = -((b.winCols - 1) * gapX) / 2 + ci * gapX;
          const wy = -b.h / 2 + fi * FLOOR_H + FLOOR_H * 0.52;
          return (
            <group key={`${fi}-${ci}`} position={[wx, wy, b.d / 2 + 0.004]}>
              <mesh>
                <boxGeometry args={[winW + 0.12, winH + 0.1, 0.018]} />
                <meshStandardMaterial color={stoneColor} roughness={0.72} metalness={0.02} />
              </mesh>
              <mesh>
                <boxGeometry args={[winW, winH, 0.006]} />
                <meshStandardMaterial
                  color={lit ? "#c8b08a" : "#1a2830"}
                  roughness={0.08}
                  metalness={lit ? 0 : 0.08}
                  transparent
                  opacity={lit ? 0.82 : 0.92}
                  emissive={new THREE.Color(lit ? "#c09050" : "#000000")}
                  emissiveIntensity={lit ? 0.18 : 0}
                />
              </mesh>
            </group>
          );
        }),
      )}

      <mesh position={[0, b.h / 2 + 0.16, b.d / 2 + 0.008]}>
        <boxGeometry args={[b.w + 0.12, 0.32, 0.016]} />
        <meshStandardMaterial color={stoneColor} roughness={0.72} metalness={0.02} />
      </mesh>
    </group>
  );
}

function generateOppositeRow(
  roomWidth: number,
  facadeZ: number,
  rowOffset: number,
  seed: number,
): OppBuilding[] {
  const rng = createPRNG(seed);
  const rowZ = facadeZ - rowOffset;
  const spanW = Math.max(roomWidth + 28, 170);
  const buildings: OppBuilding[] = [];
  let x = -spanW / 2;

  while (x < spanW / 2) {
    const w = 4 + rng() * 6;
    const d = 3 + rng() * 4;
    const floors = 3 + Math.floor(rng() * 4);
    const h = floors * FLOOR_H + 0.5;
    const color = OPPOSITE_BRICKS[Math.floor(rng() * OPPOSITE_BRICKS.length)];
    buildings.push({
      x: x + w / 2,
      z: rowZ - d / 2,
      w,
      d,
      h,
      color,
      floors,
      winCols: Math.max(1, Math.floor(w / 2.8)),
    });
    x += w + 0.08 + rng() * 0.18;
  }

  return buildings;
}

function StreetTree({
  x,
  z,
  reducedDetail = false,
}: {
  x: number;
  z: number;
  reducedDetail?: boolean;
}) {
  const trunkH = 2.4;
  const canH = 2.2;
  const canR = 1.3;

  return (
    <group position={[x, STREET_Y, z]}>
      <mesh position={[0, trunkH / 2, 0]} castShadow={!reducedDetail}>
        <cylinderGeometry args={[0.08, 0.12, trunkH, 6]} />
        <meshStandardMaterial color="#4a3828" roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0, trunkH + canH * 0.42, 0]} castShadow={!reducedDetail} receiveShadow>
        <sphereGeometry args={[canR, 10, 8]} />
        <meshStandardMaterial color="#2e5c28" roughness={0.94} metalness={0} />
      </mesh>
    </group>
  );
}

function StreetLamp({
  x,
  z,
  isOn,
  reducedDetail = false,
}: {
  x: number;
  z: number;
  isOn: boolean;
  reducedDetail?: boolean;
}) {
  return (
    <group position={[x, STREET_Y, z]}>
      <mesh position={[0, 0.14, 0]} castShadow={!reducedDetail} receiveShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.28, 10]} />
        <meshStandardMaterial color="#2b2724" roughness={0.52} metalness={0.68} />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow={!reducedDetail}>
        <cylinderGeometry args={[0.04, 0.055, 4.2, 10]} />
        <meshStandardMaterial color="#2b2724" roughness={0.48} metalness={0.76} />
      </mesh>
      <mesh position={[0.38, 4.25, 0]} rotation={[0, 0, -Math.PI * 0.16]} castShadow={!reducedDetail}>
        <cylinderGeometry args={[0.02, 0.028, 0.9, 8]} />
        <meshStandardMaterial color="#2b2724" roughness={0.48} metalness={0.76} />
      </mesh>
      <mesh position={[0.72, 4.18, 0]} castShadow={!reducedDetail}>
        <boxGeometry args={[0.24, 0.42, 0.24]} />
        <meshStandardMaterial color="#2b2724" roughness={0.42} metalness={0.84} />
      </mesh>
      <mesh position={[0.72, 4.12, 0]}>
        <boxGeometry args={[0.16, 0.24, 0.16]} />
        <meshStandardMaterial
          color={isOn ? "#ffe1a0" : "#2f3b44"}
          transparent
          opacity={isOn ? 0.9 : 0.55}
          roughness={0.06}
          metalness={0}
          emissive={new THREE.Color(isOn ? "#ffc85a" : "#000000")}
          emissiveIntensity={isOn ? 1.2 : 0}
        />
      </mesh>
      {isOn && (
        <>
          <pointLight
            position={[0.72, 4.08, 0]}
            color="#ffc85a"
            intensity={26}
            distance={11}
            decay={1.7}
          />
          <spotLight
            position={[0.72, 4.1, 0]}
            angle={0.55}
            penumbra={0.7}
            intensity={24}
            distance={12}
            decay={1.5}
            color="#ffd27a"
            target-position={[0.2, 0.15, 0]}
            castShadow={false}
          />
        </>
      )}
    </group>
  );
}

function ParkedCar({
  x,
  z,
  color,
  reducedDetail = false,
}: {
  x: number;
  z: number;
  color: string;
  reducedDetail?: boolean;
}) {
  return (
    <group position={[x, STREET_Y + 0.7, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow={!reducedDetail} receiveShadow>
        <boxGeometry args={[1.8, 1.4, 4.2]} />
        <meshStandardMaterial color={color} roughness={0.48} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.75, 0.1]} castShadow={!reducedDetail}>
        <boxGeometry args={[1.65, 0.62, 2.1]} />
        <meshStandardMaterial color={color} roughness={0.48} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.72, 0.08]}>
        <boxGeometry args={[1.55, 0.5, 2.05]} />
        <meshStandardMaterial color="#2a3c4a" roughness={0.08} metalness={0.05} transparent opacity={0.82} />
      </mesh>
      {([-0.75, 0.75] as number[]).map((side) =>
        ([-1.3, 1.3] as number[]).map((front) => (
          <mesh key={`${side}-${front}`} position={[side, -0.55, front]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0} />
          </mesh>
        )),
      )}
    </group>
  );
}

function FarSkyline({ facadeZ, fogColor }: { facadeZ: number; fogColor: string }) {
  const rng = createPRNG(77);
  const blocks: ReactElement[] = [];
  const rowZ = facadeZ - 55;
  let x = -120;
  let idx = 0;

  while (x < 120) {
    const w = 5 + rng() * 12;
    const h = 8 + rng() * 30;
    const cx = x + w / 2;
    const color = atmosphericColor("#3a3832", 55, fogColor);
    blocks.push(
      <mesh key={idx} position={[cx, STREET_Y + h / 2, rowZ - rng() * 8]}>
        <boxGeometry args={[w, h, 1]} />
        <meshStandardMaterial color={color} roughness={0.98} metalness={0} />
      </mesh>,
    );
    x += w + 0.2 + rng() * 1;
    idx++;
  }

  return <group>{blocks}</group>;
}

interface EnglishStreetViewProps {
  reducedDetail?: boolean;
}

export default function EnglishStreetView({ reducedDetail = false }: EnglishStreetViewProps) {
  const room = useRoomStore((s) => s.room);
  const sun = useLightingStore((s) => s.sun);
  const fogColor = useMemo(() => getSkyColor(sun.timeOfDay), [sun.timeOfDay]);
  const lampsOn = sun.timeOfDay >= 17 || sun.timeOfDay < 5;

  const facadeZ = -room.length / 2;
  const nearRow = useMemo(
    () => generateOppositeRow(room.width, facadeZ, 13.5, 42),
    [room.width, facadeZ],
  );
  const midRow = useMemo(() => {
    if (reducedDetail) return [];
    return generateOppositeRow(room.width, facadeZ, 29, 77);
  }, [room.width, facadeZ, reducedDetail]);

  const trees = useMemo(() => {
    const rng = createPRNG(13);
    const count = reducedDetail ? 8 : 14;
    const span = Math.max(room.width + 28, 150);
    return Array.from({ length: count }, (_, i) => ({
      x: -span / 2 + i * (span / (count - 1)) + rng() * 0.9 - 0.45,
      z: facadeZ - 10.9,
    }));
  }, [room.width, facadeZ, reducedDetail]);

  const cars = useMemo(() => {
    const rng = createPRNG(29);
    const colors = ["#c84848", "#2844a0", "#e8e0d0", "#1c3020", "#b0b0b0", "#2a2a2a"];
    const count = reducedDetail ? 5 : 10;
    const span = Math.max(room.width + 20, 80);
    return Array.from({ length: count }, (_, i) => ({
      x: -span / 2 + i * (span / (count - 1)) + rng() * 1.2 - 0.6,
      z: facadeZ - 3.6 - (i % 2) * 1.2,
      color: colors[Math.floor(rng() * colors.length)],
    }));
  }, [room.width, facadeZ, reducedDetail]);

  const streetLamps = useMemo(() => {
    const count = reducedDetail ? 4 : 8;
    const span = Math.max(room.width + 24, 90);
    return Array.from({ length: count }, (_, i) => ({
      x: -span / 2 + i * (span / (count - 1)) + (i % 2 === 0 ? 1.8 : -1.8),
      z: facadeZ - 1.05,
    }));
  }, [room.width, facadeZ, reducedDetail]);

  return (
    <group>
      <StreetSurface roomWidth={room.width} facadeZ={facadeZ} />

      {nearRow.map((b, i) => (
        <OppositeBuilding key={`near-${i}`} b={b} fogColor={fogColor} reducedDetail={reducedDetail} />
      ))}
      {midRow.map((b, i) => (
        <OppositeBuilding key={`mid-${i}`} b={b} fogColor={fogColor} reducedDetail={reducedDetail} />
      ))}

      {trees.map((t, i) => (
        <StreetTree key={i} x={t.x} z={t.z} reducedDetail={reducedDetail} />
      ))}

      {streetLamps.map((lamp, i) => (
        <StreetLamp key={i} x={lamp.x} z={lamp.z} isOn={lampsOn} reducedDetail={reducedDetail} />
      ))}

      {cars.map((c, i) => (
        <ParkedCar key={i} x={c.x} z={c.z} color={c.color} reducedDetail={reducedDetail} />
      ))}

      <FarSkyline facadeZ={facadeZ} fogColor={fogColor} />
    </group>
  );
}
