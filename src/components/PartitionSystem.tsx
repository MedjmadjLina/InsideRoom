"use client";

import { DoubleSide } from "three";
import { useMemo } from "react";
import { useRoomStore } from "@/store/roomStore";
import Wall from "./Wall";
import RoomDetector from "./RoomDetector";
import WindowWall from "./WindowWall";

export default function PartitionSystem() {
  const room = useRoomStore((s) => s.room);
  const walls = useRoomStore((s) => s.walls);
  const visibleWalls = useMemo(
    () =>
      walls.filter((wall) => {
        const isFrontExterior =
          wall.kind === "exterior" &&
          wall.rotation === 0 &&
          Math.abs(wall.position[2] - (-room.length / 2 + wall.thickness / 2)) < 0.02;
        return !isFrontExterior;
      }),
    [room.length, walls],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[room.width, room.length]} />
        <meshStandardMaterial
          color="#e2d9cd"
          roughness={0.84}
          metalness={0.01}
          side={DoubleSide}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
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

      {visibleWalls.map((wall) => (
        <Wall key={wall.id} wall={wall} />
      ))}
    </group>
  );
}
