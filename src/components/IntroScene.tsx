"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useRoomStore } from "@/store/roomStore";

const ANIM_DURATION = 3.8;
const AMBER = "#FFD8A8";
const BG_COLOR = "#1e1714";
const HALLWAY_LENGTH = 7.8;
const HALLWAY_WIDTH = 1.9;
const HALLWAY_HEIGHT = 2.75;
const DOOR_Z = -2.7;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function WallLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.075, 0.18, 18]} />
        <meshStandardMaterial color="#7f5a39" roughness={0.55} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.05, 0.07]}>
        <sphereGeometry args={[0.08, 18, 18]} />
        <meshStandardMaterial
          color="#fff2dc"
          emissive={new THREE.Color(AMBER)}
          emissiveIntensity={1.4}
          roughness={0.3}
        />
      </mesh>
      <pointLight
        position={[0, 0.08, 0.18]}
        color={AMBER}
        intensity={11}
        distance={4.2}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
    </group>
  );
}

function Character({ animating, progress }: { animating: boolean; progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const startZ = 1.75;
  const endZ = -1.55;

  useFrame(() => {
    if (!groupRef.current) return;

    const walkT = animating ? Math.min(progress / 0.62, 1) : 0;
    const eased = easeInOutCubic(walkT);
    const stride = Math.sin(progress * 18) * 0.32;
    const sway = Math.sin(progress * 9) * 0.03;

    groupRef.current.position.z = lerp(startZ, endZ, eased);
    groupRef.current.position.y = walkT > 0 && walkT < 1 ? Math.abs(Math.sin(progress * 18)) * 0.025 : 0;
    groupRef.current.rotation.y = sway;

    if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.65;
    if (rightArmRef.current) rightArmRef.current.rotation.x = stride * 0.65;
    if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
  });

  return (
    <group ref={groupRef} position={[0, 0, startZ]}>
      <mesh position={[0, 0.24, 0.01]} castShadow>
        <sphereGeometry args={[0.19, 24, 24]} />
        <meshStandardMaterial color="#3a2b22" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.21, 0.46, 10, 20]} />
        <meshStandardMaterial color="#4f3a2b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.1, 0.01]} castShadow>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#d8b79d" roughness={0.86} />
      </mesh>
      <mesh position={[0, 1.02, 0.16]} castShadow>
        <sphereGeometry args={[0.04, 18, 18]} />
        <meshStandardMaterial color="#c99673" roughness={0.82} />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.26, 0.67, 0.01]} rotation={[0, 0, -0.18]} castShadow>
        <capsuleGeometry args={[0.055, 0.34, 8, 12]} />
        <meshStandardMaterial color="#b78967" roughness={0.88} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.26, 0.67, 0.01]} rotation={[0, 0, 0.18]} castShadow>
        <capsuleGeometry args={[0.055, 0.34, 8, 12]} />
        <meshStandardMaterial color="#b78967" roughness={0.88} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.1, 0.02, 0.02]} castShadow>
        <capsuleGeometry args={[0.07, 0.44, 8, 14]} />
        <meshStandardMaterial color="#2e241d" roughness={0.94} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.1, 0.02, 0.02]} castShadow>
        <capsuleGeometry args={[0.07, 0.44, 8, 14]} />
        <meshStandardMaterial color="#2e241d" roughness={0.94} />
      </mesh>
    </group>
  );
}

function HallwayShell() {
  const planks = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: -0.72 + (i % 6) * 0.29,
        z: 2.85 - Math.floor(i / 6) * 1.42,
        tone: i % 3,
      })),
    [],
  );

  return (
    <group>
      <mesh position={[-HALLWAY_WIDTH / 2 - 0.05, HALLWAY_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, HALLWAY_HEIGHT, HALLWAY_LENGTH]} />
        <meshStandardMaterial color="#775845" roughness={0.92} />
      </mesh>
      <mesh position={[HALLWAY_WIDTH / 2 + 0.05, HALLWAY_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, HALLWAY_HEIGHT, HALLWAY_LENGTH]} />
        <meshStandardMaterial color="#775845" roughness={0.92} />
      </mesh>
      <mesh position={[0, HALLWAY_HEIGHT + 0.02, 0]} receiveShadow>
        <boxGeometry args={[HALLWAY_WIDTH + 0.16, 0.08, HALLWAY_LENGTH]} />
        <meshStandardMaterial color="#e9dccd" roughness={0.96} />
      </mesh>
      <mesh position={[0, HALLWAY_HEIGHT - 0.14, 0]} receiveShadow>
        <boxGeometry args={[HALLWAY_WIDTH + 0.12, 0.04, HALLWAY_LENGTH]} />
        <meshStandardMaterial color="#d8c7b7" roughness={0.88} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * (HALLWAY_WIDTH / 2 - 0.02), 0, 0]}>
          <mesh position={[side * 0.04, 0.14, 0]} receiveShadow>
            <boxGeometry args={[0.04, 0.28, HALLWAY_LENGTH]} />
            <meshStandardMaterial color="#c7a891" roughness={0.88} />
          </mesh>
          <mesh position={[side * 0.045, 0.92, 0]} receiveShadow>
            <boxGeometry args={[0.05, 0.08, HALLWAY_LENGTH]} />
            <meshStandardMaterial color="#cdb29b" roughness={0.86} />
          </mesh>
        </group>
      ))}

      <group position={[0, 0, 0]}>
        {planks.map((plank, index) => (
          <mesh
            key={index}
            position={[plank.x, 0.015, plank.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[0.26, 1.32]} />
            <meshStandardMaterial
              color={plank.tone === 0 ? "#6e4b33" : plank.tone === 1 ? "#7b553a" : "#8a6346"}
              roughness={0.8}
            />
          </mesh>
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALLWAY_WIDTH, HALLWAY_LENGTH]} />
        <meshStandardMaterial color="#5c3f2e" roughness={0.88} />
      </mesh>

      <WallLamp position={[-0.78, 1.55, 0.85]} />
      <WallLamp position={[0.78, 1.55, -0.55]} />
    </group>
  );
}

