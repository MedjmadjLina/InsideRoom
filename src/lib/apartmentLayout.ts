import type { RoomDimensions } from "@/types/furniture";
import type { ApartmentLayout, ApartmentType, RoomKind, RoomZone, WallItem } from "@/types/apartment";

export const GRID_SIZE = 0.25;
export const DEFAULT_WALL_THICKNESS = 0.14;
export const EXTERIOR_WALL_THICKNESS = 0.22;
const ROTATION_STEP = 5;

type RoomRect = {
  id: string;
  kind: RoomKind;
  label: string;
  x1: number;
  x2: number;
  z1: number;
  z2: number;
  color: string;
};

type TemplateDefinition = {
  type: ApartmentType;
  name: string;
  room: RoomDimensions;
  rooms: RoomRect[];
};

type Edge = {
  orientation: "horizontal" | "vertical";
  line: number;
  start: number;
  end: number;
  kind: "exterior" | "partition";
};

function rect(
  id: string,
  kind: RoomKind,
  label: string,
  x1: number,
  x2: number,
  z1: number,
  z2: number,
  color: string,
): RoomRect {
  return { id, kind, label, x1, x2, z1, z2, color };
}

function roundCoord(value: number) {
  return Number(value.toFixed(4));
}

export function snapToGrid(value: number, step = GRID_SIZE) {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getWallHalfExtents(length: number, thickness: number, rotation: number) {
  const rad = (rotation * Math.PI) / 180;
  const halfX = Math.abs(Math.cos(rad)) * (length / 2) + Math.abs(Math.sin(rad)) * (thickness / 2);
  const halfZ = Math.abs(Math.sin(rad)) * (length / 2) + Math.abs(Math.cos(rad)) * (thickness / 2);
  return { halfX, halfZ };
}

export function normalizeWall(wall: WallItem, room: RoomDimensions): WallItem {
  const rotation = snapToGrid(wall.rotation, ROTATION_STEP);
  const length = Math.max(GRID_SIZE, snapToGrid(wall.length));
  const height = Math.max(2.2, snapToGrid(wall.height, 0.05));
  const thickness = Math.max(0.08, snapToGrid(wall.thickness, 0.02));
  const { halfX, halfZ } = getWallHalfExtents(length, thickness, rotation);
  const minX = -room.width / 2 + halfX;
  const maxX = room.width / 2 - halfX;
  const minZ = -room.length / 2 + halfZ;
  const maxZ = room.length / 2 - halfZ;

  const x = clamp(snapToGrid(wall.position[0]), minX, maxX);
  const z = clamp(snapToGrid(wall.position[2]), minZ, maxZ);

  return {
    ...wall,
    rotation,
    length,
    height,
    thickness,
    position: [x, height / 2, z],
  };
}

function buildRoomZone(room: RoomRect): RoomZone {
  return {
    id: room.id,
    kind: room.kind,
    label: room.label,
    center: [roundCoord((room.x1 + room.x2) / 2), roundCoord((room.z1 + room.z2) / 2)],
    size: [roundCoord(room.x2 - room.x1), roundCoord(room.z2 - room.z1)],
    color: room.color,
  };
}

function collectEdges(rooms: RoomRect[], room: RoomDimensions) {
  const halfW = room.width / 2;
  const halfL = room.length / 2;
  const edgeMap = new Map<string, Edge & { count: number }>();

  const pushEdge = (edge: Edge) => {
    const key = `${edge.orientation}:${roundCoord(edge.line)}:${roundCoord(edge.start)}:${roundCoord(edge.end)}`;
    const existing = edgeMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.kind = edge.kind === "exterior" ? "exterior" : existing.kind;
      return;
    }
    edgeMap.set(key, { ...edge, count: 1 });
  };

  for (const roomRect of rooms) {
    const edges: Edge[] = [
      {
        orientation: "horizontal",
        line: roomRect.z1,
        start: roomRect.x1,
        end: roomRect.x2,
        kind: roundCoord(roomRect.z1) === roundCoord(-halfL) ? "exterior" : "partition",
      },
      {
        orientation: "horizontal",
        line: roomRect.z2,
        start: roomRect.x1,
        end: roomRect.x2,
        kind: roundCoord(roomRect.z2) === roundCoord(halfL) ? "exterior" : "partition",
      },
      {
        orientation: "vertical",
        line: roomRect.x1,
        start: roomRect.z1,
        end: roomRect.z2,
        kind: roundCoord(roomRect.x1) === roundCoord(-halfW) ? "exterior" : "partition",
      },
      {
        orientation: "vertical",
        line: roomRect.x2,
        start: roomRect.z1,
        end: roomRect.z2,
        kind: roundCoord(roomRect.x2) === roundCoord(halfW) ? "exterior" : "partition",
      },
    ];

    edges.forEach(pushEdge);
  }

  return Array.from(edgeMap.values()).filter((edge) => edge.kind === "exterior" || edge.count > 1);
}

