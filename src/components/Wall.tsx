"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useDoorStore } from "@/store/doorStore";
import { useRoomStore } from "@/store/roomStore";
import { useWindowStore } from "@/store/windowStore";
import { useLightingStore, getSkyColor } from "@/store/lightingStore";
import { getWallHalfExtents, snapToGrid } from "@/lib/apartmentLayout";
import type { WallItem } from "@/types/apartment";
import type { PlacedDoor } from "@/types/door";
import type { PlacedWindow } from "@/types/window";
import { WindowTypeRenderer } from "./WindowTypes";

interface WallProps {
  wall: WallItem;
}

type Opening = {
  kind: "door" | "window";
  x1: number;
  x2: number;
  bottom: number;
  top: number;
};

type WallSegment = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function mergeIntervals(intervals: Array<[number, number]>) {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const [start, end] = sorted[i];
    const last = merged[merged.length - 1];
    if (start <= last[1] + 0.001) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
}

function createWallSegments(length: number, height: number, openings: Opening[]) {
  if (openings.length === 0) {
    return [{ x: 0, y: 0, width: length, height }];
  }

  const boundaries = new Set<number>([-length / 2, length / 2]);
  openings.forEach((opening) => {
    boundaries.add(opening.x1);
    boundaries.add(opening.x2);
  });

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  const segments: WallSegment[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i += 1) {
    const x1 = sortedBoundaries[i];
    const x2 = sortedBoundaries[i + 1];
    const sliceWidth = x2 - x1;
    if (sliceWidth <= 0.001) {
      continue;
    }

    const midX = (x1 + x2) / 2;
    const blocked = mergeIntervals(
      openings
        .filter((opening) => midX >= opening.x1 - 0.001 && midX <= opening.x2 + 0.001)
        .map((opening) => [opening.bottom, opening.top] as [number, number]),
    );

    let cursor = 0;
    for (const [start, end] of blocked) {
      if (start > cursor + 0.001) {
        segments.push({
          x: midX,
          y: (cursor + start) / 2 - height / 2,
          width: sliceWidth,
          height: start - cursor,
        });
      }
      cursor = Math.max(cursor, end);
    }

    if (cursor < height - 0.001) {
      segments.push({
        x: midX,
        y: (cursor + height) / 2 - height / 2,
        width: sliceWidth,
        height: height - cursor,
      });
    }
  }

  return segments.filter((segment) => segment.width > 0.01 && segment.height > 0.01);
}

function normalizeWindowOpening(window: PlacedWindow, wall: WallItem): Opening {
  const width = Math.max(0.5, Math.min(window.width, wall.length - 0.22));
  const height = Math.max(0.5, Math.min(window.height, wall.height - window.sillHeight - 0.12));
  const sillHeight = Math.max(0.2, Math.min(window.sillHeight, wall.height - height - 0.08));
  const maxOffset = Math.max(0, wall.length / 2 - width / 2 - 0.08);
  const offset = Math.max(-maxOffset, Math.min(maxOffset, window.offset));

  return {
    kind: "window",
    x1: offset - width / 2,
    x2: offset + width / 2,
    bottom: sillHeight,
    top: sillHeight + height,
  };
}

