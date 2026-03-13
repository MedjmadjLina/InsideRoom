import type { FurnitureItem, RoomDimensions } from "@/types/furniture";

export type ApartmentType =
  | "empty-space"
  | "studio"
  | "duplex"
  | "two-room"
  | "three-room"
  | "four-room"
  | "loft";

export type RoomKind =
  | "empty"
  | "entrance"
  | "hallway"
  | "living-room"
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "mezzanine"
  | "loft-space";

export interface RoomZone {
  id: string;
  kind: RoomKind;
  label: string;
  center: [number, number];
  size: [number, number];
  color: string;
  level?: 0 | 1;
}

export interface WallItem {
  id: string;
  kind: "exterior" | "partition";
  position: [number, number, number];
  length: number;
  rotation: number;
  height: number;
  thickness: number;
  snap: number;
  level?: 0 | 1;
  locked?: boolean;
}

export interface ApartmentLayout {
  type: ApartmentType;
  name: string;
  room: RoomDimensions;
  rooms: RoomZone[];
  walls: WallItem[];
  furniture: FurnitureItem[];
}
