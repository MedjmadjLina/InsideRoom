// ============================================
// RoomLights.tsx — User-placed indoor lamps
// Each lamp = point light + small visible bulb
// ============================================

"use client";

import { useLightingStore } from "@/store/lightingStore";

function LampMesh({ position, color, enabled }: { position: [number, number, number]; color: string; enabled: boolean }) {
  return (
    <group position={position}>
      {/* Small visible bulb sphere */}
      <mesh>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial
          color={enabled ? color : "#555555"}
          transparent
          opacity={enabled ? 0.9 : 0.3}
        />
      </mesh>
      {/* Glow halo */}
      {enabled && (
        <mesh>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}

export default function RoomLights() {
  const lamps = useLightingStore((s) => s.lamps);

  return (
    <>
      {lamps.map((lamp) => (
        <group key={lamp.id}>
          {lamp.enabled && (
            <pointLight
              position={lamp.position}
              intensity={lamp.intensity}
              color={lamp.color}
              distance={lamp.range}
              decay={2}
              castShadow={false}
            />
          )}
          <LampMesh
            position={lamp.position}
            color={lamp.color}
            enabled={lamp.enabled}
          />
        </group>
      ))}
    </>
  );
}
