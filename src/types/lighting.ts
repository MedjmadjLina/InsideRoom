// ============================================
// Types for the Phase 2 lighting system
// ============================================

/** Time of day expressed as a float 0–24 */
export type TimeOfDay = number;

/** Sun lighting state derived from time-of-day */
export interface SunState {
  /** Time of day 0–24 */
  timeOfDay: TimeOfDay;
  /** Sun intensity multiplier 0–1.5 */
  intensity: number;
  /** Whether the sun is enabled */
  enabled: boolean;
}

/** A user-placed room lamp (point light) */
export interface RoomLamp {
  id: string;
  name: string;
  /** Position in the room [x, y, z] meters */
  position: [number, number, number];
  /** Light intensity */
  intensity: number;
  /** Light color hex */
  color: string;
  /** Range / distance of the light */
  range: number;
  /** Whether this lamp is currently on */
  enabled: boolean;
}

/** Ambient lighting controls */
export interface AmbientState {
  /** Ambient brightness 0–1 */
  intensity: number;
}

/** Night mode preset flag */
export type LightingPreset = "day" | "night" | "custom";
