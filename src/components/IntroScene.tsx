// ============================================
// IntroScene.tsx — Premium immersive 3D intro
// Minimal character · Door · Cinematic camera
// ============================================

"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useRoomStore } from "@/store/roomStore";

// ─── Animation duration (seconds) ───
const ANIM_DURATION = 2.2;

// ─── Easing helpers ───
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── Minimal character (seen from behind) ───
function Character({ animating, progress }: { animating: boolean; progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const startZ = 1.8;
  const endZ = -0.2;

  useFrame(() => {
    if (!groupRef.current) return;
    if (animating) {
      const walkT = Math.min(progress / 0.5, 1);
      const eased = easeInOutCubic(walkT);
      groupRef.current.position.z = lerp(startZ, endZ, eased);

      // Walk bobbing & leg swing
      if (walkT < 1) {
        const bob = Math.sin(progress * 18) * 0.02;
        groupRef.current.position.y = bob;
        const legSwing = Math.sin(progress * 18) * 0.3;
        if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      } else {
        groupRef.current.position.y = 0;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      }
    } else {
      groupRef.current.position.z = startZ;
      groupRef.current.position.y = 0;
    }
  });

  const charColor = "#3d3832";
  const limbColor = "#2c2824";

  return (
    <group ref={groupRef} position={[0, 0, startZ]}>
      {/* Body */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.32, 8, 16]} />
        <meshStandardMaterial color={charColor} roughness={0.9} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={charColor} roughness={0.9} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.17, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.04, 0.22, 6, 8]} />
        <meshStandardMaterial color={limbColor} roughness={0.9} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.17, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.04, 0.22, 6, 8]} />
        <meshStandardMaterial color={limbColor} roughness={0.9} />
      </mesh>
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.065, 0.17, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.18, 6, 8]} />
        <meshStandardMaterial color={limbColor} roughness={0.9} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.065, 0.17, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.18, 6, 8]} />
        <meshStandardMaterial color={limbColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Wall with door opening ───
function IntroWall() {
  const wallColor = "#f0ece6";
  const frameColor = "#e2ddd6";

  return (
    <group position={[0, 0, -0.75]}>
      {/* Left wall */}
      <mesh position={[-1.1, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.4, 0.08]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Right wall */}
      <mesh position={[1.1, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.4, 0.08]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Top section */}
      <mesh position={[0, 2.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.15, 0.08]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
      {/* Door frame — left */}
      <mesh position={[-0.42, 1.08, 0.005]}>
        <boxGeometry args={[0.035, 2.15, 0.09]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      {/* Door frame — right */}
      <mesh position={[0.42, 1.08, 0.005]}>
        <boxGeometry args={[0.035, 2.15, 0.09]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      {/* Door frame — top */}
      <mesh position={[0, 2.155, 0.005]}>
        <boxGeometry args={[0.88, 0.035, 0.09]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Door ───
function Door({ animating, progress }: { animating: boolean; progress: number }) {
  const pivotRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!pivotRef.current) return;
    if (animating) {
      const doorStart = 0.08;
      const doorEnd = 0.45;
      const doorT = Math.max(0, Math.min((progress - doorStart) / (doorEnd - doorStart), 1));
      const eased = easeInOutCubic(doorT);
      pivotRef.current.rotation.y = lerp(0, -Math.PI / 2, eased);
    } else {
      pivotRef.current.rotation.y = 0;
    }
  });

  return (
    <group position={[-0.4, 0, -0.75]}>
      <group ref={pivotRef}>
        <mesh position={[0.4, 1.07, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 2.13, 0.04]} />
          <meshStandardMaterial color="#cdc5ba" roughness={0.75} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.71, 1.0, 0.035]}>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshStandardMaterial color="#8a8278" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Floor ───
function IntroFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#e8e2db" roughness={0.92} />
    </mesh>
  );
}

// ─── Camera animation controller ───
function CameraController({ animating, progress }: { animating: boolean; progress: number }) {
  const { camera } = useThree();

  const camStartPos = new THREE.Vector3(0, 1.3, 3.5);
  const camMidPos = new THREE.Vector3(0, 1.15, 0.6);
  const camEndPos = new THREE.Vector3(0, 1.15, -3.5);

  const camLookStart = new THREE.Vector3(0, 0.95, -0.75);
  const camLookEnd = new THREE.Vector3(0, 0.8, -5.0);

  useFrame(() => {
    if (!animating) {
      camera.position.copy(camStartPos);
      camera.lookAt(camLookStart);
      return;
    }

    const t = progress;
    const eased = easeInOutCubic(t);

    if (t < 0.55) {
      const p1 = t / 0.55;
      const e1 = easeInOutCubic(p1);
      camera.position.lerpVectors(camStartPos, camMidPos, e1);
    } else {
      const p2 = (t - 0.55) / 0.45;
      const e2 = easeInOutCubic(p2);
      camera.position.lerpVectors(camMidPos, camEndPos, e2);
    }

    const lookTarget = new THREE.Vector3().lerpVectors(camLookStart, camLookEnd, eased);
    camera.lookAt(lookTarget);
  });

  useEffect(() => {
    camera.position.copy(camStartPos);
    camera.lookAt(camLookStart);
  }, []);

  return null;
}

// ─── Fade overlay ───
function FadeOverlay({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div
      className="fixed inset-0 z-[200] pointer-events-none"
      style={{
        background: "#f5f3f0",
        opacity,
        transition: "opacity 0.1s linear",
      }}
    />
  );
}

// ─── Animation orchestrator ───
function AnimationOrchestrator({
  animating,
  onProgress,
  onComplete,
}: {
  animating: boolean;
  onProgress: (p: number) => void;
  onComplete: () => void;
}) {
  const startTime = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!animating) {
      startTime.current = null;
      return;
    }
    if (startTime.current === null) {
      startTime.current = 0;
    }
    startTime.current += delta;
    const progress = Math.min(startTime.current / ANIM_DURATION, 1);
    onProgress(progress);
    if (progress >= 1) onComplete();
  });

  return null;
}