function mergeEdges(edges: Array<Edge & { count: number }>) {
  const buckets = new Map<string, Edge[]>();

  edges.forEach((edge) => {
    const key = `${edge.kind}:${edge.orientation}:${roundCoord(edge.line)}`;
    const list = buckets.get(key) ?? [];
    list.push(edge);
    buckets.set(key, list);
  });

  const merged: Edge[] = [];

  for (const [key, list] of buckets) {
    const [kind, orientation, line] = key.split(":") as ["exterior" | "partition", "horizontal" | "vertical", string];
    const sorted = list
      .map((item) => ({ ...item, start: Math.min(item.start, item.end), end: Math.max(item.start, item.end) }))
      .sort((a, b) => a.start - b.start);

    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i += 1) {
      const next = sorted[i];
      if (next.start <= current.end + 0.001) {
        current.end = Math.max(current.end, next.end);
      } else {
        merged.push({ orientation, line: Number(line), start: current.start, end: current.end, kind });
        current = { ...next };
      }
    }

    merged.push({ orientation, line: Number(line), start: current.start, end: current.end, kind });
  }

  return merged;
}

function edgeToWall(edge: Edge, room: RoomDimensions): WallItem {
  const length = roundCoord(edge.end - edge.start);
  const center = roundCoord((edge.start + edge.end) / 2);
  const id = `${edge.kind}-${edge.orientation}-${roundCoord(edge.line)}-${roundCoord(edge.start)}-${roundCoord(edge.end)}`;

  if (edge.orientation === "horizontal") {
    return normalizeWall(
      {
        id,
        kind: edge.kind,
        position: [center, room.height / 2, edge.line],
        length,
        rotation: 0,
        height: room.height,
        thickness: edge.kind === "exterior" ? EXTERIOR_WALL_THICKNESS : DEFAULT_WALL_THICKNESS,
        snap: GRID_SIZE,
        locked: edge.kind === "exterior",
      },
      room,
    );
  }

  return normalizeWall(
    {
      id,
      kind: edge.kind,
      position: [edge.line, room.height / 2, center],
      length,
      rotation: 90,
      height: room.height,
      thickness: edge.kind === "exterior" ? EXTERIOR_WALL_THICKNESS : DEFAULT_WALL_THICKNESS,
      snap: GRID_SIZE,
      locked: edge.kind === "exterior",
    },
    room,
  );
}

function createWalls(template: TemplateDefinition) {
  const rawEdges = collectEdges(template.rooms, template.room);
  const mergedEdges = mergeEdges(rawEdges);
  return mergedEdges.map((edge) => edgeToWall(edge, template.room));
}

