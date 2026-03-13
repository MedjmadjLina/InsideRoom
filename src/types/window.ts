// ============================================
// Types — Window system
// ============================================

export type WindowType =
  | "simple"          // single rectangular window with cross mullion
  | "bay"             // large bay window with angled side panels
  | "double-vertical" // two tall narrow windows side by side
  | "arched"          // rectangular base + semicircular arch top
  | "loft";           // industrial steel grid (4×3 panes)

export interface WindowConfig {
  /** Style of window frame geometry */
  type: WindowType;
  /** Width as a fraction of the wall width (0.25 – 0.92) */
  widthFraction: number;
  /** Opening height in meters (0.5 – 3.2) */
  height: number;
  /** Height of the sill from the floor in meters (0.1 – 1.5) */
  sillHeight: number;
  /** Horizontal offset from center of wall in meters */
  offsetX: number;
  /** Frame color (hex) */
  frameColor: string;
}

export interface PlacedWindow {
  id: string;
  wallId: string;
  type: WindowType;
  /** Absolute width in meters for non-facade walls */
  width: number;
  /** Opening height in meters */
  height: number;
  /** Height of the sill from the floor in meters */
  sillHeight: number;
  /** Horizontal offset along the wall from its center */
  offset: number;
  /** Frame color (hex) */
  frameColor: string;
}