// ─── Scene content ───
function IntroSceneContent({
  animating,
  progress,
  onProgress,
  onComplete,
}: {
  animating: boolean;
  progress: number;
  onProgress: (p: number) => void;
  onComplete: () => void;
}) {
  return (
    <>
      <ambientLight intensity={0.6} color="#fff5ee" />
      <directionalLight
        position={[3, 6, 5]}
        intensity={1.0}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-2, 4, -1]}
        intensity={0.25}
        color="#e8e4ff"
      />
      <hemisphereLight args={["#f0ece6", "#d5cfc8", 0.35]} />

      <fog attach="fog" args={["#ede9e3", 6, 14]} />

      <IntroFloor />
      <IntroWall />
      <Door animating={animating} progress={progress} />
      <Character animating={animating} progress={progress} />
      <CameraController animating={animating} progress={progress} />
      <AnimationOrchestrator
        animating={animating}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    </>
  );
}

// ─── Main exported component ───
export default function IntroScene() {
  const setAppState = useRoomStore((s) => s.setAppState);
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleEnter = useCallback(() => {
    if (animating) return;
    setAnimating(true);
  }, [animating]);

  const handleSkip = useCallback(() => {
    setAppState("generator");
  }, [setAppState]);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
    if (p > 0.75) setFadeOpacity((p - 0.75) / 0.25);
  }, []);

  const handleComplete = useCallback(() => {
    if (completed) return;
    setCompleted(true);
    setTimeout(() => setAppState("generator"), 150);
  }, [completed, setAppState]);

  return (
    <div className="w-screen h-screen relative overflow-hidden" style={{ background: "#ede9e3" }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 1.3, 3.5] }}
        style={{ background: "#ede9e3" }}
      >
        <IntroSceneContent
          animating={animating}
          progress={progress}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      </Canvas>

      {/* Fade overlay */}
      <FadeOverlay opacity={fadeOpacity} />

      {/* UI overlay */}
      {!animating && (
        <div
          className="absolute inset-0 z-[50] pointer-events-none"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease-out",
          }}
        >
          {/* Brand */}
          <div className="absolute top-5 left-5">
            <div
              className="pointer-events-none rounded-2xl px-4 py-3"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.22))",
                border: "1px solid rgba(255,255,255,0.35)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 10px 30px rgba(73,57,42,0.10), inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #7a4c2a, #c98a54)",
                    boxShadow: "0 8px 20px rgba(122,76,42,0.22)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12l9-8 9 8" />
                    <path d="M5 10.5V20h14v-9.5" />
                    <path d="M9.5 20v-5h5v5" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight" style={{ color: "#2f241b" }}>
                    InsideRoom
                  </div>
                  <div className="text-[11px]" style={{ color: "#8c7765" }}>
                    Walk in, then shape the space
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enter button */}
          <div className="absolute inset-x-0 bottom-28 flex justify-center">
            <button
              onClick={handleEnter}
              className="pointer-events-auto px-8 py-3.5 rounded-xl text-sm font-medium
                         transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "#2c2824",
                color: "#fff",
                boxShadow: "0 8px 32px rgba(44,40,36,0.2), 0 2px 8px rgba(44,40,36,0.1)",
              }}
            >
              Enter Apartment
            </button>
          </div>
        </div>
      )}

      {/* Skip */}
      {!completed && (
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 z-[60] px-3.5 py-1.5 text-xs font-medium
                     rounded-lg transition-all duration-200"
          style={{
            color: "#a8a29e",
            background: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#57534e";
            e.currentTarget.style.background = "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#a8a29e";
            e.currentTarget.style.background = "rgba(255,255,255,0.5)";
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
}
