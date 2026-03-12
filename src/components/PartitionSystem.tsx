"use client";

import { DoubleSide } from "three";
import { useMemo } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useWindowStore } from "@/store/windowStore";
import Wall from "./Wall";
import RoomDetector from "./RoomDetector";

function WindowRibbon() {
  const room = useRoomStore((s) => s.room);
  const config = useWindowStore((s) => s.config);

  const width = useMemo(() => Math.max(1.1, room.width * config.widthFraction * 0.55), [config.widthFraction, room.width]);
  const centerY = config.sillHeight + config.height / 2;
  const wallZ = -room.length / 2 + 0.015;

  return (
    <group position={[0, centerY, wallZ]}>
      <mesh>
        <boxGeometry args={[width + 0.18, config.height + 0.18, 0.06]} />
        <meshStandardMaterial color="#d8d0c4" roughness={0.74} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[width, config.height, 0.02]} />
        <meshStandardMaterial
          color="#bfd5e4"
          roughness={0.05}
          metalness={0.04}
          transparent
          opacity={0.48}
        />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.03, config.height, 0.05]} />
        <meshStandardMaterial color={config.frameColor} roughness={0.42} metalness={0.14} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[width + 0.06, 0.03, 0.05]} />
        <meshStandardMaterial color={config.frameColor} roughness={0.42} metalness={0.14} />
      </mesh>
    </group>
  );
}

export default function PartitionSystem() {
  const room = useRoomStore((s) => s.room);
  const walls = useRoomStore((s) => s.walls);

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
      <WindowRibbon />

      {walls.map((wall) => (
        <Wall key={wall.id} wall={wall} />
      ))}
    </group>
  );
}
