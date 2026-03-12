// ============================================
// windowStore.ts — Window configuration store
// Controls window type, size, position, color
// ============================================

import { create } from "zustand";
import type { WindowConfig, WindowType } from "@/types/window";

interface WindowStore {
  config: WindowConfig;
  setType: (type: WindowType) => void;
  setWidthFraction: (v: number) => void;
  setHeight: (v: number) => void;
  setSillHeight: (v: number) => void;
  setOffsetX: (v: number) => void;
  setFrameColor: (color: string) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  config: {
    type:          "simple",
    widthFraction: 0.70,
    height:        1.60,
    sillHeight:    0.85,
    offsetX:       0,
    frameColor:    "#e8e2d8",
  },

  setType:          (type)  => set((s) => ({ config: { ...s.config, type } })),
  setWidthFraction: (v)     => set((s) => ({ config: { ...s.config, widthFraction: Math.max(0.25, Math.min(0.92, v)) } })),
  setHeight:        (v)     => set((s) => ({ config: { ...s.config, height: Math.max(0.5, Math.min(3.2, v)) } })),
  setSillHeight:    (v)     => set((s) => ({ config: { ...s.config, sillHeight: Math.max(0.1, Math.min(1.5, v)) } })),
  setOffsetX:       (v)     => set((s) => ({ config: { ...s.config, offsetX: v } })),
  setFrameColor:    (color) => set((s) => ({ config: { ...s.config, frameColor: color } })),
}));
