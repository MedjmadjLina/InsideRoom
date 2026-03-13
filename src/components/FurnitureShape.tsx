// ============================================
// FurnitureShape.tsx — detailed furniture geometry
// Pure visual: no interaction logic.
// Each piece is assembled from simple primitives
// scaled to the item's bounding box (w × h × d).
// ============================================

"use client";

import type { FurnitureItem } from "@/types/furniture";
import { useLightingStore } from "@/store/lightingStore";
import * as THREE from "three";

// ── Material preset props ─────────────────────────────────────────────────────

function woodProps(color: string) {
  return { color, roughness: 0.78, metalness: 0.04 };
}
function fabricProps(color: string) {
  return { color, roughness: 0.96, metalness: 0.0 };
}
function metalProps(color: string) {
  return { color, roughness: 0.30, metalness: 0.65 };
}
function plasticProps(color: string) {
  return { color, roughness: 0.62, metalness: 0.02 };
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function lighten(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amt);
  c.g = Math.min(1, c.g + amt);
  c.b = Math.min(1, c.b + amt);
  return `#${c.getHexString()}`;
}
function darken(hex: string, amt: number): string {
  return lighten(hex, -amt);
}

// ── Type detection ────────────────────────────────────────────────────────────

type FType = "bed" | "desk" | "sofa" | "shelf" | "chair"
           | "floor-lamp" | "bedside-lamp" | "desk-lamp" | "pendant-lamp"
           | "default";

