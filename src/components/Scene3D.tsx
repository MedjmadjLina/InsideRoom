// ============================================
// Scene3D.tsx — main canvas wrapper
// Premium lighting, refined grid, warm tones.
// Handles 3D ↔ 2D camera switching.
// ============================================

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useEffect, useRef, useMemo } from "react";
import { DUPLEX_LEVEL_HEIGHT } from "@/lib/apartmentLayout";
import { useRoomStore } from "@/store/roomStore";
import { useLightingStore, getSkyColor, getSunColor, getSceneBackground } from "@/store/lightingStore";
import Room from "./Room";
import Furniture from "./Furniture";
import SunLight from "./SunLight";
import RoomLights from "./RoomLights";
import BuildingShell from "./BuildingShell";
import EnglishStreetView from "./EnglishStreetView";
import * as THREE from "three";

/** Inner scene content (must be inside <Canvas>) */
function SceneContent() {
  const apartmentType = useRoomStore((s) => s.apartmentType);
  const activeLevel = useRoomStore((s) => s.activeLevel);
  const furniture = useRoomStore((s) => s.furniture);
  const walls = useRoomStore((s) => s.walls);
  const viewMode = useRoomStore((s) => s.viewMode);
  const room = useRoomStore((s) => s.room);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraReady = useRef(false);

  const sun = useLightingStore((s) => s.sun);
  const ambient = useLightingStore((s) => s.ambient);
  const skyColor = useMemo(() => getSkyColor(sun.timeOfDay), [sun.timeOfDay]);
  const sunColorHex = useMemo(() => getSunColor(sun.timeOfDay), [sun.timeOfDay]);
  const fogColor = useMemo(() => {
    const sky = new THREE.Color(skyColor);
    const sunTint = new THREE.Color(sunColorHex);
    const lifted = sky.clone().lerp(new THREE.Color("#fff1d6"), 0.22);

    if (sun.timeOfDay >= 7 && sun.timeOfDay < 18) {
      return `#${lifted.lerp(sunTint, 0.18).getHexString()}`;
    }
    if (sun.timeOfDay >= 18 && sun.timeOfDay < 20) {
      return `#${lifted.lerp(sunTint, 0.28).getHexString()}`;
    }
    return `#${lifted.getHexString()}`;
  }, [skyColor, sunColorHex, sun.timeOfDay]);
  const groundColor = useMemo(() => {
    const t = sun.timeOfDay;
    if (t < 5 || t >= 20) return "#0a0a14";
    if (t < 7 || t >= 19) return "#403028";
    return "#d2bda4";
  }, [sun.timeOfDay]);

  const fogNear = useMemo(() => {
    const t = sun.timeOfDay;
    return (t >= 7 && t < 18) ? 10 : 7;
  }, [sun.timeOfDay]);
  const fogFar = useMemo(() => {
    const t = sun.timeOfDay;
    return (t >= 7 && t < 18) ? 72 : 46;
  }, [sun.timeOfDay]);
  const reducedDetail = useMemo(() => {
    const footprintWeight = Math.round((room.width * room.length) / 10);
    const sceneComplexity = furniture.length + walls.length + footprintWeight + (apartmentType === "duplex" ? 6 : 0);
    return viewMode === "3d" && sceneComplexity >= 20;
  }, [apartmentType, furniture.length, room.length, room.width, viewMode, walls.length]);

  useEffect(() => {
    cameraReady.current = false;
  }, [viewMode, room, reducedDetail]);

  useFrame(() => {
    if (cameraReady.current || !controlsRef.current) return;
    cameraReady.current = true;
    const controls = controlsRef.current;
    if (viewMode === "2d") {
      const topY = Math.max(room.width, room.length) * 1.4;
      const targetY = apartmentType === "duplex" && activeLevel === 1 ? DUPLEX_LEVEL_HEIGHT : 0;
      controls.object.position.set(0, topY, 0.01);
      controls.target.set(0, targetY, 0);
      controls.update();
    } else {
      if (apartmentType === "duplex") {
        controls.object.position.set(
          room.width * 0.78,
          room.height * 0.92,
          -room.length * 1.18,
        );
        controls.target.set(room.width * 0.12, room.height * 0.46, room.length * 0.02);
      } else {
        controls.object.position.set(
          room.width * 0.65,
          room.height * 1.4,
          -room.length * 1.9
        );
        controls.target.set(0, room.height * 0.48, -room.length * 0.55);
      }
      controls.update();
    }
  });

  return (
    <>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      <ambientLight intensity={ambient.intensity * 0.62} color={fogColor} />
      <hemisphereLight args={[fogColor, groundColor, 0.28 + ambient.intensity * 0.16]} />
      <SunLight reducedDetail={reducedDetail} />

      {sun.enabled && sun.timeOfDay >= 6 && sun.timeOfDay < 20 && (
        <directionalLight
          position={[0, room.height * 0.8, -room.length * 0.5 - 0.5]}
          intensity={Math.max(0, ambient.intensity * 0.42 * Math.sin(Math.PI * (sun.timeOfDay - 6) / 14))}
          color={fogColor}
          castShadow={false}
        />
      )}

      {sun.enabled && sun.timeOfDay >= 7 && sun.timeOfDay < 18.5 && (
        <directionalLight
          position={[room.width * 0.35, room.height * 2.2, -room.length * 1.8]}
          intensity={Math.max(0.4, sun.intensity * 0.55)}
          color={sunColorHex}
          castShadow={false}
        />
      )}

      <RoomLights />
      <pointLight position={[0, 3, 0]} intensity={0.04} color="#fef5ec" distance={12} decay={2} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate={viewMode === "3d"}
        maxPolarAngle={viewMode === "2d" ? 0 : Math.PI / 2.05}
        minDistance={0.8}
        maxDistance={80}
        enableDamping
        dampingFactor={0.07}
        zoomSpeed={1.1}
      />

      {viewMode === "2d" ? (
        <group>
          <Grid
            args={[room.width, room.length]}
            position={[0, apartmentType === "duplex" && activeLevel === 1 ? DUPLEX_LEVEL_HEIGHT + 0.006 : 0.006, 0]}
            cellSize={0.5}
            cellColor="#cdc8c2"
            sectionSize={1}
            sectionColor="#b5afa8"
            cellThickness={0.5}
            sectionThickness={0.9}
            fadeDistance={25}
            fadeStrength={1.5}
            infiniteGrid={false}
          />
          <Grid
            args={[room.width, room.length]}
            position={[0, apartmentType === "duplex" && activeLevel === 1 ? DUPLEX_LEVEL_HEIGHT + 0.004 : 0.004, 0]}
            cellSize={0.1}
            cellColor="#ddd8d3"
            sectionSize={0.5}
            sectionColor="#d5d0ca"
            cellThickness={0.25}
            sectionThickness={0.35}
            fadeDistance={8}
            fadeStrength={3}
            infiniteGrid={false}
          />
        </group>
      ) : (
        <Grid
          args={[room.width, room.length]}
          position={[0, 0.003, 0]}
          cellSize={1}
          cellColor="#dbd6cf"
          sectionSize={1}
          sectionColor="#dbd6cf"
          cellThickness={0.3}
          sectionThickness={0.3}
          fadeDistance={15}
          fadeStrength={4}
          infiniteGrid={false}
        />
      )}

      {viewMode === "3d" && (
        <>
          <BuildingShell />
          <EnglishStreetView reducedDetail={reducedDetail} />
        </>
      )}

      <Room />

      {furniture
        .filter((item) => viewMode !== "2d" || apartmentType !== "duplex" || (item.level ?? 0) === activeLevel || item.name.toLowerCase().includes("stair"))
        .map((item) => (
        <Furniture key={item.id} item={item} />
      ))}

      {viewMode === "3d" && (
        <ContactShadows
          position={[0, 0.002, 0]}
          width={room.width}
          height={room.length}
          far={room.height + 1}
          opacity={reducedDetail
            ? Math.max(0.14, Math.min(0.34, 0.18 + ambient.intensity * 0.38))
            : Math.max(0.20, Math.min(0.50, 0.22 + ambient.intensity * 0.55))}
          blur={reducedDetail ? 1.6 : 2.2}
          resolution={reducedDetail ? 384 : 768}
          color="#1a1510"
        />
      )}
    </>
  );
}

