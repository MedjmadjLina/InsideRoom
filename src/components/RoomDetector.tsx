"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useRoomStore } from "@/store/roomStore";

function createLabelTexture(label: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(247, 241, 233, 0.92)";
  const radius = 30;
  const x = 12;
  const y = 16;
  const width = canvas.width - 24;
  const height = canvas.height - 32;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(139, 119, 101, 0.28)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#6b6258";
  ctx.font = "600 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function RoomDetector() {
  const apartmentType = useRoomStore((s) => s.apartmentType);
  const activeLevel = useRoomStore((s) => s.activeLevel);
  const rooms = useRoomStore((s) => s.rooms);
  const viewMode = useRoomStore((s) => s.viewMode);
  const visibleRooms = useMemo(
    () =>
      rooms.filter((room) => viewMode !== "2d" || apartmentType !== "duplex" || (room.level ?? 0) === activeLevel),
    [activeLevel, apartmentType, rooms, viewMode],
  );

  const roomLabels = useMemo(
    () =>
      visibleRooms.map((room) => ({
        room,
        texture: createLabelTexture(room.label),
      })),
    [visibleRooms],
  );

  useEffect(() => {
    return () => {
      roomLabels.forEach(({ texture }) => texture.dispose());
    };
  }, [roomLabels]);

  return (
    <group>
      {roomLabels.map(({ room, texture }) => {
        const [width, length] = room.size;
        const [x, z] = room.center;
        const labelWidth = Math.max(0.9, Math.min(width - 0.2, 2.4));
        const labelHeight = Math.max(0.26, Math.min(length - 0.15, 0.62));

        return (
          <group key={room.id}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, z]}>
              <planeGeometry args={[Math.max(0.35, width - 0.12), Math.max(0.35, length - 0.12)]} />
              <meshBasicMaterial color={room.color} transparent opacity={viewMode === "2d" ? 0.34 : 0.14} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.018, z]}>
              <planeGeometry args={[labelWidth, labelHeight]} />
              <meshBasicMaterial map={texture} transparent depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
