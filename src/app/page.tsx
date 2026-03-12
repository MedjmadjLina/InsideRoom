// ============================================
// page.tsx — Main entry point
// Shows the immersive 3D intro, then transitions
// to the room planner once the animation ends.
// ============================================

"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRoomStore } from "@/store/roomStore";
import UIControls from "@/components/UIControls";
import ApartmentGenerator from "@/components/ApartmentGenerator";

// Dynamic imports for the 3D scenes to avoid SSR issues with Three.js
const IntroScene = dynamic(() => import("@/components/IntroScene"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#f0efeb] text-gray-600">
      Loading…
    </div>
  ),
});

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
      Loading 3D scene…
    </div>
  ),
});

export default function Home() {
  const appState = useRoomStore((s) => s.appState);
  const hydrate = useRoomStore((s) => s.hydrate);

  // Hydrate persisted state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <main className="w-screen h-screen overflow-hidden relative">
      {/* Immersive 3D intro */}
      {appState === "intro" && <IntroScene />}

      {/* Apartment generator */}
      {appState === "generator" && <ApartmentGenerator />}

      {/* Room planner */}
      {appState === "planner" && (
        <>
          <div className="w-full h-full">
            <Scene3D />
          </div>
          <UIControls />
        </>
      )}
    </main>
  );
}