function DoorFrame() {
  return (
    <group position={[0, 0, DOOR_Z]}>
      <mesh position={[-0.78, HALLWAY_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, HALLWAY_HEIGHT, 0.12]} />
        <meshStandardMaterial color="#7d5d48" roughness={0.92} />
      </mesh>
      <mesh position={[0.78, HALLWAY_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, HALLWAY_HEIGHT, 0.12]} />
        <meshStandardMaterial color="#7d5d48" roughness={0.92} />
      </mesh>
      <mesh position={[0, HALLWAY_HEIGHT - 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.94, 0.34, 0.12]} />
        <meshStandardMaterial color="#ceb19b" roughness={0.84} />
      </mesh>
      <mesh position={[0, HALLWAY_HEIGHT / 2, -0.09]} receiveShadow>
        <boxGeometry args={[0.92, 2.2, 0.03]} />
        <meshStandardMaterial
          color="#fff1d8"
          emissive={new THREE.Color(AMBER)}
          emissiveIntensity={0.65}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function Door({ animating, progress }: { animating: boolean; progress: number }) {
  const pivotRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const spillRef = useRef<THREE.SpotLight>(null);
  const backLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const openStart = 0.38;
    const openEnd = 0.8;
    const openT = animating ? THREE.MathUtils.clamp((progress - openStart) / (openEnd - openStart), 0, 1) : 0;
    const eased = easeInOutCubic(openT);

    if (pivotRef.current) {
      pivotRef.current.rotation.y = -eased * Math.PI * 0.72;
    }
    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshStandardMaterial;
      glowMaterial.opacity = 0.18 + eased * 0.72;
    }
    if (spillRef.current) {
      spillRef.current.intensity = 40 * eased;
      spillRef.current.angle = lerp(0.28, 0.6, eased);
    }
    if (backLightRef.current) {
      backLightRef.current.intensity = 6 + eased * 18;
    }
  });

  return (
    <group position={[-0.44, 0, DOOR_Z + 0.028]}>
      <mesh ref={glowRef} position={[0.46, 1.12, -0.14]}>
        <boxGeometry args={[0.92, 2.18, 0.01]} />
        <meshStandardMaterial
          color="#fff1db"
          emissive={new THREE.Color(AMBER)}
          emissiveIntensity={2.2}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={backLightRef}
        position={[0.46, 1.3, -0.28]}
        color={AMBER}
        intensity={6}
        distance={5}
        decay={2}
      />
      <spotLight
        ref={spillRef}
        position={[0.32, 1.1, -0.12]}
        color={AMBER}
        intensity={0}
        angle={0.28}
        penumbra={0.7}
        distance={6}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <group ref={pivotRef}>
        <mesh position={[0.44, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 2.2, 0.06]} />
          <meshStandardMaterial color="#6a452f" roughness={0.7} />
        </mesh>
        <mesh position={[0.44, 1.1, 0.033]}>
          <boxGeometry args={[0.7, 1.85, 0.02]} />
          <meshStandardMaterial color="#83573b" roughness={0.72} />
        </mesh>
        <mesh position={[0.77, 1.06, 0.05]}>
          <sphereGeometry args={[0.025, 14, 14]} />
          <meshStandardMaterial color="#ad8a5c" roughness={0.24} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function CameraController({ animating, progress }: { animating: boolean; progress: number }) {
  const { camera } = useThree();
  const { camStartPos, camMidPos, camEndPos, lookStart, lookEnd } = useMemo(
    () => ({
      camStartPos: new THREE.Vector3(0, 1.42, 3.3),
      camMidPos: new THREE.Vector3(0, 1.36, 1.25),
      camEndPos: new THREE.Vector3(0, 1.26, -0.55),
      lookStart: new THREE.Vector3(0, 1, 1.2),
      lookEnd: new THREE.Vector3(0, 1.04, DOOR_Z - 0.3),
    }),
    [],
  );

  useFrame(() => {
    if (!animating) {
      camera.position.copy(camStartPos);
      camera.lookAt(lookStart);
      return;
    }

    const t = easeOutQuad(progress);
    if (t < 0.65) {
      camera.position.lerpVectors(camStartPos, camMidPos, easeInOutCubic(t / 0.65));
    } else {
      camera.position.lerpVectors(camMidPos, camEndPos, easeInOutCubic((t - 0.65) / 0.35));
    }

    const lookTarget = new THREE.Vector3().lerpVectors(lookStart, lookEnd, t);
    camera.lookAt(lookTarget);
  });

  useEffect(() => {
    camera.position.copy(camStartPos);
    camera.lookAt(lookStart);
  }, [camera, camStartPos, lookStart]);

  return null;
}

function FadeOverlay({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;

  return (
    <div
      className="fixed inset-0 z-[200] pointer-events-none"
      style={{
        background: "#f1e4d0",
        opacity,
        transition: "opacity 0.1s linear",
      }}
    />
  );
}

function AnimationOrchestrator({
  animating,
  onProgress,
  onComplete,
}: {
  animating: boolean;
  onProgress: (progress: number) => void;
  onComplete: () => void;
}) {
  const elapsedRef = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (!animating) {
      elapsedRef.current = null;
      return;
    }

    elapsedRef.current = (elapsedRef.current ?? 0) + delta;
    const progress = Math.min(elapsedRef.current / ANIM_DURATION, 1);
    onProgress(progress);

    if (progress >= 1) {
      onComplete();
    }
  });

  return null;
}

