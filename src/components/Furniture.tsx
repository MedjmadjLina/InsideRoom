// ============================================
// Furniture.tsx — renders one furniture item
// Interaction logic (drag, select, hover) here.
// Visual geometry delegated to FurnitureShape.
// ============================================

"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { useRoomStore } from "@/store/roomStore";
import type { FurnitureItem } from "@/types/furniture";
import FurnitureShape from "./FurnitureShape";
import * as THREE from "three";

interface FurnitureProps {
  item: FurnitureItem;
}

export default function Furniture({ item }: FurnitureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useRoomStore((s) => s.selectedId);
  const selectFurniture = useRoomStore((s) => s.selectFurniture);
  const updateFurniture = useRoomStore((s) => s.updateFurniture);
  const room = useRoomStore((s) => s.room);

  const isSelected = selectedId === item.id;
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { camera, raycaster, gl } = useThree();

  // Drag plane
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersection = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());

  // Edge geometry for selection outline (memoized)
  const edgesGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(item.width, item.height, item.depth)),
    [item.width, item.height, item.depth]
  );

  /** On pointer down: start drag */
  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      selectFurniture(item.id);

      dragPlane.current.set(new THREE.Vector3(0, 1, 0), -item.position[1]);

      const mouse = new THREE.Vector2(
        (e.nativeEvent.offsetX / gl.domElement.clientWidth) * 2 - 1,
        -(e.nativeEvent.offsetY / gl.domElement.clientHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(dragPlane.current, intersection.current);
      offset.current.copy(intersection.current).sub(new THREE.Vector3(...item.position));

      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.nativeEvent.pointerId);
    },
    [item, camera, raycaster, gl, selectFurniture]
  );

  /** On pointer move: update position */
  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return;
      e.stopPropagation();

      const mouse = new THREE.Vector2(
        (e.nativeEvent.offsetX / gl.domElement.clientWidth) * 2 - 1,
        -(e.nativeEvent.offsetY / gl.domElement.clientHeight) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(dragPlane.current, intersection.current);

      const newPos = intersection.current.clone().sub(offset.current);

      const halfW = room.width / 2 - item.width / 2;
      const halfL = room.length / 2 - item.depth / 2;
      newPos.x = Math.max(-halfW, Math.min(halfW, newPos.x));
      newPos.z = Math.max(-halfL, Math.min(halfL, newPos.z));
      newPos.y = item.position[1];

      updateFurniture(item.id, {
        position: [newPos.x, newPos.y, newPos.z],
      });
    },
    [isDragging, item, camera, raycaster, gl, room, updateFurniture]
  );

  /** On pointer up: stop drag */
  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  const rotationRad = (item.rotation * Math.PI) / 180;

  return (
    <group position={item.position} rotation={[0, rotationRad, 0]}>
      {/* ── Detailed furniture geometry ── */}
      <FurnitureShape item={item} isSelected={isSelected} />

      {/* ── Invisible bounding-box hit area for pointer events ── */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => { setIsHovered(true);  document.body.style.cursor = "grab"; }}
        onPointerOut={() =>  { setIsHovered(false); document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[item.width, item.height, item.depth]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* ── Edge outline — accentuated on selection / hover ── */}
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial
          color={isSelected ? "#3b82f6" : isHovered ? "#a8a09a" : "#d0ccc8"}
          transparent
          opacity={isSelected ? 0.9 : isHovered ? 0.5 : 0.18}
          linewidth={1}
        />
      </lineSegments>

      {/* ── Selection glow ring on floor ── */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -item.height / 2 + 0.003, 0]}>
          <ringGeometry args={[
            Math.max(item.width, item.depth) * 0.52,
            Math.max(item.width, item.depth) * 0.58,
            32,
          ]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.22} />
        </mesh>
      )}
    </group>
  );
}
