"use client";

import { DoubleSide } from "three";
import { useMemo } from "react";
import { useRoomStore } from "@/store/roomStore";
import Wall from "./Wall";
import RoomDetector from "./RoomDetector";
import WindowWall from "./WindowWall";

function DuplexMezzanine() {
  const rooms = useRoomStore((s) => s.rooms);
  const mezzanine = rooms.find((room) => room.kind === "mezzanine");

  if (!mezzanine) {
    return null;
  }

  const [width, depth] = mezzanine.size;
  const [centerX, centerZ] = mezzanine.center;
  const deckHeight = 2.42;
  const slabThickness = 0.12;
  const stairVoid = 1.18;
  const mainWidth = Math.max(1.2, width - stairVoid);
  const mainCenterX = centerX + stairVoid / 2;
  const landingWidth = Math.min(1.2, width * 0.32);
  const landingDepth = Math.min(1.45, depth * 0.42);
  const landingX = centerX - width / 2 + landingWidth / 2;
  const landingZ = centerZ + depth / 2 - landingDepth / 2;
  const railHeight = 0.92;

  return (
    <group>
      <mesh position={[mainCenterX, deckHeight, centerZ]} castShadow receiveShadow>
        <boxGeometry args={[mainWidth, slabThickness, depth]} />
        <meshStandardMaterial color="#d7c2a8" roughness={0.74} metalness={0.04} />
      </mesh>

      <mesh position={[landingX, deckHeight, landingZ]} castShadow receiveShadow>
        <boxGeometry args={[landingWidth, slabThickness, landingDepth]} />
        <meshStandardMaterial color="#d7c2a8" roughness={0.74} metalness={0.04} />
      </mesh>

      <mesh position={[mainCenterX, deckHeight - slabThickness / 2 - 0.1, centerZ]} receiveShadow>
        <boxGeometry args={[mainWidth - 0.08, 0.08, depth - 0.08]} />
        <meshStandardMaterial color="#8d6d52" roughness={0.88} metalness={0.02} />
      </mesh>

      <mesh position={[centerX + width / 2 - 0.05, deckHeight + railHeight / 2, centerZ]} castShadow>
        <boxGeometry args={[0.05, railHeight, depth - 0.1]} />
        <meshStandardMaterial color="#4a392d" roughness={0.38} metalness={0.32} />
      </mesh>
      <mesh position={[centerX + width / 2 - 0.05, deckHeight + railHeight, centerZ]} castShadow>
        <boxGeometry args={[0.05, 0.04, depth - 0.1]} />
        <meshStandardMaterial color="#4a392d" roughness={0.38} metalness={0.32} />
      </mesh>

      <mesh position={[centerX + width / 2 - 0.34, deckHeight + railHeight / 2, centerZ - depth / 2 + 0.55]} castShadow>
        <boxGeometry args={[0.62, railHeight, 0.05]} />
        <meshStandardMaterial color="#4a392d" roughness={0.38} metalness={0.32} />
      </mesh>
      <mesh position={[centerX + width / 2 - 0.34, deckHeight + railHeight, centerZ - depth / 2 + 0.55]} castShadow>
        <boxGeometry args={[0.62, 0.04, 0.05]} />
        <meshStandardMaterial color="#4a392d" roughness={0.38} metalness={0.32} />
      </mesh>
    </group>
  );
}

export default function PartitionSystem() {
  const apartmentType = useRoomStore((s) => s.apartmentType);
  const activeLevel = useRoomStore((s) => s.activeLevel);
  const room = useRoomStore((s) => s.room);
  const viewMode = useRoomStore((s) => s.viewMode);
  const walls = useRoomStore((s) => s.walls);
  const visibleWalls = useMemo(
    () =>
      walls.filter((wall) => {
        if (viewMode === "2d" && apartmentType === "duplex" && (wall.level ?? 0) !== activeLevel) {
          return false;
        }
        const isFrontExterior =
          wall.kind === "exterior" &&
          wall.rotation === 0 &&
          Math.abs(wall.position[2] - (-room.length / 2 + wall.thickness / 2)) < 0.02;
        return !isFrontExterior;
      }),
    [activeLevel, apartmentType, room.length, viewMode, walls],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, apartmentType === "duplex" && activeLevel === 1 ? 2.421 : 0, 0]} receiveShadow>
        <planeGeometry args={[room.width, room.length]} />
        <meshStandardMaterial
          color="#e2d9cd"
          roughness={0.84}
          metalness={0.01}
          side={DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, apartmentType === "duplex" && activeLevel === 1 ? 2.422 : 0.001, 0]} receiveShadow>
        <planeGeometry args={[room.width + 0.08, room.length + 0.08]} />
        <meshStandardMaterial
          color="#d5cec4"
          roughness={1}
          metalness={0}
          side={DoubleSide}
          transparent
          opacity={0.22}
        />
      </mesh>

      <RoomDetector />
      <WindowWall width={room.width} height={room.height} wallT={0.22} posZ={-room.length / 2 + 0.11} />
      {apartmentType === "duplex" && (viewMode === "3d" || activeLevel === 1) && <DuplexMezzanine />}

      {visibleWalls.map((wall) => (
        <Wall key={wall.id} wall={wall} />
      ))}
    </group>
  );
}
