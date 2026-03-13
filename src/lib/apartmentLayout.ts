import type { FurnitureItem, RoomDimensions } from "@/types/furniture";
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
  furniture: FurnitureItem[];
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

function item(
  id: string,
  name: string,
  width: number,
  height: number,
  depth: number,
  position: [number, number, number],
  rotation: number,
  color: string,
): FurnitureItem {
  return { id, name, width, height, depth, position, rotation, color };
}

function pendant(id: string, x: number, z: number, roomHeight: number, color = "#d9c1a3") {
  const height = 1.2;
  return item(id, "Pendant Lamp", 0.45, height, 0.45, [x, roomHeight - height / 2 - 0.03, z], 0, color);
}

function createDefaultFurniture(type: ApartmentType, room: RoomDimensions): FurnitureItem[] {
  const h = room.height;

  switch (type) {
    case "empty-space":
      return [
        item("empty-sofa", "Sofa", 2.25, 0.9, 0.95, [-1.7, 0.45, 0.9], 20, "#cab7a7"),
        item("empty-desk", "Desk", 1.6, 0.76, 0.7, [2.25, 0.38, 1.35], 0, "#b79063"),
        item("empty-chair", "Chair", 0.5, 0.86, 0.5, [2.25, 0.43, 0.35], 180, "#d7d4cf"),
        item("empty-shelf", "Shelf", 1.1, 1.85, 0.38, [3.35, 0.925, 1.55], 0, "#7a6048"),
        item("empty-floorlamp", "Floor Lamp", 0.4, 1.7, 0.4, [-3.2, 0.85, 1.75], 0, "#d8ccb8"),
        pendant("empty-pendant", -0.25, -0.3, h),
      ];
    case "studio":
      return [
        item("studio-sofa", "Sofa", 2.2, 0.9, 0.95, [-2.15, 0.45, -0.85], 0, "#b7a79b"),
        item("studio-desk", "Desk", 1.35, 0.76, 0.65, [-2.85, 0.38, 1.55], 90, "#ad8154"),
        item("studio-chair", "Chair", 0.5, 0.86, 0.5, [-2.15, 0.43, 1.55], 270, "#d4d0ca"),
        item("studio-bed", "Bed", 1.55, 0.62, 2.05, [0.1, 0.31, 1.45], 90, "#d8c8bd"),
        item("studio-shelf", "Shelf", 1.0, 1.85, 0.36, [3.2, 0.925, 1.35], 180, "#7b624d"),
        item("studio-kitchen-run", "Kitchen island", 2.05, 0.92, 0.72, [2.45, 0.46, -1.45], 0, "#c5b3a0"),
        item("studio-bath-vanity", "Bathroom vanity", 0.9, 0.86, 0.48, [2.65, 0.43, 1.9], 0, "#ece7df"),
        item("studio-floorlamp", "Floor Lamp", 0.4, 1.7, 0.4, [-3.35, 0.85, -1.7], 0, "#d8ccb8"),
        pendant("studio-pendant", -0.75, -0.7, h),
      ];
    case "two-room":
      return [
        item("two-sofa", "Sofa", 2.45, 0.92, 0.98, [-2.25, 0.46, -1.1], 0, "#b7a79b"),
        item("two-coffee", "Coffee table", 1.0, 0.36, 0.55, [-2.1, 0.18, -0.1], 0, "#9c7753"),
        item("two-tv-console", "Shelf", 1.4, 0.7, 0.38, [-0.75, 0.35, -1.55], 90, "#6f5844"),
        item("two-bed", "Bed", 1.7, 0.62, 2.1, [2.35, 0.31, -0.85], 0, "#dbcac0"),
        item("two-bedside", "Bedside Lamp", 0.32, 0.5, 0.32, [3.2, 0.25, -1.55], 0, "#dbc6a2"),
        item("two-kitchen-run", "Kitchen island", 2.35, 0.92, 0.76, [2.4, 0.46, 1.55], 0, "#c9b49f"),
        item("two-dining", "Desk", 1.4, 0.76, 0.8, [1.25, 0.38, 1.55], 0, "#b28960"),
        item("two-chair-a", "Chair", 0.5, 0.86, 0.5, [0.8, 0.43, 0.92], 0, "#d8d4cf"),
        item("two-chair-b", "Chair", 0.5, 0.86, 0.5, [1.7, 0.43, 0.92], 0, "#d8d4cf"),
        item("two-bath-vanity", "Bathroom vanity", 0.95, 0.86, 0.5, [-0.2, 0.43, 1.95], 0, "#eee8df"),
        item("two-floorlamp", "Floor Lamp", 0.4, 1.7, 0.4, [-3.45, 0.85, -1.85], 0, "#d8ccb8"),
        pendant("two-pendant", -2.0, -0.5, h),
        pendant("two-pendant-b", 1.95, 1.4, h, "#e0c7aa"),
      ];
    case "three-room":
      return [
        item("three-sofa", "Sofa", 2.55, 0.94, 1.0, [-2.6, 0.47, -1.15], 0, "#baa89d"),
        item("three-tv-console", "Shelf", 1.5, 0.7, 0.38, [-0.35, 0.35, -1.65], 90, "#735d48"),
        item("three-floorlamp", "Floor Lamp", 0.4, 1.7, 0.4, [-4.0, 0.85, -1.8], 0, "#d8ccb8"),
        item("three-kitchen-run", "Kitchen island", 2.55, 0.92, 0.8, [2.65, 0.46, -1.4], 0, "#c7b19c"),
        item("three-dining", "Desk", 1.55, 0.76, 0.82, [2.05, 0.38, -0.2], 0, "#b1875d"),
        item("three-chair-a", "Chair", 0.5, 0.86, 0.5, [1.5, 0.43, 0.45], 180, "#d8d4cf"),
        item("three-chair-b", "Chair", 0.5, 0.86, 0.5, [2.6, 0.43, 0.45], 180, "#d8d4cf"),
        item("three-bed", "Bed", 1.7, 0.62, 2.1, [2.75, 0.31, 1.65], 0, "#dbc9bf"),
        item("three-desk", "Desk", 1.35, 0.76, 0.68, [1.3, 0.38, 1.75], 0, "#af8356"),
        item("three-bath-vanity", "Bathroom vanity", 1.0, 0.86, 0.5, [-0.35, 0.43, 2.05], 0, "#efeae1"),
        pendant("three-pendant", -2.25, -0.75, h),
        pendant("three-pendant-b", 2.55, -1.55, h, "#e0c7aa"),
      ];
    case "four-room":
      return [
        item("four-sofa", "Sofa", 2.7, 0.96, 1.05, [-2.95, 0.48, -1.2], 0, "#b9a69b"),
        item("four-tv-console", "Shelf", 1.65, 0.72, 0.4, [-0.45, 0.36, -1.75], 90, "#6f5844"),
        item("four-floorlamp", "Floor Lamp", 0.4, 1.7, 0.4, [-4.5, 0.85, -2.0], 0, "#d8ccb8"),
        item("four-kitchen-run", "Kitchen island", 2.7, 0.94, 0.82, [2.85, 0.47, -1.55], 0, "#ccb6a2"),
        item("four-dining", "Desk", 1.7, 0.76, 0.84, [1.75, 0.38, -0.15], 0, "#af8356"),
        item("four-chair-a", "Chair", 0.5, 0.86, 0.5, [1.1, 0.43, 0.55], 180, "#d8d4cf"),
        item("four-chair-b", "Chair", 0.5, 0.86, 0.5, [2.4, 0.43, 0.55], 180, "#d8d4cf"),
        item("four-bed-a", "Bed", 1.45, 0.6, 2.0, [1.4, 0.3, 1.75], 0, "#dbc9bf"),
        item("four-bed-b", "Bed", 1.45, 0.6, 2.0, [3.65, 0.3, 1.75], 0, "#d9c5d1"),
        item("four-bath-vanity", "Bathroom vanity", 1.0, 0.86, 0.5, [-0.8, 0.43, 2.2], 0, "#efeae1"),
        pendant("four-pendant", -2.6, -0.8, h),
        pendant("four-pendant-b", 2.9, -1.55, h, "#e0c7aa"),
      ];
    case "loft":
      return [
        item("loft-sofa", "Sofa", 3.0, 0.96, 1.08, [-2.8, 0.48, -1.4], 10, "#b6a397"),
        item("loft-floorlamp", "Floor Lamp", 0.4, 1.7, 0.4, [-4.6, 0.85, -2.35], 0, "#d8ccb8"),
        item("loft-shelf", "Shelf", 1.4, 1.95, 0.38, [-4.35, 0.975, 1.8], 90, "#735d48"),
        item("loft-kitchen-run", "Kitchen island", 2.9, 0.94, 0.84, [3.15, 0.47, -1.55], 0, "#cbb59f"),
        item("loft-dining", "Desk", 1.9, 0.76, 0.86, [2.4, 0.38, 0.0], 0, "#b18860"),
        item("loft-chair-a", "Chair", 0.5, 0.86, 0.5, [1.7, 0.43, 0.75], 180, "#d8d4cf"),
        item("loft-chair-b", "Chair", 0.5, 0.86, 0.5, [3.1, 0.43, 0.75], 180, "#d8d4cf"),
        item("loft-bed", "Bed", 1.8, 0.62, 2.15, [3.1, 0.31, 2.0], 0, "#dccbc2"),
        item("loft-desk", "Desk", 1.5, 0.76, 0.72, [0.95, 0.38, 2.15], 0, "#af8356"),
        item("loft-bath-vanity", "Bathroom vanity", 1.05, 0.86, 0.52, [-0.95, 0.43, 2.35], 0, "#efeae1"),
        pendant("loft-pendant", -2.0, -1.2, h),
        pendant("loft-pendant-b", 3.0, -1.7, h, "#e0c7aa"),
      ];
    default:
      return [];
  }
}