function IntroSceneContent({
  animating,
  progress,
  onProgress,
  onComplete,
}: {
  animating: boolean;
  progress: number;
  onProgress: (progress: number) => void;
  onComplete: () => void;
}) {
  return (
    <>
      <color attach="background" args={[BG_COLOR]} />
      <fog attach="fog" args={["#271d18", 2.5, 10]} />

      <ambientLight intensity={0.22} color="#8f6f57" />
      <hemisphereLight args={["#7d634f", "#2a211c", 0.22]} />
      <directionalLight
        position={[1.8, 2.8, 3]}
        intensity={0.5}
        color="#f3d3ad"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      <HallwayShell />
      <DoorFrame />
      <Door animating={animating} progress={progress} />
      <Character animating={animating} progress={progress} />
      <CameraController animating={animating} progress={progress} />
      <AnimationOrchestrator animating={animating} onProgress={onProgress} onComplete={onComplete} />
    </>
  );
}

export default function IntroScene() {
  const setAppState = useRoomStore((state) => state.setAppState);
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleEnter = useCallback(() => {
    if (!animating) {
      setAnimating(true);
    }
  }, [animating]);

  const handleSkip = useCallback(() => {
    setAppState("generator");
  }, [setAppState]);

  const handleProgress = useCallback((value: number) => {
    setProgress(value);
    if (value > 0.78) {
      setFadeOpacity((value - 0.78) / 0.22);
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (completed) return;
    setCompleted(true);
    setTimeout(() => setAppState("generator"), 180);
  }, [completed, setAppState]);

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: BG_COLOR }}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 38, near: 0.1, far: 100, position: [0, 1.42, 3.3] }}
        gl={{ antialias: true }}
      >
        <IntroSceneContent
          animating={animating}
          progress={progress}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
      </Canvas>

      <FadeOverlay opacity={fadeOpacity} />

      {!animating && (
        <div
          className="absolute inset-0 z-[50] pointer-events-none"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease-out",
          }}
        >
          <div className="absolute left-5 top-5">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: "linear-gradient(180deg, rgba(58,38,28,0.52), rgba(32,21,17,0.24))",
                border: "1px solid rgba(255,224,190,0.18)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 16px 42px rgba(12,8,6,0.28)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #6b422b, #c48a57)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.22)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12l9-8 9 8" />
                    <path d="M5 10.5V20h14v-9.5" />
                    <path d="M9.5 20v-5h5v5" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight" style={{ color: "#f7e8d7" }}>
                    InsideRoom
                  </div>
                  <div className="text-[11px]" style={{ color: "#d1b59c" }}>
                    Quiet apartment arrival
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-28 flex justify-center">
            <button
              onClick={handleEnter}
              className="pointer-events-auto rounded-xl px-8 py-3.5 text-sm font-medium transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "#f0d2ad",
                color: "#3e291d",
                boxShadow: "0 12px 34px rgba(16,10,8,0.32)",
              }}
            >
              Enter Apartment
            </button>
          </div>
        </div>
      )}

      {!completed && (
        <button
          onClick={handleSkip}
          className="absolute right-5 top-5 z-[60] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200"
          style={{
            color: "#e1c1a0",
            background: "rgba(45,29,22,0.42)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,216,168,0.16)",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = "#fff4e8";
            event.currentTarget.style.background = "rgba(72,46,33,0.72)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = "#e1c1a0";
            event.currentTarget.style.background = "rgba(45,29,22,0.42)";
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
}
