"use client";

import { Text } from "@react-three/drei";
import { useRoomStore } from "@/store/roomStore";

export default function RoomDetector() {
  const rooms = useRoomStore((s) => s.rooms);
  const viewMode = useRoomStore((s) => s.viewMode);

  return (
    <group>
      {rooms.map((room) => {
        const [width, length] = room.size;
        const [x, z] = room.center;
        const fontSize = Math.max(0.18, Math.min(width, length) * 0.12);

        return (
          <group key={room.id}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, z]}>
              <planeGeometry args={[Math.max(0.35, width - 0.12), Math.max(0.35, length - 0.12)]} />
              <meshBasicMaterial color={room.color} transparent opacity={viewMode === "2d" ? 0.34 : 0.14} />
            </mesh>

            <Text
              position={[x, 0.02, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={fontSize}
              color="#6b6258"
              anchorX="center"
              anchorY="middle"
              maxWidth={Math.max(1.4, width - 0.35)}
              textAlign="center"
            >
              {room.label.toUpperCase()}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
