import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { PlacedWindow, WindowConfig, WindowType } from "@/types/window";

interface WindowStore {
  config: WindowConfig;
  placedWindows: PlacedWindow[];
  selectedPlacedWindowId: string | null;
  setType: (type: WindowType) => void;
  setWidthFraction: (v: number) => void;
  setHeight: (v: number) => void;
  setSillHeight: (v: number) => void;
  setOffsetX: (v: number) => void;
  setFrameColor: (color: string) => void;
  addPlacedWindow: (wallId: string, wallLength: number, wallHeight: number) => void;
  updatePlacedWindow: (id: string, changes: Partial<PlacedWindow>) => void;
  removePlacedWindow: (id: string) => void;
  selectPlacedWindow: (id: string | null) => void;
  clearPlacedWindows: () => void;
  prunePlacedWindows: (validWallIds: string[]) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  config: {
    type: "simple",
    widthFraction: 0.7,
    height: 1.6,
    sillHeight: 0.85,
    offsetX: 0,
    frameColor: "#e8e2d8",
  },
  placedWindows: [],
  selectedPlacedWindowId: null,

  setType: (type) => set((s) => ({ config: { ...s.config, type } })),
  setWidthFraction: (v) =>
    set((s) => ({ config: { ...s.config, widthFraction: clamp(v, 0.25, 0.92) } })),
  setHeight: (v) =>
    set((s) => ({ config: { ...s.config, height: clamp(v, 0.5, 3.2) } })),
  setSillHeight: (v) =>
    set((s) => ({ config: { ...s.config, sillHeight: clamp(v, 0.1, 1.5) } })),
  setOffsetX: (v) => set((s) => ({ config: { ...s.config, offsetX: v } })),
  setFrameColor: (color) => set((s) => ({ config: { ...s.config, frameColor: color } })),

  addPlacedWindow: (wallId, wallLength, wallHeight) => {
    const { config } = get();
    const width = clamp(wallLength * 0.38, 0.7, Math.max(0.7, wallLength - 0.4));
    const height = clamp(wallHeight * 0.42, 0.7, Math.max(0.7, wallHeight - 0.5));
    const sillHeight = clamp(0.85, 0.2, Math.max(0.2, wallHeight - height - 0.15));
    const next: PlacedWindow = {
      id: uuidv4(),
      wallId,
      type: config.type,
      width,
      height,
      sillHeight,
      offset: 0,
      frameColor: config.frameColor,
    };

    set((s) => ({
      placedWindows: [...s.placedWindows, next],
      selectedPlacedWindowId: next.id,
    }));
  },

  updatePlacedWindow: (id, changes) =>
    set((s) => ({
      placedWindows: s.placedWindows.map((window) =>
        window.id === id ? { ...window, ...changes } : window,
      ),
    })),

  removePlacedWindow: (id) =>
    set((s) => ({
      placedWindows: s.placedWindows.filter((window) => window.id !== id),
      selectedPlacedWindowId: s.selectedPlacedWindowId === id ? null : s.selectedPlacedWindowId,
    })),

  selectPlacedWindow: (id) => set({ selectedPlacedWindowId: id }),

  clearPlacedWindows: () => set({ placedWindows: [], selectedPlacedWindowId: null }),

  prunePlacedWindows: (validWallIds) =>
    set((s) => {
      const validIds = new Set(validWallIds);
      const placedWindows = s.placedWindows.filter((window) => validIds.has(window.wallId));
      const selectedPlacedWindowId =
        s.selectedPlacedWindowId && placedWindows.some((window) => window.id === s.selectedPlacedWindowId)
          ? s.selectedPlacedWindowId
          : null;
      return { placedWindows, selectedPlacedWindowId };
    }),
}));
