// ============================================
// Zustand store — single source of truth
// Manages room dimensions, furniture list,
// selected furniture, and view mode.
// Persists layout to localStorage.
// ============================================

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { generateApartmentLayout, normalizeWall } from "@/lib/apartmentLayout";
import { useDoorStore } from "@/store/doorStore";
import { useWindowStore } from "@/store/windowStore";
import type { ApartmentType, RoomZone, WallItem } from "@/types/apartment";
import type {
  FurnitureItem,
  RoomDimensions,
  ViewMode,
  FurnitureFormData,
} from "@/types/furniture";

export type AppState = "intro" | "generator" | "planner";

// ---- localStorage helpers ----

const STORAGE_KEY = "insideroom-v2-layout";

interface PersistedState {
  apartmentType: ApartmentType;
  room: RoomDimensions;
  rooms: RoomZone[];
  walls: WallItem[];
  furniture: FurnitureItem[];
}

function loadFromStorage(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveToStorage(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded – silently ignore
  }
}

// ---- Store interface ----

interface RoomStore {
  // App state
  appState: AppState;
  setAppState: (state: AppState) => void;

  // Apartment
  apartmentType: ApartmentType;
  rooms: RoomZone[];
  walls: WallItem[];
  generateApartment: (type: ApartmentType) => void;

  // Room
  room: RoomDimensions;
  setRoom: (dims: Partial<RoomDimensions>) => void;

  // Walls
  addWall: () => void;
  updateWall: (id: string, changes: Partial<WallItem>) => void;
  removeWall: (id: string) => void;

  // Furniture
  furniture: FurnitureItem[];
  addFurniture: (data: FurnitureFormData) => void;
  removeFurniture: (id: string) => void;
  updateFurniture: (id: string, changes: Partial<FurnitureItem>) => void;

  // Selection
  selectedId: string | null;
  selectFurniture: (id: string | null) => void;
  selectedWallId: string | null;
  selectWall: (id: string | null) => void;

  // View
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // Persistence
  resetRoom: () => void;
  hydrate: () => void;
}

const DEFAULT_LAYOUT = generateApartmentLayout("empty-space");

function persistState(state: Pick<RoomStore, "apartmentType" | "room" | "rooms" | "walls" | "furniture">) {
  saveToStorage({
    apartmentType: state.apartmentType,
    room: state.room,
    rooms: state.rooms,
    walls: state.walls,
    furniture: state.furniture,
  });
}

// ---- Store creation ----

