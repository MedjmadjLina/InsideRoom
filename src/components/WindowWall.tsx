// ============================================
// WindowWall.tsx — back wall with modular window
// Wall segments are computed from WindowConfig.
// The window type geometry is pluggable.
// ============================================

"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { useLightingStore, getSkyColor } from "@/store/lightingStore";
import { useWindowStore } from "@/store/windowStore";
import { WindowTypeRenderer } from "./WindowTypes";

const WALL_COLOR = "#f4efe9";

interface WindowWallProps {
  width: number;
  height: number;
  wallT: number;
  posZ: number;
}

function WallSeg({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={WALL_COLOR}
        roughness={0.92}
        metalness={0}
        side={DoubleSide}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}

export default function WindowWall({ width, height, wallT, posZ }: WindowWallProps) {
  const config   = useWindowStore((s) => s.config);
  const sun      = useLightingStore((s) => s.sun);
  const skyColor = useMemo(() => getSkyColor(sun.timeOfDay), [sun.timeOfDay]);

  // ── Opening geometry from config ─────────────────────────────────────────
  const winW    = width * config.widthFraction;
  const winH    = Math.min(config.height, height - config.sillHeight - 0.05);
  const sillH   = config.sillHeight;
  const headerH = Math.max(0.04, height - sillH - winH);
  const offsetX = Math.max(
    -(width / 2 - winW / 2 - 0.05),
    Math.min(width / 2 - winW / 2 - 0.05, config.offsetX),
  );
  const leftJambW  = Math.max(0.02, width / 2 + offsetX - winW / 2);
  const rightJambW = Math.max(0.02, width / 2 - offsetX - winW / 2);
  const winCY      = sillH + winH / 2;

  return (
    <group position={[0, 0, posZ]}>
      {/* Bottom sill band */}
      <WallSeg position={[0, sillH / 2, 0]} size={[width, sillH, wallT]} />

      {/* Top header band */}
      <WallSeg position={[0, height - headerH / 2, 0]} size={[width, headerH, wallT]} />

      {/* Left jamb */}
      {leftJambW > 0.01 && (
        <WallSeg
          position={[offsetX - winW / 2 - leftJambW / 2, winCY, 0]}
          size={[leftJambW, winH, wallT]}
        />
      )}

      {/* Right jamb */}
      {rightJambW > 0.01 && (
        <WallSeg
          position={[offsetX + winW / 2 + rightJambW / 2, winCY, 0]}
          size={[rightJambW, winH, wallT]}
        />
      )}

      {/* Window unit */}
      <group position={[offsetX, winCY, 0]}>
        <WindowTypeRenderer
          type={config.type}
          winW={winW}
          winH={winH}
          wallT={wallT}
          frameColor={config.frameColor}
          skyColor={skyColor}
          timeOfDay={sun.timeOfDay}
        />
      </group>
    </group>
  );
}