function detectType(name: string): FType {
  const n = name.toLowerCase();
  // Lamp types — checked BEFORE generic furniture to avoid false positives
  // e.g. "Bedside Lamp" must not match "bed", "Desk Lamp" must not match "desk"
  if (n.includes("floor lamp") || n.includes("floor light"))            return "floor-lamp";
  if (n.includes("desk lamp")  || n.includes("lampe de bureau"))        return "desk-lamp";
  if (n.includes("bedside")    || n.includes("chevet") || n.includes("table lamp")) return "bedside-lamp";
  if (n.includes("pendant")    || n.includes("hanging") || n.includes("suspension") || n.includes("lustre")) return "pendant-lamp";
  if (n.includes("lampadaire"))                                          return "floor-lamp";
  // Generic furniture
  if (n.includes("bed") || n.includes("lit"))                           return "bed";
  if (n.includes("desk") || n.includes("bureau"))                       return "desk";
  if (n.includes("sofa") || n.includes("couch") || n.includes("canap")) return "sofa";
  if (n.includes("shelf") || n.includes("bookshelf") || n.includes("tag")) return "shelf";
  if (n.includes("chair") || n.includes("chaise"))                      return "chair";
  return "default";
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Scandinavian-style bed: frame + mattress + headboard + pillows */
function BedShape({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  const frameColor  = darken(color, 0.06);
  const mattressCol = lighten(color, 0.28);
  const pillowCol   = "#f5f0e8";
  const legH        = 0.06;
  const frameH      = 0.10;
  const mattH       = Math.max(0.14, h - frameH - legH);
  const headH       = Math.min(0.52, h * 1.1);  // headboard taller than h
  const by          = -h / 2; // floor level

  // Leg positions (4 corners)
  const lx = w / 2 - 0.06;
  const lz = d / 2 - 0.06;

  return (
    <group>
      {/* Frame slab */}
      <mesh position={[0, by + legH + frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, frameH, d]} />
        <meshStandardMaterial {...woodProps(frameColor)} />
      </mesh>

      {/* 4 legs */}
      {([[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]] as [number, number][]).map(([lxv, lzv], i) => (
        <mesh key={i} position={[lxv, by + legH / 2, lzv]} castShadow>
          <boxGeometry args={[0.06, legH, 0.06]} />
          <meshStandardMaterial {...woodProps(darken(frameColor, 0.08))} />
        </mesh>
      ))}

      {/* Mattress */}
      <mesh position={[0, by + legH + frameH + mattH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, mattH, d - 0.06]} />
        <meshStandardMaterial {...fabricProps(mattressCol)} />
      </mesh>

      {/* Headboard */}
      <mesh position={[0, by + headH / 2, -d / 2 + 0.05]} castShadow>
        <boxGeometry args={[w, headH, 0.08]} />
        <meshStandardMaterial {...woodProps(frameColor)} />
      </mesh>

      {/* Pillows × 2 */}
      {([-w * 0.22, w * 0.22] as number[]).map((px, i) => (
        <mesh key={i} position={[px, by + legH + frameH + mattH + 0.04, -d * 0.26]} castShadow>
          <boxGeometry args={[w * 0.36, 0.07, d * 0.18]} />
          <meshStandardMaterial {...fabricProps(pillowCol)} />
        </mesh>
      ))}
    </group>
  );
}

/** Modern desk: thick tabletop + 4 tapered legs */
function DeskShape({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  const topColor = color;
  const legColor = darken(color, 0.12);
  const topH     = Math.min(0.05, h * 0.065);
  const legH     = h - topH;
  const lx       = w / 2 - 0.04;
  const lz       = d / 2 - 0.04;
  const by       = -h / 2;

  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, h / 2 - topH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial {...woodProps(topColor)} />
      </mesh>

      {/* 4 square legs */}
      {([[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]] as [number, number][]).map(([lxv, lzv], i) => (
        <mesh key={i} position={[lxv, by + legH / 2, lzv]} castShadow receiveShadow>
          <boxGeometry args={[0.045, legH, 0.045]} />
          <meshStandardMaterial {...woodProps(legColor)} />
        </mesh>
      ))}
    </group>
  );
}

/** Modern sofa: base + backrest + armrests + seat cushions + legs */
function SofaShape({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  const baseColor      = darken(color, 0.04);
  const cushionColor   = lighten(color, 0.10);
  const backrestColor  = darken(color, 0.02);
  const legColor       = "#2a2218";
  const legH           = 0.07;
  const seatH          = h * 0.42;
  const backH          = h - seatH;
  const armW           = d * 0.18;
  const by             = -h / 2;

  // Leg positions
  const lx = w / 2 - 0.10;
  const lz = d / 2 - 0.08;

  return (
    <group>
      {/* 4 short legs */}
      {([[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]] as [number, number][]).map(([lxv, lzv], i) => (
        <mesh key={i} position={[lxv, by + legH / 2, lzv]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, legH, 6]} />
          <meshStandardMaterial {...metalProps(legColor)} />
        </mesh>
      ))}

      {/* Seat base */}
      <mesh position={[0, by + legH + seatH / 2, d * 0.05]} castShadow receiveShadow>
        <boxGeometry args={[w, seatH, d * 0.78]} />
        <meshStandardMaterial {...fabricProps(baseColor)} />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, by + legH + seatH + backH / 2, -d / 2 + d * 0.12]} castShadow receiveShadow>
        <boxGeometry args={[w, backH, d * 0.24]} />
        <meshStandardMaterial {...fabricProps(backrestColor)} />
      </mesh>

      {/* Armrests × 2 */}
      {([-1, 1] as number[]).map((side, i) => (
        <mesh key={i} position={[side * (w / 2 - armW / 2), by + legH + seatH * 0.75, -d * 0.02]} castShadow>
          <boxGeometry args={[armW, seatH * 1.3, d * 0.78]} />
          <meshStandardMaterial {...fabricProps(baseColor)} />
        </mesh>
      ))}

      {/* Seat cushions (3 pads) */}
      {([-w * 0.27, 0, w * 0.27] as number[]).map((px, i) => (
        <mesh key={i} position={[px, by + legH + seatH + 0.055, d * 0.1]} castShadow>
          <boxGeometry args={[(w - armW * 2) * 0.31, 0.11, d * 0.6]} />
          <meshStandardMaterial {...fabricProps(cushionColor)} />
        </mesh>
      ))}
    </group>
  );
}