export const useRoomStore = create<RoomStore>((set, get) => ({
  // ---------- App State ----------
  appState: "intro",
  setAppState: (state) => set({ appState: state }),

  // ---------- Apartment ----------
  apartmentType: DEFAULT_LAYOUT.type,
  rooms: DEFAULT_LAYOUT.rooms,
  walls: DEFAULT_LAYOUT.walls,

  generateApartment: (type) => {
    const layout = generateApartmentLayout(type);
    useDoorStore.getState().clearPlacedDoors();
    useWindowStore.getState().clearPlacedWindows();
    const next = {
      apartmentType: layout.type,
      room: layout.room,
      rooms: layout.rooms,
      walls: layout.walls,
      furniture: layout.furniture,
      selectedId: null,
      selectedWallId: null,
      viewMode: "3d" as ViewMode,
    };
    persistState({
      apartmentType: next.apartmentType,
      room: next.room,
      rooms: next.rooms,
      walls: next.walls,
      furniture: next.furniture,
    });
    set(next);
  },

  // ---------- Room ----------
  room: { ...DEFAULT_LAYOUT.room },

  setRoom: (dims) => {
    set((s) => {
      const room = { ...s.room, ...dims };
      const walls = s.walls.map((wall) => normalizeWall({
        ...wall,
        height: dims.height ?? wall.height,
      }, room));
      persistState({ apartmentType: s.apartmentType, room, rooms: s.rooms, walls, furniture: s.furniture });
      return { room, walls };
    });
  },

  // ---------- Walls ----------
  addWall: () => {
    set((s) => {
      const wall = normalizeWall({
        id: uuidv4(),
        kind: "partition",
        position: [0, s.room.height / 2, 0],
        length: 2.5,
        rotation: 0,
        height: s.room.height,
        thickness: 0.14,
        snap: 0.25,
      }, s.room);
      const walls = [...s.walls, wall];
      persistState({ apartmentType: s.apartmentType, room: s.room, rooms: s.rooms, walls, furniture: s.furniture });
      return { walls, selectedWallId: wall.id, selectedId: null };
    });
  },

  updateWall: (id, changes) => {
    set((s) => {
      const walls = s.walls.map((wall) => {
        if (wall.id !== id) return wall;
        return normalizeWall({ ...wall, ...changes }, s.room);
      });
      persistState({ apartmentType: s.apartmentType, room: s.room, rooms: s.rooms, walls, furniture: s.furniture });
      return { walls };
    });
  },

  removeWall: (id) => {
    set((s) => {
      const walls = s.walls.filter((wall) => wall.id !== id);
      useDoorStore.getState().prunePlacedDoors(walls.map((wall) => wall.id));
      useWindowStore.getState().prunePlacedWindows(walls.map((wall) => wall.id));
      persistState({ apartmentType: s.apartmentType, room: s.room, rooms: s.rooms, walls, furniture: s.furniture });
      return { walls, selectedWallId: s.selectedWallId === id ? null : s.selectedWallId };
    });
  },

  // ---------- Furniture ----------
  furniture: [],

  addFurniture: (data) => {
    const item: FurnitureItem = {
      id: uuidv4(),
      name: data.name,
      // Convert cm → meters for the 3D scene
      width: data.width / 100,
      height: data.height / 100,
      depth: data.depth / 100,
      position: [0, (data.height / 100) / 2, 0], // placed on the floor
      rotation: 0,
      color: data.color,
      imageUrl: data.imageUrl,
    };
    set((s) => {
      const furniture = [...s.furniture, item];
      persistState({ apartmentType: s.apartmentType, room: s.room, rooms: s.rooms, walls: s.walls, furniture });
      return { furniture };
    });
  },

  removeFurniture: (id) => {
    set((s) => {
      const furniture = s.furniture.filter((f) => f.id !== id);
      persistState({ apartmentType: s.apartmentType, room: s.room, rooms: s.rooms, walls: s.walls, furniture });
      return { furniture, selectedId: s.selectedId === id ? null : s.selectedId };
    });
  },

  updateFurniture: (id, changes) => {
    set((s) => {
      const furniture = s.furniture.map((f) =>
        f.id === id ? { ...f, ...changes } : f
      );
      persistState({ apartmentType: s.apartmentType, room: s.room, rooms: s.rooms, walls: s.walls, furniture });
      return { furniture };
    });
  },

  // ---------- Selection ----------
  selectedId: null,
  selectFurniture: (id) => set({ selectedId: id, selectedWallId: id ? null : get().selectedWallId }),
  selectedWallId: null,
  selectWall: (id) => set({ selectedWallId: id, selectedId: id ? null : get().selectedId }),

  // ---------- View ----------
  viewMode: "3d",
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((s) => ({ viewMode: s.viewMode === "3d" ? "2d" : "3d" })),

  // ---------- Persistence ----------
  resetRoom: () => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    useDoorStore.getState().clearPlacedDoors();
    useWindowStore.getState().clearPlacedWindows();
    const layout = generateApartmentLayout(get().apartmentType);
    set({
      room: { ...layout.room },
      rooms: layout.rooms,
      walls: layout.walls,
      furniture: layout.furniture,
      selectedId: null,
      selectedWallId: null,
      viewMode: "3d",
    });
  },

  hydrate: () => {
    // Remove stale v1 data
    if (typeof window !== "undefined") {
      localStorage.removeItem("room-planner-layout");
      localStorage.removeItem("insideroom-layout");
    }
    const saved = loadFromStorage();
    useDoorStore.getState().clearPlacedDoors();
    useWindowStore.getState().clearPlacedWindows();
    if (saved) {
      const layout = generateApartmentLayout(saved.apartmentType ?? DEFAULT_LAYOUT.type);
      set({
        apartmentType: saved.apartmentType ?? layout.type,
        room: saved.room ?? layout.room,
        rooms: saved.rooms ?? layout.rooms,
        walls: saved.walls?.length ? saved.walls : layout.walls,
        furniture: saved.furniture ?? [],
      });
    }
  },
}));
