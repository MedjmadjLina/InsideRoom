// ============================================
// BuildingShell.tsx — Haussmannian building shell
// Wraps the apartment (which sits at y=0, 4th floor).
// All geometry is positioned relative to apartment floor.
// ============================================

"use client";

import { useMemo } from "react";
import { useRoomStore } from "@/store/roomStore";
import { useWindowStore } from "@/store/windowStore";
import { useLightingStore } from "@/store/lightingStore";
import * as THREE from "three";

// ── Building constants (exported for use in other components) ──────────────
export const FLOOR_H        = 3.20;   // floor-to-floor height
export const SLAB_T         = 0.30;   // structural slab thickness
export const APT_FLOOR_IDX  = 3;      // apartment is on the 4th floor (0-based)
export const TOTAL_FLOORS   = 7;      // ground (0) → 6th floor
export const CLEAR_H        = FLOOR_H - SLAB_T;   // inter-slab clear height = 2.90m
// y in world space where street level is (floor 0 slab bottom):
export const STREET_Y       = -(APT_FLOOR_IDX * FLOOR_H);  // −9.6 m

/** Y of the bottom of a given floor volume in world space */
export function floorBottomY(floorIdx: number): number {
  return STREET_Y + floorIdx * FLOOR_H;
}

// ── Facade palette ─────────────────────────────────────────────────────────
const BRICK      = "#c2b19a";   // warm limestone / rendered masonry
const BRICK_DARK = "#9b8b79";   // shadowed stone
const STONE      = "#ebe3d5";   // pale cut stone
const STONE_DIM  = "#d9cfbf";   // shaded stone
const GLASS_D    = "#1c2c38";   // dark night glass
const METAL_DARK = "#2a2420";   // iron/cast metal
const APARTMENT_OPACITY = 0.06; // apartment shell should be barely there in free 3D view

// ── Material helpers ───────────────────────────────────────────────────────
function brickMat(color = BRICK)  { return { color, roughness: 0.94, metalness: 0.0 }; }
function stoneMat(color = STONE)  { return { color, roughness: 0.78, metalness: 0.02 }; }

function shellMaterial(base: { color: string; roughness: number; metalness: number }, transparent = false) {
  return {
    ...base,
    transparent,
    opacity: transparent ? APARTMENT_OPACITY : 1,
    depthWrite: !transparent,
  };
}

// ── Position of the apartment clear zone in world Y ───────────────────────
// (apartment floor = y=0, ceiling = y=room.height)