const templates: Record<ApartmentType, TemplateDefinition> = {
  "empty-space": {
    type: "empty-space",
    name: "Empty space",
    room: { width: 8, length: 5.5, height: 3 },
    rooms: [
      rect("open-space", "empty", "Open space", -4, 4, -2.75, 2.75, "#ebe2d6"),
    ],
  },
  studio: {
    type: "studio",
    name: "Studio",
    room: { width: 7.5, length: 5.2, height: 3 },
    rooms: [
      rect("studio-main", "living-room", "Living / sleeping", -3.75, 1.35, -2.6, 0.4, "#d9e5ea"),
      rect("studio-kitchen", "kitchen", "Kitchen", 1.35, 3.75, -2.6, 0.4, "#e7ddd0"),
      rect("studio-entrance", "entrance", "Entrance", -3.75, -1.2, 0.4, 2.6, "#e8dfd4"),
      rect("studio-alcove", "hallway", "Alcove", -1.2, 1.35, 0.4, 2.6, "#e4ddd7"),
      rect("studio-bathroom", "bathroom", "Bathroom", 1.35, 3.75, 0.4, 2.6, "#dbe2ef"),
    ],
  },
  "two-room": {
    type: "two-room",
    name: "2-room apartment",
    room: { width: 7.8, length: 5.4, height: 3 },
    rooms: [
      rect("two-living", "living-room", "Living room", -3.9, 0.9, -2.7, 0.5, "#d9e5ea"),
      rect("two-bedroom", "bedroom", "Bedroom", 0.9, 3.9, -2.7, 0.5, "#eadce6"),
      rect("two-entrance", "entrance", "Entrance", -3.9, -1.3, 0.5, 2.7, "#e7ddd2"),
      rect("two-bathroom", "bathroom", "Bathroom", -1.3, 0.9, 0.5, 2.7, "#dbe2ef"),
      rect("two-kitchen", "kitchen", "Kitchen", 0.9, 3.9, 0.5, 2.7, "#e8ded2"),
    ],
  },
  "three-room": {
    type: "three-room",
    name: "3-room apartment",
    room: { width: 8.6, length: 5.6, height: 3 },
    rooms: [
      rect("three-living", "living-room", "Living room", -4.3, 0.7, -2.8, 0.1, "#d9e5ea"),
      rect("three-kitchen", "kitchen", "Kitchen", 0.7, 4.3, -2.8, 0.1, "#e7ddd0"),
      rect("three-entrance", "entrance", "Entrance", -4.3, -1.6, 0.1, 2.8, "#e8dfd4"),
      rect("three-bathroom", "bathroom", "Bathroom", -1.6, 0.7, 0.1, 2.8, "#dbe2ef"),
      rect("three-bedroom", "bedroom", "Bedroom", 0.7, 4.3, 0.1, 2.8, "#eadce6"),
    ],
  },
  "four-room": {
    type: "four-room",
    name: "4-room apartment",
    room: { width: 9.8, length: 6, height: 3.1 },
    rooms: [
      rect("four-living", "living-room", "Living room", -4.9, 0.5, -3, 0, "#d9e5ea"),
      rect("four-kitchen", "kitchen", "Kitchen", 0.5, 4.9, -3, 0, "#e7ddd0"),
      rect("four-entrance", "entrance", "Entrance / hallway", -4.9, -1.9, 0, 3, "#e8dfd4"),
      rect("four-bathroom", "bathroom", "Bathroom", -1.9, 0.3, 0, 3, "#dbe2ef"),
      rect("four-bedroom-a", "bedroom", "Bedroom 01", 0.3, 2.6, 0, 3, "#eadce6"),
      rect("four-bedroom-b", "bedroom", "Bedroom 02", 2.6, 4.9, 0, 3, "#efe0e8"),
    ],
  },
  loft: {
    type: "loft",
    name: "Loft",
    room: { width: 10.2, length: 6.6, height: 3.2 },
    rooms: [
      rect("loft-main", "loft-space", "Loft living", -5.1, 1.6, -3.3, 0.9, "#d9e5ea"),
      rect("loft-kitchen", "kitchen", "Kitchen", 1.6, 5.1, -3.3, 0.9, "#e7ddd0"),
      rect("loft-entrance", "entrance", "Entrance", -5.1, -2.4, 0.9, 3.3, "#e8dfd4"),
      rect("loft-bathroom", "bathroom", "Bathroom", -2.4, 0.2, 0.9, 3.3, "#dbe2ef"),
      rect("loft-bedroom", "bedroom", "Bedroom", 0.2, 5.1, 0.9, 3.3, "#eadce6"),
    ],
  },
};

export function getApartmentTemplate(type: ApartmentType) {
  return templates[type];
}

export function getApartmentTypeLabel(type: ApartmentType) {
  return templates[type].name;
}

export function generateApartmentLayout(type: ApartmentType): ApartmentLayout {
  const template = templates[type];
  return {
    type: template.type,
    name: template.name,
    room: template.room,
    rooms: template.rooms.map(buildRoomZone),
    walls: createWalls(template),
  };
}
