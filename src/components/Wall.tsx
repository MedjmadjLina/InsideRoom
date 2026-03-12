"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRoomStore } from "@/store/roomStore";
import { getWallHalfExtents, snapToGrid } from "@/lib/apartmentLayout";
import type { WallItem } from "@/types/apartment";

interface WallProps {
  wall: WallItem;
}

export default function Wall({ wall }: WallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersection = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const room = useRoomStore((s) => s.room);
  const selectedWallId = useRoomStore((s) => s.selectedWallId);
  const selectWall = useRoomStore((s) => s.selectWall);
  const updateWall = useRoomStore((s) => s.updateWall);
  const selectFurniture = useRoomStore((s) => s.selectFurniture);
  const { camera, gl, raycaster } = useThree();

  const isSelected = selectedWallId === wall.id;
  const rotation = (wall.rotation * Math.PI) / 180;

  const material = useMemo(() => {
    if (wall.kind === "exterior") {
      return isSelected
        ? { color: "#e7ddd0", emissive: "#3b82f6", emissiveIntensity: 0.12 }
        : { color: "#f1e8dc", emissive: "#000000", emissiveIntensity: 0 };
    }

    return isSelected
      ? { color: "#d9d3cb", emissive: "#3b82f6", emissiveIntensity: 0.16 }
      : { color: "#d8d1c8", emissive: "#000000", emissiveIntensity: 0 };
  }, [isSelected, wall.kind]);

  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(wall.length, wall.height, wall.thickness)),
    [wall.height, wall.length, wall.thickness],
  );

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    selectFurniture(null);
    selectWall(wall.id);

    const mouse = new THREE.Vector2(
      (event.nativeEvent.offsetX / gl.domElement.clientWidth) * 2 - 1,
      -(event.nativeEvent.offsetY / gl.domElement.clientHeight) * 2 + 1,
    );

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(dragPlane.current, intersection.current);
    offset.current.copy(intersection.current).sub(new THREE.Vector3(wall.position[0], 0, wall.position[2]));

    setIsDragging(true);
    (event.target as HTMLElement).setPointerCapture?.(event.nativeEvent.pointerId);
  }, [camera, gl, raycaster, selectFurniture, selectWall, wall.id, wall.position]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isDragging) {
      return;
    }

    event.stopPropagation();

    const mouse = new THREE.Vector2(
      (event.nativeEvent.offsetX / gl.domElement.clientWidth) * 2 - 1,
      -(event.nativeEvent.offsetY / gl.domElement.clientHeight) * 2 + 1,
    );

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(dragPlane.current, intersection.current);

    const next = intersection.current.clone().sub(offset.current);
    const { halfX, halfZ } = getWallHalfExtents(wall.length, wall.thickness, wall.rotation);

    updateWall(wall.id, {
      position: [
        Math.max(-room.width / 2 + halfX, Math.min(room.width / 2 - halfX, snapToGrid(next.x))),
        wall.height / 2,
        Math.max(-room.length / 2 + halfZ, Math.min(room.length / 2 - halfZ, snapToGrid(next.z))),
      ],
    });
  }, [camera, gl, isDragging, raycaster, room.length, room.width, updateWall, wall.height, wall.id, wall.length, wall.rotation, wall.thickness]);

  const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <group position={wall.position} rotation={[0, rotation, 0]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => {
          setIsHovered(true);
          document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[wall.length, wall.height, wall.thickness]} />
        <meshStandardMaterial roughness={0.92} metalness={0.02} {...material} />
      </mesh>

      <lineSegments geometry={edges}>
        <lineBasicMaterial
          color={isSelected ? "#3b82f6" : isHovered ? "#c3bbb1" : "#f5f1eb"}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.55 : 0.18}
        />
      </lineSegments>

      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -wall.height / 2 + 0.01, 0]}>
          <planeGeometry args={[wall.length + 0.12, wall.thickness + 0.12]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.16} />
        </mesh>
      )}
    </group>
  );
}
