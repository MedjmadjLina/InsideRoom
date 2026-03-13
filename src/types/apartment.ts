import type { FurnitureItem, RoomDimensions } from "@/types/furniture";

export type ApartmentType =
  | "empty-space"
  | "studio"
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
  | "loft-space";

export interface RoomZone {
  id: string;
  kind: RoomKind;
  label: string;
  center: [number, number];
  size: [number, number];
  color: string;
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