/** Bookshelf: 2 vertical sides + back panel + 4 shelves */
function ShelfShape({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  const boardColor   = color;
  const backColor    = darken(color, 0.10);
  const thickness    = Math.min(0.025, d * 0.08);
  const shelves      = 4;
  const innerH       = h - thickness * 2;  // inside height
  const gap          = innerH / (shelves + 1);

  return (
    <group>
      {/* Left side */}
      <mesh position={[-w / 2 + thickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, h, d]} />
        <meshStandardMaterial {...woodProps(boardColor)} />
      </mesh>

      {/* Right side */}
      <mesh position={[w / 2 - thickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[thickness, h, d]} />
        <meshStandardMaterial {...woodProps(boardColor)} />
      </mesh>

      {/* Back panel */}
      <mesh position={[0, 0, d / 2 - thickness / 2]} receiveShadow>
        <boxGeometry args={[w - thickness * 2, h, thickness]} />
        <meshStandardMaterial {...woodProps(backColor)} />
      </mesh>

      {/* Top + bottom boards */}
      {([h / 2 - thickness / 2, -h / 2 + thickness / 2] as number[]).map((py, i) => (
        <mesh key={i} position={[0, py, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, thickness, d]} />
          <meshStandardMaterial {...woodProps(boardColor)} />
        </mesh>
      ))}

      {/* Intermediate shelves */}
      {Array.from({ length: shelves }).map((_, i) => {
        const py = -h / 2 + thickness + gap * (i + 1);
        return (
          <mesh key={i} position={[0, py, 0]} castShadow receiveShadow>
            <boxGeometry args={[w - thickness * 2, thickness, d - thickness]} />
            <meshStandardMaterial {...woodProps(lighten(boardColor, 0.05))} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Chair: seat + backrest + 4 legs */
function ChairShape({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  const seatColor = color;
  const legColor  = darken(color, 0.15);
  const seatY     = h * 0.5;   // seat at ~50% of h from floor
  const seatH     = h * 0.07;
  const backH     = h - seatY;
  const legH      = seatY - seatH;
  const lx        = w / 2 - 0.04;
  const lz        = d / 2 - 0.04;
  const by        = -h / 2;

  return (
    <group>
      {/* 4 legs */}
      {([[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]] as [number, number][]).map(([lxv, lzv], i) => (
        <mesh key={i} position={[lxv, by + legH / 2, lzv]} castShadow>
          <cylinderGeometry args={[0.016, 0.020, legH, 6]} />
          <meshStandardMaterial {...plasticProps(legColor)} />
        </mesh>
      ))}

      {/* Seat */}
      <mesh position={[0, by + legH + seatH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatH, d]} />
        <meshStandardMaterial {...fabricProps(seatColor)} />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, by + legH + seatH + backH / 2, -d / 2 + 0.04]} castShadow>
        <boxGeometry args={[w - 0.04, backH, 0.06]} />
        <meshStandardMaterial {...fabricProps(darken(seatColor, 0.04))} />
      </mesh>
    </group>
  );
}

/** Fallback: refined box */
function DefaultShape({ w, h, d, color }: { w: number; h: number; d: number; color: string }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial {...plasticProps(color)} />
    </mesh>
  );
}

// ── Lamp helpers ──────────────────────────────────────────────────────────────

/** Derive warm point-light intensity from ambient level */
function useLampIntensity(base: number): number {
  const ambient = useLightingStore((s) => s.ambient.intensity);
  // Brighter at night (ambient low), dimmer in daylight
  const factor = Math.max(0.3, 2.0 - ambient * 2.5);
  return base * factor;
}

const BRASS   = "#b8943f";
const STEEL   = "#8a8a8a";
const CORD    = "#2a2520";

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR LAMP — base + pole + shade, warm pointLight at shade
// ─────────────────────────────────────────────────────────────────────────────
function FloorLampShape({ h, color }: { w: number; h: number; d: number; color: string }) {
  const intensity  = useLampIntensity(22);
  const poleColor  = darken(color, 0.12);
  const shadeColor = lighten(color, 0.14);
  const shadeH     = Math.min(0.22, h * 0.14);
  const poleH      = h - shadeH - 0.08;
  const by         = -h / 2; // floor level

  return (
    <group>
      {/* Weighted base disc */}
      <mesh position={[0, by + 0.028, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.055, 24]} />
        <meshStandardMaterial color={poleColor} roughness={0.45} metalness={0.72} />
      </mesh>

      {/* Pole */}
      <mesh position={[0, by + 0.055 + poleH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.016, poleH, 12]} />
        <meshStandardMaterial color={poleColor} roughness={0.38} metalness={0.78} />
      </mesh>

      {/* Harp ring under shade */}
      <mesh position={[0, by + 0.055 + poleH + 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.007, 6, 18]} />
        <meshStandardMaterial color={BRASS} roughness={0.32} metalness={0.85} />
      </mesh>

      {/* Shade — open-bottom cone */}
      <mesh position={[0, by + 0.055 + poleH + shadeH / 2 + 0.018, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.10, shadeH, 24, 1, true]} />
        <meshStandardMaterial
          color={shadeColor}
          roughness={0.82}
          metalness={0.0}
          side={THREE.DoubleSide}
          emissive={new THREE.Color(shadeColor)}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, by + 0.055 + poleH + shadeH + 0.038, 0]}>
        <cylinderGeometry args={[0.04, 0.10, 0.022, 16]} />
        <meshStandardMaterial color={BRASS} roughness={0.30} metalness={0.85} />
      </mesh>

      {/* Warm point light */}
      <pointLight
        position={[0, by + 0.055 + poleH + 0.08, 0]}
        color="#ffd484"
        intensity={intensity}
        distance={6}
        decay={1.8}
        castShadow={false}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BEDSIDE LAMP — compact base + drum shade + warm glow
// ─────────────────────────────────────────────────────────────────────────────
function BedsideLampShape({ h, color }: { w: number; h: number; d: number; color: string }) {
  const intensity  = useLampIntensity(14);
  const baseColor  = darken(color, 0.15);
  const shadeColor = lighten(color, 0.20);
  const baseH = h * 0.30;
  const shadeH = h * 0.45;
  const by = -h / 2;

  return (
    <group>
      {/* Base */}
      <mesh position={[0, by + baseH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.065, baseH, 16]} />
        <meshStandardMaterial color={baseColor} roughness={0.40} metalness={0.68} />
      </mesh>

      {/* Short neck */}
      <mesh position={[0, by + baseH + 0.022, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.045, 10]} />
        <meshStandardMaterial color={BRASS} roughness={0.32} metalness={0.85} />
      </mesh>

      {/* Drum shade */}
      <mesh position={[0, by + baseH + 0.045 + shadeH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.095, 0.078, shadeH, 20, 1, true]} />
        <meshStandardMaterial
          color={shadeColor} roughness={0.88} metalness={0} side={THREE.DoubleSide}
          emissive={new THREE.Color(shadeColor)} emissiveIntensity={0.35}
        />
      </mesh>

      {/* Top ring */}
      <mesh position={[0, by + baseH + 0.045 + shadeH + 0.008, 0]}>
        <cylinderGeometry args={[0.030, 0.078, 0.012, 16]} />
        <meshStandardMaterial color={BRASS} roughness={0.30} metalness={0.86} />
      </mesh>

      {/* Warm light */}
      <pointLight
        position={[0, by + baseH + 0.045 + shadeH * 0.5, 0]}
        color="#ffd07a"
        intensity={intensity}
        distance={4}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DESK LAMP — heavy base + jointed arm + angled shade
// ─────────────────────────────────────────────────────────────────────────────
function DeskLampShape({ h, color }: { w: number; h: number; d: number; color: string }) {
  const intensity  = useLampIntensity(16);
  const bodyColor  = darken(color, 0.06);
  const baseH      = h * 0.10;
  const arm1H      = h * 0.48;
  const arm2H      = h * 0.38;
  const shadeR     = 0.075;
  const by         = -h / 2;

  // Arm1: straight up from base
  const arm1TopY = by + baseH + arm1H;
  // Arm2: slightly angled forward (−Z)
  const arm2Angle = -Math.PI * 0.18; // ~32° from vertical
  const arm2DY    = Math.cos(arm2Angle) * arm2H;
  const arm2DZ    = Math.sin(arm2Angle) * arm2H;
  const shadeY    = arm1TopY + arm2DY;
  const shadeZ    = arm2DZ;

  return (
    <group>
      {/* Base plate */}
      <mesh position={[0, by + 0.014, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.10, 0.028, 20]} />
        <meshStandardMaterial {...metalProps(bodyColor)} />
      </mesh>

      {/* Arm1 — vertical */}
      <mesh position={[0, by + baseH + arm1H / 2, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.010, arm1H, 8]} />
        <meshStandardMaterial {...metalProps(bodyColor)} />
      </mesh>

      {/* Elbow joint */}
      <mesh position={[0, arm1TopY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.018, 0.007, 6, 12, Math.PI]} />
        <meshStandardMaterial color={BRASS} roughness={0.28} metalness={0.88} />
      </mesh>

      {/* Arm2 — angled */}
      <mesh
        position={[0, arm1TopY + arm2DY / 2, arm2DZ / 2]}
        rotation={[arm2Angle, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.007, 0.009, arm2H, 8]} />
        <meshStandardMaterial {...metalProps(bodyColor)} />
      </mesh>

      {/* Shade — open cone pointing slightly forward */}
      <group position={[0, shadeY, shadeZ]} rotation={[arm2Angle + Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <coneGeometry args={[shadeR, shadeR * 1.1, 16, 1, true]} />
          <meshStandardMaterial
            color={bodyColor} roughness={0.55} metalness={0.25}
            side={THREE.DoubleSide}
            emissive={new THREE.Color("#fff8e8")} emissiveIntensity={0.12}
          />
        </mesh>
      </group>

      {/* Point light at shade */}
      <pointLight
        position={[0, shadeY - 0.04, shadeZ + 0.04]}
        color="#ffe8a0"
        intensity={intensity}
        distance={3.5}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDANT LAMP — cord from ceiling-top of bbox + suspended fixture
// Item should be placed at y = roomHeight/2 so top of bbox ≈ ceiling
// ─────────────────────────────────────────────────────────────────────────────
function PendantLampShape({ h, color }: { w: number; h: number; d: number; color: string }) {
  const intensity  = useLampIntensity(28);
  const ceilTop    = h / 2;          // top of bounding box = near ceiling
  const cordLen    = h * 0.42;
  const bulbY      = ceilTop - cordLen;

  return (
    <group>
      {/* Ceiling canopy disc */}
      <mesh position={[0, ceilTop - 0.022, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.036, 16]} />
        <meshStandardMaterial color="#e7dfd4" roughness={0.62} metalness={0.08} />
      </mesh>

      {/* Cord */}
      <mesh position={[0, ceilTop - 0.044 - cordLen / 2, 0]}>
        <cylinderGeometry args={[0.004, 0.004, cordLen, 6]} />
        <meshStandardMaterial color={CORD} roughness={0.88} metalness={0} />
      </mesh>

      {/* Small socket */}
      <mesh position={[0, bulbY + 0.04, 0]}>
        <cylinderGeometry args={[0.022, 0.024, 0.05, 14]} />
        <meshStandardMaterial color={BRASS} roughness={0.28} metalness={0.88} />
      </mesh>

      {/* Bare bulb */}
      <mesh position={[0, bulbY, 0]}>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial
          color="#fff4cf"
          emissive={new THREE.Color("#fff1c2")}
          emissiveIntensity={intensity > 8 ? 4.2 : 1.8}
          roughness={0.08}
          metalness={0}
        />
      </mesh>

      {/* Warm light */}
      <pointLight
        position={[0, bulbY - 0.02, 0]}
        color="#ffd06a"
        intensity={intensity}
        distance={8}
        decay={1.6}
        castShadow={false}
      />
    </group>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface FurnitureShapeProps {
  item: FurnitureItem;
  isSelected: boolean;
}

export default function FurnitureShape({ item }: FurnitureShapeProps) {
  const { width: w, height: h, depth: d, color, name } = item;
  const type = detectType(name);

  switch (type) {
    case "bed":           return <BedShape          w={w} h={h} d={d} color={color} />;
    case "desk":          return <DeskShape         w={w} h={h} d={d} color={color} />;
    case "sofa":          return <SofaShape         w={w} h={h} d={d} color={color} />;
    case "shelf":         return <ShelfShape        w={w} h={h} d={d} color={color} />;
    case "chair":         return <ChairShape        w={w} h={h} d={d} color={color} />;
    case "floor-lamp":    return <FloorLampShape    w={w} h={h} d={d} color={color} />;
    case "bedside-lamp":  return <BedsideLampShape  w={w} h={h} d={d} color={color} />;
    case "desk-lamp":     return <DeskLampShape     w={w} h={h} d={d} color={color} />;
    case "pendant-lamp":  return <PendantLampShape  w={w} h={h} d={d} color={color} />;
    default:              return <DefaultShape      w={w} h={h} d={d} color={color} />;
  }
}
