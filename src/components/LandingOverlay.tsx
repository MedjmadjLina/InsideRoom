// ============================================
// LandingOverlay.tsx — Animated landing page.
// The user "enters" the room through this overlay.
// ============================================

"use client";

import { useState } from "react";

interface LandingOverlayProps {
  onEnter: () => void;
}

export default function LandingOverlay({ onEnter }: LandingOverlayProps) {
  const [exiting, setExiting] = useState(false);

  const handleClick = () => {
    setExiting(true);
    // Wait for the animation to finish before mounting the 3D scene
    setTimeout(onEnter, 800);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center
        bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900
        transition-all duration-700 ease-in-out
        ${exiting ? "opacity-0 scale-110" : "opacity-100 scale-100"}`}
    >
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
          </svg>
        </div>

        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          InsideRoom
        </h1>
        <p className="text-lg text-slate-400 max-w-md mx-auto">
          Design and arrange your bedroom in an immersive 3D experience.
          Add furniture, set dimensions, and visualize your perfect layout.
        </p>

        <button
          onClick={handleClick}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white
                     rounded-xl text-lg font-semibold shadow-xl shadow-blue-600/25
                     hover:bg-blue-500 transition-all duration-300 hover:scale-105"
        >
          Enter Your Room
          <svg
            className="w-5 h-5 transition-transform group-hover:translate-x-1"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Bottom hint */}
      <p className="absolute bottom-8 text-xs text-slate-600">
        Prototype v1.0 — works best on desktop
      </p>
    </div>
  );
}
