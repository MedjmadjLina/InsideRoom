// ============================================
// Types for the InsideRoom application
// ============================================

/** Represents a single piece of furniture in the room */
export interface FurnitureItem {
  /** Unique identifier */
  id: string;
  /** Display name (e.g. "Desk", "Bed") */
  name: string;
  /** Width in centimeters */
  width: number;
  /** Height in centimeters */
  height: number;
  /** Depth in centimeters */
  depth: number;
  /** Position in the room [x, y, z] in meters */
  position: [number, number, number];
  /** Rotation around Y axis in degrees */
  rotation: number;
  /** Floor level for stacked layouts such as duplexes */
  level?: 0 | 1;
  /** Color of the furniture box */
  color: string;
  /** Optional image URL (user-uploaded texture) */
  imageUrl?: string;
}

/** Room dimensions in meters */
export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
}

/** View mode: 3D perspective or 2D top-down */
export type ViewMode = "3d" | "2d";

/** Form data for creating a new furniture item (before id generation) */
export interface FurnitureFormData {
  name: string;
  width: number;
  height: number;
  depth: number;
  color: string;
  imageUrl?: string;
}
