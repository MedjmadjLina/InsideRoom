// ============================================
// Zustand store — Lighting system
// Manages sun, ambient, lamps, and presets
// ============================================

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  SunState,
  AmbientState,
  RoomLamp,
  LightingPreset,
} from "@/types/lighting";

// ── Helpers: derive sun color & intensity from time of day ──

/** Returns a hex color for the sun based on time of day */
export function getSunColor(t: number): string {
  // 0-5:   deep blue night
  // 5-7:   warm sunrise (golden orange)
  // 7-10:  morning (warm white)
  // 10-14: noon (neutral daylight)
  // 14-17: afternoon (warm)
  // 17-19: sunset (deep orange)
  // 19-21: dusk (purple-pink)
  // 21-24: night (deep blue)

  if (t < 5)  return "#1a1a3e";  // night
  if (t < 6)  return "#4a3060";  // pre-dawn
  if (t < 7)  return "#f0a050";  // sunrise
  if (t < 8)  return "#ffcc80";  // early morning
  if (t < 10) return "#ffe8c8";  // morning
  if (t < 14) return "#fff6ec";  // noon daylight
  if (t < 16) return "#fff0d0";  // afternoon
  if (t < 17) return "#ffd080";  // late afternoon
  if (t < 18) return "#ff9040";  // sunset
  if (t < 19) return "#e06030";  // dusk
  if (t < 20) return "#803050";  // twilight
  return "#1a1a3e";               // night
}

/** Returns intensity multiplier 0-1.4 from time of day */
export function getSunIntensity(t: number): number {
  // Bell curve peaking at noon
  if (t < 5) return 0;
  if (t < 6) return 0.05;
  if (t < 7) return 0.3;
  if (t < 8) return 0.7;
  if (t < 10) return 1.0;
  if (t < 14) return 1.3;
  if (t < 16) return 1.1;
  if (t < 17) return 0.85;
  if (t < 18) return 0.5;
  if (t < 19) return 0.2;
  if (t < 20) return 0.05;
  return 0;
}

/** Returns smooth sun position [x, y, z] orbiting overhead based on time.
 *  Z is kept negative so the sun is always on the EXTERIOR side of the
 *  window wall (−Z). This causes light to enter through the windows and
 *  the window frames to cast shadow stripes onto the room floor.
 */
export function getSunPosition(t: number, radius = 12): [number, number, number] {
  // East-to-west arc: 6h = east (+X), 12h = south (0), 18h = west (−X)
  const angle = ((t - 6) / 12) * Math.PI;
  const x = Math.cos(angle) * radius;
  const y = Math.max(Math.sin(angle) * radius, -0.5);
  // Always on the exterior (−Z) side — depth varies to add east/west authenticity
  const z = -(radius * 0.7 + Math.abs(Math.cos(angle)) * radius * 0.25);
  return [x, y, z];
}

/** Ambient intensity based on time of day */
export function getAmbientFromTime(t: number): number {
  if (t < 5)  return 0.08;
  if (t < 7)  return 0.2;
  if (t < 10) return 0.4;
  if (t < 14) return 0.5;
  if (t < 17) return 0.4;
  if (t < 19) return 0.25;
  if (t < 20) return 0.12;
  return 0.08;
}

/** Hemisphere sky color based on time */
export function getSkyColor(t: number): string {
  if (t < 5)  return "#0a0a20";
  if (t < 7)  return "#7090c0";
  if (t < 10) return "#c8daf0";
  if (t < 14) return "#f0ece6";
  if (t < 17) return "#e0d8cc";
  if (t < 19) return "#806050";
  if (t < 20) return "#302040";
  return "#0a0a20";
}

/** Scene background gradient based on time */
export function getSceneBackground(t: number): [string, string] {
  if (t < 5)  return ["#12121e", "#0a0a14"];
  if (t < 7)  return ["#d4a070", "#806050"];
  if (t < 10) return ["#ece8e3", "#ddd9d4"];
  if (t < 14) return ["#ece8e3", "#ddd9d4"];
  if (t < 17) return ["#e8e0d5", "#d8d0c5"];
  if (t < 19) return ["#c08050", "#604030"];
  if (t < 20) return ["#302030", "#1a1020"];
  return ["#12121e", "#0a0a14"];
}

// ── Store interface ──

interface LightingStore {
  // Sun
  sun: SunState;
  setSunTime: (time: number) => void;
  setSunIntensity: (intensity: number) => void;
  setSunEnabled: (enabled: boolean) => void;

  // Ambient
  ambient: AmbientState;
  setAmbientIntensity: (intensity: number) => void;

  // Lamps
  lamps: RoomLamp[];
  addLamp: () => void;
  removeLamp: (id: string) => void;
  updateLamp: (id: string, changes: Partial<RoomLamp>) => void;

  // Presets
  preset: LightingPreset;
  applyPreset: (preset: LightingPreset) => void;
}

export const useLightingStore = create<LightingStore>((set, get) => ({
  // ── Sun defaults — noon ──
  sun: {
    timeOfDay: 12,
    intensity: 1.3,
    enabled: true,
  },

  setSunTime: (time) =>
    set((s) => ({
      sun: { ...s.sun, timeOfDay: time, intensity: getSunIntensity(time) },
      ambient: { intensity: getAmbientFromTime(time) },
      preset: "custom",
    })),

  setSunIntensity: (intensity) =>
    set((s) => ({
      sun: { ...s.sun, intensity },
      preset: "custom",
    })),

  setSunEnabled: (enabled) =>
    set((s) => ({
      sun: { ...s.sun, enabled },
      preset: "custom",
    })),

  // ── Ambient defaults ──
  ambient: { intensity: 0.5 },

  setAmbientIntensity: (intensity) =>
    set(() => ({
      ambient: { intensity },
      preset: "custom",
    })),

  // ── Lamps ──
  lamps: [],

  addLamp: () =>
    set((s) => ({
      lamps: [
        ...s.lamps,
        {
          id: uuidv4(),
          name: `Lamp ${s.lamps.length + 1}`,
          position: [0, 2.2, 0],
          intensity: 1.0,
          color: "#ffeedd",
          range: 5,
          enabled: true,
        },
      ],
    })),

  removeLamp: (id) =>
    set((s) => ({ lamps: s.lamps.filter((l) => l.id !== id) })),

  updateLamp: (id, changes) =>
    set((s) => ({
      lamps: s.lamps.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    })),

  // ── Presets ──
  preset: "day",

  applyPreset: (preset) => {
    if (preset === "day") {
      set({
        preset: "day",
        sun: { timeOfDay: 12, intensity: 1.3, enabled: true },
        ambient: { intensity: 0.5 },
      });
    } else if (preset === "night") {
      set((s) => ({
        preset: "night",
        sun: { timeOfDay: 22, intensity: 0, enabled: false },
        ambient: { intensity: 0.08 },
        lamps: s.lamps.map((l) => ({ ...l, enabled: true })),
      }));
    }
  },
}));
