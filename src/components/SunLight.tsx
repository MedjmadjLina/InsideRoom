// ============================================
// SunLight.tsx — Dynamic directional sunlight
// Orbits based on time-of-day, casts soft shadows
// ============================================

"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useLightingStore, getSunColor, getSunPosition } from "@/store/lightingStore";
import { useRoomStore } from "@/store/roomStore";
import * as THREE from "three";

interface SunLightProps {
  reducedDetail?: boolean;
}

export default function SunLight({ reducedDetail = false }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));

  const sun = useLightingStore((s) => s.sun);
  const room = useRoomStore((s) => s.room);

  // Derive values from store
  const color = useMemo(() => getSunColor(sun.timeOfDay), [sun.timeOfDay]);
  const position = useMemo(() => getSunPosition(sun.timeOfDay), [sun.timeOfDay]);
  const intensity = sun.intensity;
  const enabled = sun.enabled;
  const shadowMapSize = reducedDetail ? 1024 : 1536;
  const shadowFar = reducedDetail ? 42 : 50;

  // Shadow camera frustum larger than room so frames outside FOV still cast
  const frustum = useMemo(() => {
    const span = Math.max(room.width, room.length) * 0.75 + 2;
    return { left: -span, right: span, top: span, bottom: -span };
  }, [room.width, room.length]);

  // Smoothly update light target every frame
  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.target.position.copy(targetRef.current);
    lightRef.current.target.updateMatrixWorld();
  });

  if (!enabled || intensity <= 0) return null;

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={position}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.00008}
        shadow-normalBias={0.02}
        shadow-camera-near={0.1}
        shadow-camera-far={shadowFar}
        shadow-camera-left={frustum.left}
        shadow-camera-right={frustum.right}
        shadow-camera-top={frustum.top}
        shadow-camera-bottom={frustum.bottom}
      />
    </>
  );
}