function normalizeDoorOpening(door: PlacedDoor, wall: WallItem): Opening {
  const width = Math.max(0.8, Math.min(door.width, wall.length - 0.16));
  const height = Math.max(1.95, Math.min(door.height, wall.height - 0.05));
  const maxOffset = Math.max(0, wall.length / 2 - width / 2 - 0.08);
  const offset = Math.max(-maxOffset, Math.min(maxOffset, door.offset));

  return {
    kind: "door",
    x1: offset - width / 2,
    x2: offset + width / 2,
    bottom: 0,
    top: height,
  };
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
  const viewMode = useRoomStore((s) => s.viewMode);
  const selectWall = useRoomStore((s) => s.selectWall);
  const updateWall = useRoomStore((s) => s.updateWall);
  const selectFurniture = useRoomStore((s) => s.selectFurniture);
  const allPlacedDoors = useDoorStore((s) => s.placedDoors);
  const allPlacedWindows = useWindowStore((s) => s.placedWindows);
  const sun = useLightingStore((s) => s.sun);
  const { camera, gl, raycaster } = useThree();

  const isSelected = selectedWallId === wall.id;
  const isEditable = viewMode === "2d";
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
  const skyColor = useMemo(() => getSkyColor(sun.timeOfDay), [sun.timeOfDay]);
  const placedDoors = useMemo(
    () => allPlacedDoors.filter((door) => door.wallId === wall.id),
    [allPlacedDoors, wall.id],
  );
  const placedWindows = useMemo(
    () => allPlacedWindows.filter((window) => window.wallId === wall.id),
    [allPlacedWindows, wall.id],
  );
  const openings = useMemo(
    () => [
      ...placedWindows.map((window) => normalizeWindowOpening(window, wall)),
      ...placedDoors.map((door) => normalizeDoorOpening(door, wall)),
    ],
    [placedDoors, placedWindows, wall],
  );
  const wallSegments = useMemo(
    () => createWallSegments(wall.length, wall.height, openings),
    [openings, wall.height, wall.length],
  );

  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isEditable) {
      return;
    }
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
  }, [camera, gl, isEditable, raycaster, selectFurniture, selectWall, wall.id, wall.position]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isEditable || !isDragging) {
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
  }, [camera, gl, isDragging, isEditable, raycaster, room.length, room.width, updateWall, wall.height, wall.id, wall.length, wall.rotation, wall.thickness]);

  const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!isEditable) {
      return;
    }
    event.stopPropagation();
    setIsDragging(false);
  }, [isEditable]);

  return (
    <group position={wall.position} rotation={[0, rotation, 0]}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => {
          if (!isEditable) {
            return;
          }
          setIsHovered(true);
          document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          if (!isEditable) {
            return;
          }
          setIsHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[wall.length, wall.height, wall.thickness]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {wallSegments.map((segment, index) => (
        <mesh key={`${wall.id}-segment-${index}`} position={[segment.x, segment.y, 0]} castShadow receiveShadow>
          <boxGeometry args={[segment.width, segment.height, wall.thickness]} />
          <meshStandardMaterial roughness={0.92} metalness={0.02} {...material} />
        </mesh>
      ))}

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

      {placedWindows.map((window) => {
        const width = Math.max(0.5, Math.min(window.width, wall.length - 0.22));
        const height = Math.max(0.5, Math.min(window.height, wall.height - window.sillHeight - 0.12));
        const sillHeight = Math.max(0.2, Math.min(window.sillHeight, wall.height - height - 0.08));
        const localY = -wall.height / 2 + sillHeight + height / 2;
        const maxOffset = Math.max(0, wall.length / 2 - width / 2 - 0.08);
        const localX = Math.max(-maxOffset, Math.min(maxOffset, window.offset));

        return (
          <group key={window.id} position={[localX, localY, 0]}>
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[width + 0.08, height + 0.08, wall.thickness * 0.72]} />
              <meshStandardMaterial color="#6d5d50" roughness={0.88} metalness={0.02} />
            </mesh>
            <mesh position={[0, 0, wall.thickness * 0.14]}>
              <boxGeometry args={[width + 0.02, height + 0.02, wall.thickness * 0.16]} />
              <meshStandardMaterial color="#201916" roughness={0.98} metalness={0} />
            </mesh>
            <group position={[0, 0, wall.thickness * 0.24]}>
              <WindowTypeRenderer
                type={window.type}
                winW={width}
                winH={height}
                wallT={wall.thickness}
                frameColor={window.frameColor}
                skyColor={skyColor}
                timeOfDay={sun.timeOfDay}
              />
            </group>
          </group>
        );
      })}

      {placedDoors.map((door) => {
        const width = Math.max(0.8, Math.min(door.width, wall.length - 0.16));
        const height = Math.max(1.95, Math.min(door.height, wall.height - 0.05));
        const maxOffset = Math.max(0, wall.length / 2 - width / 2 - 0.08);
        const localX = Math.max(-maxOffset, Math.min(maxOffset, door.offset));
        const localY = -wall.height / 2 + height / 2;
        const isDouble = door.type === "double";
        const isArched = door.type === "arched";

        return (
          <group key={door.id} position={[localX, localY, wall.thickness * 0.1]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[width + 0.1, height + 0.08, wall.thickness * 0.72]} />
              <meshStandardMaterial color="#5f4a39" roughness={0.9} metalness={0.02} />
            </mesh>
            <mesh position={[0, 0, wall.thickness * 0.16]}>
              <boxGeometry args={[width, height, wall.thickness * 0.12]} />
              <meshStandardMaterial color={door.color} roughness={0.72} metalness={0.06} />
            </mesh>

            {isDouble ? (
              <>
                <mesh position={[-0.01, 0, wall.thickness * 0.23]}>
                  <boxGeometry args={[0.02, height - 0.04, wall.thickness * 0.1]} />
                  <meshStandardMaterial color="#d5c2aa" roughness={0.45} metalness={0.35} />
                </mesh>
                {([-1, 1] as const).map((side) => (
                  <mesh key={side} position={[side * (width * 0.22), 0, wall.thickness * 0.24]}>
                    <sphereGeometry args={[0.03, 12, 12]} />
                    <meshStandardMaterial color="#d9c3a0" roughness={0.35} metalness={0.6} />
                  </mesh>
                ))}
              </>
            ) : (
              <mesh position={[width * 0.34, 0, wall.thickness * 0.24]}>
                <sphereGeometry args={[0.03, 12, 12]} />
                <meshStandardMaterial color="#d9c3a0" roughness={0.35} metalness={0.6} />
              </mesh>
            )}

            {isArched && (
              <mesh position={[0, height / 2 - width * 0.18, wall.thickness * 0.15]}>
                <cylinderGeometry args={[width * 0.26, width * 0.26, wall.thickness * 0.13, 24, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color={door.color} roughness={0.72} metalness={0.06} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