function scaleRooms(rooms: RoomRect[], scaleX: number, scaleZ: number) {
  return rooms.map((room) => ({
    ...room,
    x1: roundCoord(room.x1 * scaleX),
    x2: roundCoord(room.x2 * scaleX),
    z1: roundCoord(room.z1 * scaleZ),
    z2: roundCoord(room.z2 * scaleZ),
  }));
}

function makeTemplate(
  type: ApartmentType,
  name: string,
  room: RoomDimensions,
  rooms: RoomRect[],
  scaleX = 1,
  scaleZ = 1,
): TemplateDefinition {
  const scaledRoom: RoomDimensions = {
    width: roundCoord(room.width * scaleX),
    length: roundCoord(room.length * scaleZ),
    height: room.height,
  };
  const scaledRooms = scaleRooms(rooms, scaleX, scaleZ);
  return {
    type,
    name,
    room: scaledRoom,
    rooms: scaledRooms,
    furniture: createDefaultFurniture(type, scaledRoom),
  };
}

const templates: Record<ApartmentType, TemplateDefinition> = {
  "empty-space": makeTemplate(
    "empty-space",
    "Empty space",
    { width: 8, length: 5.5, height: 3 },
    [
      rect("open-space", "empty", "Open space", -4, 4, -2.75, 2.75, "#ebe2d6"),
    ],
    1.22,
    1.18,
  ),
  studio: makeTemplate(
    "studio",
    "Studio",
    { width: 7.5, length: 5.2, height: 3 },
    [
      rect("studio-main", "living-room", "Living / sleeping", -3.75, 1.35, -2.6, 0.4, "#d9e5ea"),
      rect("studio-kitchen", "kitchen", "Kitchen", 1.35, 3.75, -2.6, 0.4, "#e7ddd0"),
      rect("studio-entrance", "entrance", "Entrance", -3.75, -1.2, 0.4, 2.6, "#e8dfd4"),
      rect("studio-alcove", "hallway", "Alcove", -1.2, 1.35, 0.4, 2.6, "#e4ddd7"),
      rect("studio-bathroom", "bathroom", "Bathroom", 1.35, 3.75, 0.4, 2.6, "#dbe2ef"),
    ],
    1.18,
    1.16,
  ),
  "two-room": makeTemplate(
    "two-room",
    "2-room apartment",
    { width: 7.8, length: 5.4, height: 3 },
    [
      rect("two-living", "living-room", "Living room", -3.9, 0.9, -2.7, 0.5, "#d9e5ea"),
      rect("two-bedroom", "bedroom", "Bedroom", 0.9, 3.9, -2.7, 0.5, "#eadce6"),
      rect("two-entrance", "entrance", "Entrance", -3.9, -1.3, 0.5, 2.7, "#e7ddd2"),
      rect("two-bathroom", "bathroom", "Bathroom", -1.3, 0.9, 0.5, 2.7, "#dbe2ef"),
      rect("two-kitchen", "kitchen", "Kitchen", 0.9, 3.9, 0.5, 2.7, "#e8ded2"),
    ],
    1.16,
    1.14,
  ),
  "three-room": makeTemplate(
    "three-room",
    "3-room apartment",
    { width: 8.6, length: 5.6, height: 3 },
    [
      rect("three-living", "living-room", "Living room", -4.3, 0.7, -2.8, 0.1, "#d9e5ea"),
      rect("three-kitchen", "kitchen", "Kitchen", 0.7, 4.3, -2.8, 0.1, "#e7ddd0"),
      rect("three-entrance", "entrance", "Entrance", -4.3, -1.6, 0.1, 2.8, "#e8dfd4"),
      rect("three-bathroom", "bathroom", "Bathroom", -1.6, 0.7, 0.1, 2.8, "#dbe2ef"),
      rect("three-bedroom", "bedroom", "Bedroom", 0.7, 4.3, 0.1, 2.8, "#eadce6"),
    ],
    1.14,
    1.12,
  ),
  "four-room": makeTemplate(
    "four-room",
    "4-room apartment",
    { width: 9.8, length: 6, height: 3.1 },
    [
      rect("four-living", "living-room", "Living room", -4.9, 0.5, -3, 0, "#d9e5ea"),
      rect("four-kitchen", "kitchen", "Kitchen", 0.5, 4.9, -3, 0, "#e7ddd0"),
      rect("four-entrance", "entrance", "Entrance / hallway", -4.9, -1.9, 0, 3, "#e8dfd4"),
      rect("four-bathroom", "bathroom", "Bathroom", -1.9, 0.3, 0, 3, "#dbe2ef"),
      rect("four-bedroom-a", "bedroom", "Bedroom 01", 0.3, 2.6, 0, 3, "#eadce6"),
      rect("four-bedroom-b", "bedroom", "Bedroom 02", 2.6, 4.9, 0, 3, "#efe0e8"),
    ],
    1.12,
    1.1,
  ),
  loft: makeTemplate(
    "loft",
    "Loft",
    { width: 10.2, length: 6.6, height: 3.2 },
    [
      rect("loft-main", "loft-space", "Loft living", -5.1, 1.6, -3.3, 0.9, "#d9e5ea"),
      rect("loft-kitchen", "kitchen", "Kitchen", 1.6, 5.1, -3.3, 0.9, "#e7ddd0"),
      rect("loft-entrance", "entrance", "Entrance", -5.1, -2.4, 0.9, 3.3, "#e8dfd4"),
      rect("loft-bathroom", "bathroom", "Bathroom", -2.4, 0.2, 0.9, 3.3, "#dbe2ef"),
      rect("loft-bedroom", "bedroom", "Bedroom", 0.2, 5.1, 0.9, 3.3, "#eadce6"),
    ],
    1.08,
    1.08,
  ),
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
    furniture: template.furniture,
  };
}