export default function Scene3D() {
  const viewMode = useRoomStore((s) => s.viewMode);
  const selectFurniture = useRoomStore((s) => s.selectFurniture);
  const selectWall = useRoomStore((s) => s.selectWall);
  const room = useRoomStore((s) => s.room);
  const furnitureCount = useRoomStore((s) => s.furniture.length);
  const wallCount = useRoomStore((s) => s.walls.length);
  const apartmentType = useRoomStore((s) => s.apartmentType);
  const sunTime = useLightingStore((s) => s.sun.timeOfDay);
  const bg = useMemo(() => getSceneBackground(sunTime), [sunTime]);
  const reducedDetail = useMemo(() => {
    const footprintWeight = Math.round((room.width * room.length) / 10);
    const sceneComplexity = furnitureCount + wallCount + footprintWeight + (apartmentType === "duplex" ? 6 : 0);
    return viewMode === "3d" && sceneComplexity >= 20;
  }, [apartmentType, furnitureCount, room.length, room.width, viewMode, wallCount]);

  return (
    <Canvas
      dpr={viewMode === "2d" ? [1, 1.15] : reducedDetail ? [1, 1.35] : [1, 1.7]}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{
        fov: 48,
        near: 0.1,
        far: 400,
        position: [room.width * 0.8, room.height * 1.2, -room.length * 2],
      }}
      onPointerMissed={() => {
        selectFurniture(null);
        selectWall(null);
      }}
      style={{
        background: viewMode === "2d"
          ? "linear-gradient(180deg, #f7f5f2 0%, #efecea 100%)"
          : `linear-gradient(180deg, ${bg[0]} 0%, ${bg[1]} 100%)`,
      }}
    >
      <SceneContent />
    </Canvas>
  );
}