// ===========================================================================
// FACADE — the street-facing (-Z) Haussmannian elevation, full building height
// ===========================================================================
function HaussmannElevation({
  buildingW,
  roomLength,
  winWidthFraction,
  winH,
  winSillH,
  winOffsetX,
}: {
  buildingW: number;
  roomLength: number;
  winWidthFraction: number;
  winH: number;
  winSillH: number;
  winOffsetX: number;
}) {
  // Push the facade clearly in front of the structural box so it reads from angled views.
  const faceZ  = -roomLength / 2 - 0.18;
  const faceTh = 0.08; // facade layer thickness (decorative veneer depth)

  const visibleFloors = APT_FLOOR_IDX + 1;
  const totalH = visibleFloors * FLOOR_H;
  const bldgBotY = floorBottomY(0);     // -9.6
  const bldgTopY = floorBottomY(APT_FLOOR_IDX) + FLOOR_H;
  const aptFloorY = floorBottomY(APT_FLOOR_IDX);
  const facadeW  = Math.max(buildingW + 2.4, 7.8);
  const bayHalf  = facadeW * 0.29;
  const aptWinW  = buildingW * winWidthFraction;
  const aptWinH  = winH;
  const aptPosX  = winOffsetX;
  const faceOuterZ = -faceTh * 0.5;
  const project = (depth: number) => faceOuterZ - depth;
  const recess = (depth: number) => faceOuterZ + depth;
  const balconyFloors = new Set([2, APT_FLOOR_IDX]);
  const lowerFacadeH = aptFloorY - bldgBotY;
  const aptOpeningBottom = aptFloorY + SLAB_T + winSillH;
  const aptOpeningTop = aptOpeningBottom + aptWinH;
  const aptLowerBandH = Math.max(0.18, aptOpeningBottom - aptFloorY);
  const aptUpperBandH = Math.max(0.18, bldgTopY - aptOpeningTop);
  const sidePierW = Math.max(0.32, (facadeW - aptWinW) / 2);

  return (
    <group position={[0, 0, faceZ]}>
      {/* Main cut-stone body below the apartment */}
      <mesh position={[0, bldgBotY + lowerFacadeH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[facadeW, lowerFacadeH, faceTh]} />
        <meshStandardMaterial {...brickMat()} />
      </mesh>

      {/* Apartment facade split around the actual opening */}
      <mesh position={[0, aptFloorY + aptLowerBandH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[facadeW, aptLowerBandH, faceTh]} />
        <meshStandardMaterial {...brickMat()} />
      </mesh>
      <mesh position={[0, aptOpeningTop + aptUpperBandH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[facadeW, aptUpperBandH, faceTh]} />
        <meshStandardMaterial {...brickMat()} />
      </mesh>
      <mesh position={[aptPosX - aptWinW / 2 - sidePierW / 2, aptOpeningBottom + aptWinH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[sidePierW, aptWinH, faceTh]} />
        <meshStandardMaterial {...brickMat()} />
      </mesh>
      <mesh position={[aptPosX + aptWinW / 2 + sidePierW / 2, aptOpeningBottom + aptWinH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[sidePierW, aptWinH, faceTh]} />
        <meshStandardMaterial {...brickMat()} />
      </mesh>

      {/* Rusticated ground floor */}
      <mesh position={[0, floorBottomY(0) + FLOOR_H / 2, project(0.008)]} receiveShadow>
        <boxGeometry args={[facadeW + 0.08, FLOOR_H, 0.02]} />
        <meshStandardMaterial color="#d9cfbf" roughness={0.86} metalness={0.02} />
      </mesh>

      {/* Vertical bays / pilasters framing the apartment */}
      {[-1, 1].map((side) => (
        <mesh
          key={`bay-${side}`}
          position={[side * bayHalf, bldgBotY + totalH / 2, project(0.012)]}
          receiveShadow
        >
          <boxGeometry args={[0.34, totalH + 0.08, 0.024]} />
          <meshStandardMaterial {...stoneMat(STONE_DIM)} />
        </mesh>
      ))}

      {/* Horizontal bands */}
      {Array.from({ length: visibleFloors + 1 }, (_, i) => {
        const y = floorBottomY(i) + (i === 0 ? -SLAB_T / 2 : SLAB_T / 2);
        const height = i === 0 ? 0.34 : i === visibleFloors ? 0.42 : 0.16;
        return (
          <mesh key={`sc-${i}`} position={[0, y, project(0.014)]} receiveShadow>
            <boxGeometry args={[facadeW + 0.14, height, 0.028]} />
            <meshStandardMaterial {...stoneMat()} />
          </mesh>
        );
      })}

      {/* Corner quoins */}
      {[-1, 1].map((side) => (
        <mesh
          key={`quoin-${side}`}
          position={[side * (facadeW / 2 - 0.12), bldgBotY + totalH / 2, project(0.006)]}
          receiveShadow
        >
          <boxGeometry args={[0.24, totalH + 0.06, 0.014]} />
          <meshStandardMaterial {...stoneMat(STONE_DIM)} />
        </mesh>
      ))}

      {/* Entablature / cornice */}
      <mesh position={[0, bldgTopY + 0.22, project(0.02)]} receiveShadow>
        <boxGeometry args={[facadeW + 0.34, 0.34, 0.04]} />
        <meshStandardMaterial {...stoneMat()} />
      </mesh>
      <mesh position={[0, bldgTopY + 0.38, project(0.036)]} receiveShadow>
        <boxGeometry args={[facadeW + 0.5, 0.12, 0.072]} />
        <meshStandardMaterial {...stoneMat("#f3ebde")} />
      </mesh>

      {/* Balconies */}
      {Array.from(balconyFloors).map((floorIdx) => {
        const y = floorBottomY(floorIdx) + SLAB_T + 0.18;
        const balconyW = floorIdx === APT_FLOOR_IDX ? aptWinW + 1.4 : facadeW - 1.1;
        return (
          <group key={`balcony-${floorIdx}`} position={[0, y, project(0.2)]}>
            <mesh receiveShadow>
              <boxGeometry args={[balconyW, 0.08, 0.32]} />
              <meshStandardMaterial {...stoneMat("#dfd5c5")} />
            </mesh>
            <mesh position={[0, 0.46, 0.1]} receiveShadow>
              <boxGeometry args={[balconyW - 0.1, 0.06, 0.03]} />
              <meshStandardMaterial color={METAL_DARK} roughness={0.52} metalness={0.82} />
            </mesh>
            {Array.from({ length: Math.max(6, Math.floor(balconyW / 0.22)) }, (_, i) => {
              const x = -balconyW / 2 + 0.1 + (i * (balconyW - 0.2)) / Math.max(5, Math.floor(balconyW / 0.22) - 1);
              return (
                <mesh key={i} position={[x, 0.24, 0.1]} receiveShadow>
                  <boxGeometry args={[0.03, 0.42, 0.03]} />
                  <meshStandardMaterial color={METAL_DARK} roughness={0.52} metalness={0.82} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* Floor windows */}
      {Array.from({ length: visibleFloors }, (_, i) => {
        const isApt = i === APT_FLOOR_IDX;
        const flY   = floorBottomY(i);
        const sillY = flY + SLAB_T + winSillH;

        if (isApt) {
          const surroundT = 0.12;
          return (
            <group key={`fl-${i}`}>
              <mesh position={[aptPosX, sillY + aptWinH / 2 + aptWinH / 2 + surroundT / 2, project(0.016)]}>
                <boxGeometry args={[aptWinW + 0.42, surroundT, 0.038]} />
                <meshStandardMaterial {...stoneMat("#f1e8db")} />
              </mesh>
              <mesh position={[aptPosX, sillY + aptWinH / 2 - aptWinH / 2 - surroundT / 2, project(0.016)]}>
                <boxGeometry args={[aptWinW + 0.42, surroundT, 0.038]} />
                <meshStandardMaterial {...stoneMat("#f1e8db")} />
              </mesh>
              <mesh position={[aptPosX - aptWinW / 2 - surroundT / 2, sillY + aptWinH / 2, project(0.016)]}>
                <boxGeometry args={[surroundT, aptWinH + 0.28, 0.038]} />
                <meshStandardMaterial {...stoneMat("#f1e8db")} />
              </mesh>
              <mesh position={[aptPosX + aptWinW / 2 + surroundT / 2, sillY + aptWinH / 2, project(0.016)]}>
                <boxGeometry args={[surroundT, aptWinH + 0.28, 0.038]} />
                <meshStandardMaterial {...stoneMat("#f1e8db")} />
              </mesh>
              <mesh position={[aptPosX, sillY + aptWinH / 2 + aptWinH / 2 + 0.18, project(0.024)]}>
                <boxGeometry args={[aptWinW + 0.7, 0.14, 0.05]} />
                <meshStandardMaterial {...stoneMat()} />
              </mesh>
              <mesh position={[aptPosX, sillY + aptWinH / 2, recess(0.01)]}>
                <boxGeometry args={[aptWinW + 0.08, aptWinH, 0.01]} />
                <meshStandardMaterial
                  color="#c8dce8" roughness={0.05} metalness={0.02}
                  transparent opacity={0.35}
                />
              </mesh>
              <mesh position={[aptPosX, sillY - 0.06, project(0.034)]}>
                <boxGeometry args={[aptWinW + 0.46, 0.09, 0.08]} />
                <meshStandardMaterial {...stoneMat()} />
              </mesh>
            </group>
          );
        }

        const winPositions = [-bayHalf, 0, bayHalf];
        const wW = i === 0 ? 0.88 : 0.96;
        const wH = i === 0 ? 1.8 : i >= TOTAL_FLOORS - 1 ? 1.3 : 1.55;
        const localSillY = i === 0 ? flY + SLAB_T + 0.42 : flY + SLAB_T + 0.72;

        return (
          <group key={`fl-${i}`}>
            {winPositions.map((wx, wi) => (
              <group key={wi} position={[wx, localSillY + wH / 2, 0]}>
                <mesh position={[0, 0, project(0.015)]}>
                  <boxGeometry args={[wW + 0.18, wH + 0.16, 0.032]} />
                  <meshStandardMaterial {...stoneMat()} />
                </mesh>
                <mesh position={[0, 0, recess(0.011)]}>
                  <boxGeometry args={[wW, wH, 0.006]} />
                  <meshStandardMaterial
                    color={GLASS_D} roughness={0.08} metalness={0.12}
                    transparent opacity={0.88}
                    depthWrite={true}
                    emissive={new THREE.Color("#c8a060")}
                    emissiveIntensity={0.08}
                  />
                </mesh>
                <mesh position={[0, 0, project(0.018)]}>
                  <boxGeometry args={[wW + 0.04, 0.04, 0.012]} />
                  <meshStandardMaterial color="#f4f0e9" roughness={0.6} metalness={0} />
                </mesh>
                <mesh position={[0, -wH / 2 - 0.04, project(0.03)]}>
                  <boxGeometry args={[wW + 0.16, 0.065, 0.055]} />
                  <meshStandardMaterial {...stoneMat()} />
                </mesh>
                <mesh position={[0, wH / 2 + 0.06, project(0.024)]}>
                  <boxGeometry args={[wW + 0.24, 0.08, 0.026]} />
                  <meshStandardMaterial {...stoneMat(STONE_DIM)} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* Porte cochere */}
      {(() => {
        const gfY   = floorBottomY(0);
        const doorW = 1.55;
        const doorH = 2.75;
        const doorY = gfY + SLAB_T + doorH / 2;
        return (
          <group position={[facadeW * 0.31, doorY, 0]}>
            <mesh position={[0, 0, project(0.02)]}>
              <boxGeometry args={[doorW + 0.3, doorH + 0.32, 0.04]} />
              <meshStandardMaterial {...stoneMat()} />
            </mesh>
            <mesh position={[0, 0, recess(0.012)]}>
              <boxGeometry args={[doorW, doorH, 0.006]} />
              <meshStandardMaterial color="#2b221d" roughness={0.4} metalness={0.06} />
            </mesh>
            <mesh position={[0, doorH / 2 + 0.2, project(0.024)]}>
              <boxGeometry args={[doorW + 0.48, 0.14, 0.04]} />
              <meshStandardMaterial {...stoneMat()} />
            </mesh>
            <mesh position={[0, doorH / 2 + 0.36, project(0.024)]}>
              <boxGeometry args={[doorW + 0.28, 0.18, 0.03]} />
              <meshStandardMaterial {...stoneMat()} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
}

// ===========================================================================
// SIDE WALLS AND BACK — simple structural masonry
// ===========================================================================
function BuildingVolume({ roomWidth, roomLength }: { roomWidth: number; roomLength: number }) {
  const totalH = (APT_FLOOR_IDX + 1) * FLOOR_H;
  const bldgBotY = floorBottomY(0);
  const wallT    = 0.25;
  const aptY     = floorBottomY(APT_FLOOR_IDX);
  const aptH     = FLOOR_H;
  const lowerH   = aptY - bldgBotY;

  return (
    <group>
      <mesh position={[-roomWidth / 2 - wallT / 2, bldgBotY + lowerH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallT, lowerH, roomLength + wallT]} />
        <meshStandardMaterial {...brickMat(BRICK_DARK)} />
      </mesh>
      <mesh position={[roomWidth / 2 + wallT / 2, bldgBotY + lowerH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallT, lowerH, roomLength + wallT]} />
        <meshStandardMaterial {...brickMat(BRICK_DARK)} />
      </mesh>
      <mesh position={[0, bldgBotY + lowerH / 2, roomLength / 2 + wallT / 2]} receiveShadow>
        <boxGeometry args={[roomWidth + wallT * 2, lowerH, wallT]} />
        <meshStandardMaterial {...brickMat(BRICK_DARK)} />
      </mesh>
      <mesh position={[-roomWidth / 2 - wallT / 2, aptY + aptH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallT, aptH, roomLength + wallT]} />
        <meshStandardMaterial {...shellMaterial(brickMat(BRICK_DARK), true)} />
      </mesh>
      <mesh position={[roomWidth / 2 + wallT / 2, aptY + aptH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[wallT, aptH, roomLength + wallT]} />
        <meshStandardMaterial {...shellMaterial(brickMat(BRICK_DARK), true)} />
      </mesh>
      <mesh position={[0, aptY + aptH / 2, roomLength / 2 + wallT / 2]} receiveShadow>
        <boxGeometry args={[roomWidth + wallT * 2, aptH, wallT]} />
        <meshStandardMaterial {...shellMaterial(brickMat(BRICK_DARK), true)} />
      </mesh>
    </group>
  );
}

// ===========================================================================
// FLOOR SLABS — internal structural slabs per floor
// The apartment floor (i=3) slab is the floor of our room (y≈0)
// ===========================================================================
function FloorSlabs({ roomWidth, roomLength }: { roomWidth: number; roomLength: number }) {
  return (
    <group>
      {Array.from({ length: APT_FLOOR_IDX + 2 }, (_, i) => {
        if (i === APT_FLOOR_IDX + 1) return null; // no ceiling / roof above the apartment
        const y = floorBottomY(i) + SLAB_T / 2;
        return (
          <mesh key={i} position={[0, y, 0]} receiveShadow>
            <boxGeometry args={[roomWidth, SLAB_T, roomLength]} />
            <meshStandardMaterial color="#c4bdb4" roughness={0.92} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
}

// ===========================================================================
// NON-APARTMENT FLOOR INTERIORS — dark fill for closed floors
// ===========================================================================
function ClosedFloors({ roomWidth, roomLength }: { roomWidth: number; roomLength: number }) {
  return (
    <group>
      {Array.from({ length: APT_FLOOR_IDX + 1 }, (_, i) => {
        if (i === APT_FLOOR_IDX) return null; // apartment is open
        const y = floorBottomY(i) + SLAB_T + CLEAR_H / 2;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[roomWidth - 0.06, CLEAR_H, roomLength - 0.06]} />
            <meshStandardMaterial
              color="#28221e"
              roughness={0.98}
              metalness={0}
              side={THREE.BackSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ===========================================================================
// CAST-IRON ENTRY RAILINGS at ground level
// ===========================================================================
function EntryRailings({ roomWidth }: { roomWidth: number }) {
  const groundY = floorBottomY(0);
  const railH   = 0.90;
  const postW   = 0.045;
  const railZ   = -0.3; // in front of building slightly

  const count = Math.floor(roomWidth / 0.22);
  return (
    <group>
      {/* Top rail */}
      <mesh position={[0, groundY + railH, railZ]} receiveShadow>
        <boxGeometry args={[roomWidth * 0.56, 0.038, 0.038]} />
        <meshStandardMaterial color={METAL_DARK} roughness={0.55} metalness={0.75} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[0, groundY + 0.08, railZ]} receiveShadow>
        <boxGeometry args={[roomWidth * 0.56, 0.038, 0.038]} />
        <meshStandardMaterial color={METAL_DARK} roughness={0.55} metalness={0.75} />
      </mesh>
      {/* Posts */}
      {Array.from({ length: Math.min(count, 14) }, (_, k) => {
        const x = -roomWidth * 0.28 + (k / (count - 1)) * roomWidth * 0.56;
        return (
          <mesh key={k} position={[x, groundY + railH / 2, railZ]} receiveShadow>
            <boxGeometry args={[postW, railH, postW]} />
            <meshStandardMaterial color={METAL_DARK} roughness={0.52} metalness={0.78} />
          </mesh>
        );
      })}
    </group>
  );
}

// ===========================================================================
// ENGLISH STREET LAMP — attached to building facade at apartment level
// (replaces Parisian lamp from CityEnvironment)
// ===========================================================================
export function EnglishStreetLamp({
  x = 0,
  isOn = true,
}: {
  x?: number;
  isOn?: boolean;
}) {
  const groundY = floorBottomY(0);
  const poleH   = 4.8;

  return (
    <group position={[x, groundY, -0.6]}>
      {/* Base */}
      <mesh position={[0, 0.18, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.36, 10]} />
        <meshStandardMaterial color={METAL_DARK} roughness={0.50} metalness={0.80} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.36 + poleH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.040, poleH, 10]} />
        <meshStandardMaterial color={METAL_DARK} roughness={0.48} metalness={0.82} />
      </mesh>
      {/* Curved arm */}
      <mesh position={[0.38, 0.36 + poleH, 0]} rotation={[0, 0, Math.PI * 0.08]}>
        <cylinderGeometry args={[0.018, 0.022, 0.80, 8]} />
        <meshStandardMaterial color={METAL_DARK} roughness={0.48} metalness={0.82} />
      </mesh>
      {/* Lantern body */}
      <mesh position={[0.82, 0.36 + poleH + 0.08, 0]} castShadow>
        <boxGeometry args={[0.22, 0.38, 0.22]} />
        <meshStandardMaterial color={METAL_DARK} roughness={0.45} metalness={0.85} />
      </mesh>
      {/* Lantern glass */}
      <mesh position={[0.82, 0.36 + poleH + 0.06, 0]}>
        <boxGeometry args={[0.16, 0.22, 0.16]} />
        <meshStandardMaterial
          color={isOn ? "#ffe8a0" : "#2a3a48"}
          transparent opacity={isOn ? 0.88 : 0.65}
          roughness={0.05} metalness={0}
          emissive={new THREE.Color(isOn ? "#ffd060" : "#000000")}
          emissiveIntensity={isOn ? 1.4 : 0}
        />
      </mesh>
      {/* Point light */}
      {isOn && (
        <pointLight
          position={[0.82, 0.36 + poleH + 0.02, 0]}
          color="#ffc848"
          intensity={32}
          distance={12}
          decay={1.6}
          castShadow={false}
        />
      )}
    </group>
  );
}

// ===========================================================================
// ROOT COMPONENT
// ===========================================================================
export default function BuildingShell() {
  const { width: roomWidth, length: roomLength, height: roomHeight } = useRoomStore((s) => s.room);
  const winConfig = useWindowStore((s) => s);
  const timeOfDay = useLightingStore((s) => s.sun.timeOfDay);
  const lampOn    = timeOfDay >= 17 || timeOfDay < 6;

  // Facade width matches the room width exactly (English terrace single unit)
  const buildingW = roomWidth;

  return (
    <group>
      <BuildingVolume roomWidth={roomWidth} roomLength={roomLength} />
      <FloorSlabs    roomWidth={roomWidth} roomLength={roomLength} />
      <ClosedFloors  roomWidth={roomWidth} roomLength={roomLength} />
      <HaussmannElevation
        buildingW={buildingW}
        roomLength={roomLength}
        winWidthFraction={winConfig.config.widthFraction}
        winH={winConfig.config.height}
        winSillH={winConfig.config.sillHeight}
        winOffsetX={winConfig.config.offsetX}
      />
      <EntryRailings roomWidth={roomWidth} />
      {/* English street lamps flanking the entrance */}
      <EnglishStreetLamp x={-roomWidth * 0.38} isOn={lampOn} />
      <EnglishStreetLamp x={ roomWidth * 0.38} isOn={lampOn} />
    </group>
  );
}
