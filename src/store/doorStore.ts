import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { DoorType, PlacedDoor } from "@/types/door";

interface DoorStore {
  placedDoors: PlacedDoor[];
  selectedPlacedDoorId: string | null;
  addPlacedDoor: (wallId: string, wallLength: number, wallHeight: number) => void;
  updatePlacedDoor: (id: string, changes: Partial<PlacedDoor>) => void;
  removePlacedDoor: (id: string) => void;
  selectPlacedDoor: (id: string | null) => void;
  clearPlacedDoors: () => void;
  prunePlacedDoors: (validWallIds: string[]) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const DEFAULT_DOOR_TYPE: DoorType = "swing";

export const useDoorStore = create<DoorStore>((set) => ({
  placedDoors: [],
  selectedPlacedDoorId: null,

  addPlacedDoor: (wallId, wallLength, wallHeight) => {
    const width = clamp(wallLength * 0.22, 0.8, Math.max(0.8, wallLength - 0.35));
    const height = clamp(wallHeight * 0.72, 1.95, Math.max(1.95, wallHeight - 0.15));
    const next: PlacedDoor = {
      id: uuidv4(),
      wallId,
      type: DEFAULT_DOOR_TYPE,
      width,
      height,
      offset: 0,
      color: "#7a5a43",
    };

    set((s) => ({
      placedDoors: [...s.placedDoors, next],
      selectedPlacedDoorId: next.id,
    }));
  },

  updatePlacedDoor: (id, changes) =>
    set((s) => ({
      placedDoors: s.placedDoors.map((door) => (door.id === id ? { ...door, ...changes } : door)),
    })),

  removePlacedDoor: (id) =>
    set((s) => ({
      placedDoors: s.placedDoors.filter((door) => door.id !== id),
      selectedPlacedDoorId: s.selectedPlacedDoorId === id ? null : s.selectedPlacedDoorId,
    })),

  selectPlacedDoor: (id) => set({ selectedPlacedDoorId: id }),

  clearPlacedDoors: () => set({ placedDoors: [], selectedPlacedDoorId: null }),

  prunePlacedDoors: (validWallIds) =>
    set((s) => {
      const validIds = new Set(validWallIds);
      const placedDoors = s.placedDoors.filter((door) => validIds.has(door.wallId));
      const selectedPlacedDoorId =
        s.selectedPlacedDoorId && placedDoors.some((door) => door.id === s.selectedPlacedDoorId)
          ? s.selectedPlacedDoorId
          : null;
      return { placedDoors, selectedPlacedDoorId };
    }),
}));
