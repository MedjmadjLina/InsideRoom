export type DoorType = "swing" | "double" | "arched";

export interface PlacedDoor {
  id: string;
  wallId: string;
  type: DoorType;
  width: number;
  height: number;
  offset: number;
  color: string;
}
