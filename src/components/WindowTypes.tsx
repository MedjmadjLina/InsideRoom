// ============================================
// WindowTypes.tsx — 5 interchangeable window shapes
// Each component renders frame + glass inside
// a rectangular opening (winW × winH).
// Origin is at the center of the opening.
// ============================================

"use client";

import * as THREE from "three";
import { DoubleSide } from "three";
import type { WindowType } from "@/types/window";

// ── Shared props ──────────────────────────────────────────────────────────────

export interface WindowTypeProps {
  winW: number;
  winH: number;
  wallT: number;
  frameColor: string;
  skyColor: string;
  timeOfDay: number;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Glass material props — opacity / color changes with time of day */
function useGlassProps(skyColor: string, timeOfDay: number) {
  const isNight = timeOfDay < 6 || timeOfDay >= 20;
  return {
    color:     isNight ? "#0a0f1e" : skyColor,
    opacity:   isNight ? 0.28 : 0.06,
    roughness: 0.01,
    metalness: 0.0,
    ior:       1.5,
    reflectivity: 0.35,
    transparent: true,
    depthWrite: false,
    side: DoubleSide as THREE.Side,
  };
}

function FrameMat({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.68} metalness={0.06} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SIMPLE — croisillon standard (4 panes)
// ─────────────────────────────────────────────────────────────────────────────
export function SimpleWindow({ winW, winH, wallT, frameColor, skyColor, timeOfDay }: WindowTypeProps) {
  const fT = 0.042;   // frame thickness
  const fD = wallT + 0.04;
  const gZ = -wallT / 2 + 0.008;
  const glass = useGlassProps(skyColor, timeOfDay);

  return (
    <group>
      {/* Outer frame — 4 strips */}
      {/* Top */}
      <mesh position={[0, winH / 2 - fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -winH / 2 + fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      {/* Left */}
      <mesh position={[-winW / 2 + fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      {/* Right */}
      <mesh position={[winW / 2 - fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Cross mullions */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[fT * 0.75, winH - fT * 2, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[winW - fT * 2, fT * 0.75, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Glass — single large pane (mullions are thin) */}
      <mesh position={[0, 0, gZ]}>
        <planeGeometry args={[winW - fT * 2, winH - fT * 2]} />
        <meshPhysicalMaterial {...glass} />
      </mesh>

      {/* Sill ledge */}
      <mesh position={[0, -winH / 2 - 0.04, -wallT * 0.3]} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.06, 0.06, wallT + 0.12]} />
        <meshStandardMaterial color={frameColor} roughness={0.62} metalness={0.04} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BAY — large bay window with angled side panels
// ─────────────────────────────────────────────────────────────────────────────
export function BayWindow({ winW, winH, wallT, frameColor, skyColor, timeOfDay }: WindowTypeProps) {
  const fT  = 0.038;
  const fD  = wallT + 0.05;
  const gZ  = -wallT / 2 + 0.008;
  const glass = useGlassProps(skyColor, timeOfDay);

  // Bay layout: center = 40% of width, each side = 30%
  const sideW = winW * 0.28;
  const centW = winW * 0.44;
  const angle = Math.PI / 6; // 30° outward angle for side panels

  // Top / bottom horizontal frame bars
  return (
    <group>
      {/* ── Top frame bar ── */}
      <mesh position={[0, winH / 2 - fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      {/* Bottom frame bar */}
      <mesh position={[0, -winH / 2 + fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* ── Left frame strip ── */}
      <mesh position={[-winW / 2 + fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      {/* Right frame strip */}
      <mesh position={[winW / 2 - fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* ── Central pane ── */}
      <mesh position={[0, 0, gZ]}>
        <planeGeometry args={[centW - fT * 2, winH - fT * 2]} />
        <meshPhysicalMaterial {...glass} />
      </mesh>

      {/* Central vertical dividers */}
      <mesh position={[-centW / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      <mesh position={[centW / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* ── Left angled side pane ── */}
      <group position={[-(centW / 2 + sideW / 2), 0, 0]} rotation={[0, -angle, 0]}>
        <mesh position={[0, 0, gZ]} castShadow>
          <planeGeometry args={[sideW - fT * 2, winH - fT * 2]} />
          <meshPhysicalMaterial {...glass} />
        </mesh>
      </group>

      {/* ── Right angled side pane ── */}
      <group position={[(centW / 2 + sideW / 2), 0, 0]} rotation={[0, angle, 0]}>
        <mesh position={[0, 0, gZ]}>
          <planeGeometry args={[sideW - fT * 2, winH - fT * 2]} />
          <meshPhysicalMaterial {...glass} />
        </mesh>
      </group>

      {/* Sill ledge */}
      <mesh position={[0, -winH / 2 - 0.04, -wallT * 0.3]} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.08, 0.06, wallT + 0.16]} />
        <meshStandardMaterial color={frameColor} roughness={0.62} metalness={0.04} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DOUBLE VERTICAL — 2 tall narrow windows side by side
// ─────────────────────────────────────────────────────────────────────────────
export function DoubleVerticalWindow({ winW, winH, wallT, frameColor, skyColor, timeOfDay }: WindowTypeProps) {
  const fT  = 0.042;
  const fD  = wallT + 0.04;
  const gZ  = -wallT / 2 + 0.008;
  const glass = useGlassProps(skyColor, timeOfDay);

  const halfW = winW / 2;
  const midT  = 0.06; // central dividing strip

  // Sub-pane width
  const paneW = halfW - midT / 2 - fT;

  return (
    <group>
      {/* Outer frame */}
      <mesh position={[0, winH / 2 - fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      <mesh position={[0, -winH / 2 + fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      <mesh position={[-winW / 2 + fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      <mesh position={[winW / 2 - fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Central divider strip */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[midT, winH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Left pane — tall with slight cross mullion */}
      <mesh position={[-halfW / 2, 0, gZ]}>
        <planeGeometry args={[paneW, winH - fT * 2]} />
        <meshPhysicalMaterial {...glass} />
      </mesh>
      {/* Left horizontal mullion at 60% */}
      <mesh position={[-halfW / 2, winH * 0.12, 0]}>
        <boxGeometry args={[paneW, fT * 0.7, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Right pane */}
      <mesh position={[halfW / 2, 0, gZ]}>
        <planeGeometry args={[paneW, winH - fT * 2]} />
        <meshPhysicalMaterial {...glass} />
      </mesh>
      {/* Right horizontal mullion */}
      <mesh position={[halfW / 2, winH * 0.12, 0]}>
        <boxGeometry args={[paneW, fT * 0.7, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Sill */}
      <mesh position={[0, -winH / 2 - 0.04, -wallT * 0.3]} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.06, 0.06, wallT + 0.12]} />
        <meshStandardMaterial color={frameColor} roughness={0.62} metalness={0.04} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ARCHED — rectangular base + semicircular arch top
// ─────────────────────────────────────────────────────────────────────────────
export function ArchedWindow({ winW, winH, wallT, frameColor, skyColor, timeOfDay }: WindowTypeProps) {
  const fT    = 0.040;
  const fD    = wallT + 0.04;
  const gZ    = -wallT / 2 + 0.008;
  const glass = useGlassProps(skyColor, timeOfDay);

  // Arch occupies the upper portion
  const archR = Math.min(winW / 2 - fT, winH * 0.32);
  const rectH = winH - archR;        // rectangular lower portion height
  const rectBottom = -winH / 2;
  const rectTop    = rectBottom + rectH;   // = archR + rectBottom above the center of the arch

  // Center of arch (top of rect portion)
  const archCY = rectTop;

  return (
    <group>
      {/* ── Rectangular lower frame ── */}
      {/* Left jamb */}
      <mesh position={[-winW / 2 + fT / 2, rectBottom + rectH / 2, 0]} castShadow>
        <boxGeometry args={[fT, rectH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      {/* Right jamb */}
      <mesh position={[winW / 2 - fT / 2, rectBottom + rectH / 2, 0]} castShadow>
        <boxGeometry args={[fT, rectH, fD]} />
        <FrameMat color={frameColor} />
      </mesh>
      {/* Bottom sill */}
      <mesh position={[0, rectBottom + fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Rectangular glass pane */}
      <mesh position={[0, rectBottom + rectH / 2, gZ]}>
        <planeGeometry args={[winW - fT * 2, rectH - fT]} />
        <meshPhysicalMaterial {...glass} />
      </mesh>

      {/* Subtle vertical mullion on rect portion */}
      <mesh position={[0, rectBottom + rectH / 2, 0]}>
        <boxGeometry args={[fT * 0.7, rectH - fT, fD]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* ── Arch frame (torus upper half) ── */}
      <mesh position={[0, archCY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[archR - fT / 2, fT / 2, 8, 32, Math.PI]} />
        <FrameMat color={frameColor} />
      </mesh>

      {/* Arch glass — upper semicircle */}
      <mesh position={[0, archCY, gZ]}>
        {/* CircleGeometry with thetaStart = 0, thetaLength = π → upper half-disc */}
        <circleGeometry args={[archR - fT, 32, 0, Math.PI]} />
        <meshPhysicalMaterial {...glass} />
      </mesh>

      {/* Cap strips connecting arch base to rect frame sides */}
      {([-1, 1] as number[]).map((side) => (
        <mesh key={side} position={[side * (winW / 2 - fT / 2), archCY, 0]} castShadow>
          <boxGeometry args={[fT, fT, fD]} />
          <FrameMat color={frameColor} />
        </mesh>
      ))}

      {/* Sill */}
      <mesh position={[0, rectBottom - 0.04, -wallT * 0.3]} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.06, 0.06, wallT + 0.12]} />
        <meshStandardMaterial color={frameColor} roughness={0.62} metalness={0.04} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LOFT — industrial steel grid (4 cols × 3 rows)
// ─────────────────────────────────────────────────────────────────────────────
export function LoftWindow({ winW, winH, wallT, frameColor, skyColor, timeOfDay }: WindowTypeProps) {
  const steelColor = frameColor === "#e8e2d8" ? "#1c1c1e" : frameColor; // dark steel default
  const fT  = 0.028;   // thin steel frame
  const fD  = wallT + 0.04;
  const gZ  = -wallT / 2 + 0.008;
  const glass = useGlassProps(skyColor, timeOfDay);

  const cols = 4;
  const rows = 3;

  // Grid divider positions
  const colW   = winW / cols;
  const rowH   = winH / rows;

  return (
    <group>
      {/* Outer heavy frame */}
      <mesh position={[0, winH / 2 - fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <meshStandardMaterial color={steelColor} roughness={0.30} metalness={0.70} />
      </mesh>
      <mesh position={[0, -winH / 2 + fT / 2, 0]} castShadow>
        <boxGeometry args={[winW, fT, fD]} />
        <meshStandardMaterial color={steelColor} roughness={0.30} metalness={0.70} />
      </mesh>
      <mesh position={[-winW / 2 + fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <meshStandardMaterial color={steelColor} roughness={0.30} metalness={0.70} />
      </mesh>
      <mesh position={[winW / 2 - fT / 2, 0, 0]} castShadow>
        <boxGeometry args={[fT, winH, fD]} />
        <meshStandardMaterial color={steelColor} roughness={0.30} metalness={0.70} />
      </mesh>

      {/* Vertical grid dividers */}
      {Array.from({ length: cols - 1 }).map((_, i) => {
        const px = -winW / 2 + colW * (i + 1);
        return (
          <mesh key={`v${i}`} position={[px, 0, 0]} castShadow>
            <boxGeometry args={[fT * 0.8, winH - fT * 2, fD]} />
            <meshStandardMaterial color={steelColor} roughness={0.32} metalness={0.72} />
          </mesh>
        );
      })}

      {/* Horizontal grid dividers */}
      {Array.from({ length: rows - 1 }).map((_, i) => {
        const py = -winH / 2 + rowH * (i + 1);
        return (
          <mesh key={`h${i}`} position={[0, py, 0]} castShadow>
            <boxGeometry args={[winW - fT * 2, fT * 0.8, fD]} />
            <meshStandardMaterial color={steelColor} roughness={0.32} metalness={0.72} />
          </mesh>
        );
      })}

      {/* Full glass pane (behind the grid) */}
      <mesh position={[0, 0, gZ - 0.005]}>
        <planeGeometry args={[winW - fT * 2, winH - fT * 2]} />
        <meshPhysicalMaterial {...glass} />
      </mesh>

      {/* Sill */}
      <mesh position={[0, -winH / 2 - 0.035, -wallT * 0.3]} castShadow receiveShadow>
        <boxGeometry args={[winW + 0.04, 0.05, wallT + 0.10]} />
        <meshStandardMaterial color={steelColor} roughness={0.32} metalness={0.72} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

export function WindowTypeRenderer({
  type,
  ...props
}: WindowTypeProps & { type: WindowType }) {
  switch (type) {
    case "simple":          return <SimpleWindow {...props} />;
    case "bay":             return <BayWindow {...props} />;
    case "double-vertical": return <DoubleVerticalWindow {...props} />;
    case "arched":          return <ArchedWindow {...props} />;
    case "loft":            return <LoftWindow {...props} />;
    default:                return <SimpleWindow {...props} />;
  }
}
