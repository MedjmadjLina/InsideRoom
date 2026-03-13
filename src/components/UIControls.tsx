// ============================================
// UIControls.tsx — Liquid Glass UI (VisionOS / macOS style)
// Top bar · Left settings · Right inspector · Bottom toolbar
// ============================================

"use client";

import { useState, useMemo } from "react";
import { GRID_SIZE, getApartmentTypeLabel } from "@/lib/apartmentLayout";
import { useDoorStore } from "@/store/doorStore";
import { useRoomStore } from "@/store/roomStore";
import { useLightingStore, getSunColor } from "@/store/lightingStore";
import { useWindowStore } from "@/store/windowStore";
import type { DoorType } from "@/types/door";
import type { WindowType } from "@/types/window";
import FurnitureForm from "./FurnitureForm";

/* ─────────────────────────────────────────────
   Glass style tokens
───────────────────────────────────────────── */
const G = {
  panel:   "backdrop-blur-2xl bg-[linear-gradient(180deg,rgba(96,86,74,0.58),rgba(62,54,46,0.74))] border border-white/26 shadow-[0_10px_46px_rgba(25,20,16,0.26),inset_0_1px_0_rgba(255,255,255,0.18)]",
  bar:     "backdrop-blur-2xl bg-[linear-gradient(180deg,rgba(112,103,92,0.42),rgba(88,79,70,0.58))] border border-white/22 shadow-[0_6px_28px_rgba(20,16,12,0.20),inset_0_1px_0_rgba(255,255,255,0.16)]",
  input:   "bg-white/18 border border-white/22 backdrop-blur-md placeholder-white/42 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
  divider: "bg-white/16",
  label:   "text-[10px] font-semibold uppercase tracking-wider text-white/78 drop-shadow-[0_1px_2px_rgba(0,0,0,0.42)]",
  value:   "text-[11px] font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
  heading: "text-[11px] font-bold uppercase tracking-[0.18em] text-white/92 drop-shadow-[0_1px_2px_rgba(0,0,0,0.42)]",
  sectionHeader: "px-3.5 py-2.5 border-b border-white/12 bg-black/10",
};

/* ── Icon components ── */
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 3v10M3 8h10" />
  </svg>
);
const IconCube = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 4.5L8 7.5l-5.5-3M8 7.5V14M2.5 5v6l5.5 3 5.5-3V5L8 2 2.5 5z" />
  </svg>
);
const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="2" width="5" height="5" rx="1.2" /><rect x="9" y="2" width="5" height="5" rx="1.2" />
    <rect x="2" y="9" width="5" height="5" rx="1.2" /><rect x="9" y="9" width="5" height="5" rx="1.2" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4.5h10M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M5 4.5l.5 8.5a1 1 0 001 1h3a1 1 0 001-1l.5-8.5" />
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 3l8 8M11 3l-8 8" />
  </svg>
);
const IconHome = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 6.5L8 2l5.5 4.5V13a1 1 0 01-1 1H10V10H6v4H3.5a1 1 0 01-1-1V6.5z" />
  </svg>
);

const WINDOW_TYPE_OPTIONS: [WindowType, string, string][] = [
  ["simple", "▭", "Simple"],
  ["bay", "⬡", "Bay"],
  ["double-vertical", "▮▮", "Double"],
  ["arched", "⌒", "Arched"],
  ["loft", "⊞", "Loft"],
];

const FRAME_COLOR_OPTIONS: [string, string][] = [
  ["#e8e2d8", "Blanc"],
  ["#c8b89a", "Bois"],
  ["#1c1c1e", "Acier"],
  ["#5a4a3a", "Wenge"],
  ["#b5c4c8", "Alu"],
];

const DOOR_TYPE_OPTIONS: [DoorType, string, string][] = [
  ["swing", "▯", "Swing"],
  ["double", "▯▯", "Double"],
  ["arched", "⌒", "Arched"],
];

const DOOR_COLOR_OPTIONS: [string, string][] = [
  ["#7a5a43", "Walnut"],
  ["#9a7657", "Oak"],
  ["#ece5db", "Paint"],
  ["#2f2a27", "Dark"],
];

export default function UIControls() {
  const [showForm, setShowForm] = useState(false);

  const setAppState = useRoomStore((s) => s.setAppState);
  const apartmentType = useRoomStore((s) => s.apartmentType);
  const rooms = useRoomStore((s) => s.rooms);
  const walls = useRoomStore((s) => s.walls);
  const viewMode = useRoomStore((s) => s.viewMode);
  const toggleViewMode = useRoomStore((s) => s.toggleViewMode);
  const resetRoom = useRoomStore((s) => s.resetRoom);
  const selectedId = useRoomStore((s) => s.selectedId);
  const selectedWallId = useRoomStore((s) => s.selectedWallId);
  const furniture = useRoomStore((s) => s.furniture);
  const addWall = useRoomStore((s) => s.addWall);
  const addFurniture = useRoomStore((s) => s.addFurniture);
  const updateWall = useRoomStore((s) => s.updateWall);
  const removeWall = useRoomStore((s) => s.removeWall);
  const updateFurniture = useRoomStore((s) => s.updateFurniture);
  const removeFurniture = useRoomStore((s) => s.removeFurniture);
  const selectFurniture = useRoomStore((s) => s.selectFurniture);
  const selectWall = useRoomStore((s) => s.selectWall);
  const room = useRoomStore((s) => s.room);
  const setRoom = useRoomStore((s) => s.setRoom);

  // Lighting
  const sun = useLightingStore((s) => s.sun);
  const setSunTime = useLightingStore((s) => s.setSunTime);
  const setSunIntensity = useLightingStore((s) => s.setSunIntensity);
  const setSunEnabled = useLightingStore((s) => s.setSunEnabled);
  const ambient = useLightingStore((s) => s.ambient);
  const setAmbientIntensity = useLightingStore((s) => s.setAmbientIntensity);
  const lamps = useLightingStore((s) => s.lamps);
  const addLamp = useLightingStore((s) => s.addLamp);
  const removeLamp = useLightingStore((s) => s.removeLamp);
  const updateLamp = useLightingStore((s) => s.updateLamp);
  const preset = useLightingStore((s) => s.preset);
  const applyPreset = useLightingStore((s) => s.applyPreset);

  const selected = furniture.find((f) => f.id === selectedId) ?? null;
  const selectedWall = walls.find((wall) => wall.id === selectedWallId) ?? null;
  const isExteriorWall = selectedWall?.kind === "exterior";
  const isFrontFacadeWall = selectedWall
    ? selectedWall.kind === "exterior" &&
      selectedWall.rotation === 0 &&
      Math.abs(selectedWall.position[2] - (-room.length / 2 + selectedWall.thickness / 2)) < 0.02
    : false;
  const layoutLabel = useMemo(() => getApartmentTypeLabel(apartmentType), [apartmentType]);

  // Windows
  const winConfig = useWindowStore((s) => s.config);
  const placedWindows = useWindowStore((s) => s.placedWindows);
  const selectedPlacedWindowId = useWindowStore((s) => s.selectedPlacedWindowId);
  const setWinType = useWindowStore((s) => s.setType);
  const setWinWidth = useWindowStore((s) => s.setWidthFraction);
  const setWinHeight = useWindowStore((s) => s.setHeight);
  const setWinSill = useWindowStore((s) => s.setSillHeight);
  const setWinFrameColor = useWindowStore((s) => s.setFrameColor);
  const addPlacedWindow = useWindowStore((s) => s.addPlacedWindow);
  const updatePlacedWindow = useWindowStore((s) => s.updatePlacedWindow);
  const removePlacedWindow = useWindowStore((s) => s.removePlacedWindow);
  const selectPlacedWindow = useWindowStore((s) => s.selectPlacedWindow);
  const selectedWallWindows = selectedWall
    ? placedWindows.filter((window) => window.wallId === selectedWall.id)
    : [];
  const selectedPlacedWindow =
    selectedWallWindows.find((window) => window.id === selectedPlacedWindowId) ??
    selectedWallWindows[0] ??
    null;

  // Doors
  const placedDoors = useDoorStore((s) => s.placedDoors);
  const selectedPlacedDoorId = useDoorStore((s) => s.selectedPlacedDoorId);
  const addPlacedDoor = useDoorStore((s) => s.addPlacedDoor);
  const updatePlacedDoor = useDoorStore((s) => s.updatePlacedDoor);
  const removePlacedDoor = useDoorStore((s) => s.removePlacedDoor);
  const selectPlacedDoor = useDoorStore((s) => s.selectPlacedDoor);
  const selectedWallDoors = selectedWall
    ? placedDoors.filter((door) => door.wallId === selectedWall.id)
    : [];
  const selectedPlacedDoor =
    selectedWallDoors.find((door) => door.id === selectedPlacedDoorId) ??
    selectedWallDoors[0] ??
    null;

  /** Friendly time label from 0–24 float */
  const timeLabel = (t: number) => {
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  /** Live sun color swatch */
  const sunColor = useMemo(() => getSunColor(sun.timeOfDay), [sun.timeOfDay]);

  /** Time-of-day icon */
  const timeIcon = sun.timeOfDay >= 6 && sun.timeOfDay < 19 ? "☀️" : "🌙";

  return (
    <>
      {/* ════════ TOP BAR ════════ */}
      <header className={`fixed top-0 left-0 right-0 z-40 h-12 flex items-center px-5 ${G.bar}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow-md"
               style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)" }}>
            <IconHome />
          </div>
          <span className="text-[14px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] tracking-tight">InsideRoom</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] px-2.5 py-1 rounded-full bg-white/20 border border-white/30">
            {room.width} × {room.length} × {room.height} m
          </span>
          <span className="text-[11px] font-semibold text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            {rooms.length} rooms · {walls.length} walls · {furniture.length} item{furniture.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* ════════ LEFT PANELS STACK ════════ */}
      <div className="fixed top-14 left-3 z-40 w-52 flex flex-col gap-2.5 max-h-[calc(100vh-5rem)] overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── Room Settings ── */}
        <div className={`rounded-3xl overflow-hidden flex-shrink-0 ${G.panel}`}>
          <div className={G.sectionHeader}>
            <span className={G.heading}>Apartment</span>
          </div>
          <div className="p-3.5 space-y-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
              <p className={G.label}>Layout type</p>
              <p className="mt-1 text-[15px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">{layoutLabel}</p>
              <p className="mt-1 text-[10px] text-white/65">Generated plan with editable partitions and room labels.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/18 bg-white/10 p-3">
                <p className={G.label}>Rooms</p>
                <p className="mt-1 text-[18px] font-bold text-white">{rooms.length}</p>
              </div>
              <div className="rounded-2xl border border-white/18 bg-white/10 p-3">
                <p className={G.label}>Walls</p>
                <p className="mt-1 text-[18px] font-bold text-white">{walls.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] text-white/90 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" style={{ minWidth: 64 }}>
                Ceiling
              </label>
              <div className="relative flex-1">
                <input
                  type="number"
                  step={0.1}
                  min={2.2}
                  max={4.5}
                  value={room.height}
                  onChange={(e) => setRoom({ height: Number(e.target.value) })}
                  className={`w-full rounded-xl px-3 py-1.5 text-[12px] text-right pr-7 outline-none
                               focus:ring-2 focus:ring-white/60 ${G.input}`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/60">m</span>
              </div>
            </div>

            <button
              onClick={() => setAppState("generator")}
              className="w-full rounded-2xl border border-white/25 bg-white/15 px-3 py-2.5 text-[12px] font-semibold text-white/92 transition hover:bg-white/25"
            >
              Change apartment type
            </button>
          </div>
        </div>

        {/* ── Lighting ── */}
        <div className={`rounded-3xl overflow-hidden flex-shrink-0 ${G.panel}`}>
          <div className={`${G.sectionHeader} flex items-center justify-between`}>
            <span className={G.heading}>Lighting</span>
            <div className="flex gap-1">
              {(["day", "night"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-200"
                  style={{
                    background: preset === p
                      ? p === "day" ? "rgba(251,191,36,0.55)" : "rgba(99,102,241,0.45)"
                      : "rgba(255,255,255,0.25)",
                    color: preset === p ? (p === "day" ? "#7c3a00" : "#e0e7ff") : "rgba(255,255,255,0.85)",
                    border: `1px solid ${preset === p ? (p === "day" ? "rgba(251,191,36,0.5)" : "rgba(99,102,241,0.4)") : "rgba(255,255,255,0.3)"}`,
                  }}
                >
                  {p === "day" ? "☀" : "🌙"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 space-y-3.5">
            {/* Sun toggle */}
            <div className="flex items-center justify-between">
              <span className={G.label}>Sun</span>
              <button
                onClick={() => setSunEnabled(!sun.enabled)}
                className="rounded-full relative transition-all duration-300 flex-shrink-0"
                style={{
                  background: sun.enabled ? "linear-gradient(90deg,#6366f1,#3b82f6)" : "rgba(0,0,0,0.15)",
                  width: 32, height: 18,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: sun.enabled ? 13 : 2, width: 13, height: 13 }}
                />
              </button>
            </div>

            {/* Time of day */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={G.label}><span className="mr-1">{timeIcon}</span>Time</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-300"
                        style={{ background: sunColor, boxShadow: `0 0 6px ${sunColor}80` }} />
                  <span className={G.value}>{timeLabel(sun.timeOfDay)}</span>
                </div>
              </div>
              <input type="range" min={0} max={24} step={0.25}
                     value={sun.timeOfDay} onChange={(e) => setSunTime(Number(e.target.value))}
                     className="glass-range w-full" />
              <div className="flex justify-between text-[8px] mt-0.5 text-white/55 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                <span>00</span><span>06</span><span>06</span><span>18</span><span>24</span>
              </div>
            </div>

            {/* Sun power */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={G.label}>Sun power</span>
                <span className={G.value}>{(sun.intensity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min={0} max={1.5} step={0.05}
                     value={sun.intensity} onChange={(e) => setSunIntensity(Number(e.target.value))}
                     className="glass-range w-full" />
            </div>

            {/* Ambient */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={G.label}>Ambient</span>
                <span className={G.value}>{(ambient.intensity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.02}
                     value={ambient.intensity} onChange={(e) => setAmbientIntensity(Number(e.target.value))}
                     className="glass-range w-full" />
            </div>

            <div className={`h-px ${G.divider}`} />

            {/* Lamps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={G.label}>Lamps</span>
                <button onClick={addLamp}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/25 border border-white/30 text-indigo-600/90 hover:bg-white/40 transition-all duration-150">
                  + Add
                </button>
              </div>
              {lamps.length === 0 && (
                <p className="text-[10px] italic text-white/55">No lamps yet</p>
              )}
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {lamps.map((lamp) => (
                  <div key={lamp.id}
                       className="flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 bg-white/20 border border-white/25">
                    <button
                      onClick={() => updateLamp(lamp.id, { enabled: !lamp.enabled })}
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
                      style={{ background: lamp.enabled ? lamp.color : "rgba(0,0,0,0.15)", boxShadow: lamp.enabled ? `0 0 6px ${lamp.color}` : "none" }}
                    />
                    <span className="text-[10px] flex-1 truncate text-white/90 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{lamp.name}</span>
                    <input type="range" min={0} max={3} step={0.1}
                           value={lamp.intensity} onChange={(e) => updateLamp(lamp.id, { intensity: Number(e.target.value) })}
                           className="glass-range w-12" />
                    <button onClick={() => removeLamp(lamp.id)}
                            className="text-[11px] text-white/50 hover:text-rose-300 transition-colors leading-none">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Windows ── */}
        <div className={`rounded-3xl overflow-hidden flex-shrink-0 ${G.panel}`}>
          <div className={G.sectionHeader}>
            <span className={G.heading}>Facade window</span>
          </div>
          <div className="p-3.5 space-y-3">
            <p className="text-[10px] leading-4 text-white/68">
              Main front opening. Use the wall inspector to place windows on the other walls.
            </p>

            {/* Type picker */}
            <div>
              <p className={`${G.label} mb-1.5`}>Type</p>
              <div className="grid grid-cols-5 gap-1">
                {WINDOW_TYPE_OPTIONS.map(([type, icon, label]) => (
                  <button
                    key={type}
                    onClick={() => setWinType(type)}
                    title={label}
                    className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-bold
                               transition-all duration-150 active:scale-[0.93] border"
                    style={{
                      background: winConfig.type === type
                        ? "linear-gradient(135deg,#6366f1,#3b82f6)"
                        : "rgba(255,255,255,0.15)",
                      borderColor: winConfig.type === type
                        ? "rgba(99,102,241,0.6)"
                        : "rgba(255,255,255,0.25)",
                      color: "white",
                    }}
                  >
                    <span className="text-[13px] leading-none">{icon}</span>
                    <span className="text-[8px] leading-none opacity-80">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`h-px ${G.divider}`} />

            {/* Width fraction */}
            <div className="flex items-center justify-between gap-2">
              <label className={G.label} style={{ minWidth: 36 }}>Width</label>
              <input
                type="range" min={0.25} max={0.92} step={0.01}
                value={winConfig.widthFraction}
                onChange={(e) => setWinWidth(Number(e.target.value))}
                className="glass-range flex-1"
              />
              <span className={G.value}>{Math.round(winConfig.widthFraction * 100)}%</span>
            </div>

            {/* Height */}
            <div className="flex items-center justify-between gap-2">
              <label className={G.label} style={{ minWidth: 36 }}>Height</label>
              <input
                type="range" min={0.5} max={3.0} step={0.05}
                value={winConfig.height}
                onChange={(e) => setWinHeight(Number(e.target.value))}
                className="glass-range flex-1"
              />
              <span className={G.value}>{winConfig.height.toFixed(2)}m</span>
            </div>

            {/* Sill height */}
            <div className="flex items-center justify-between gap-2">
              <label className={G.label} style={{ minWidth: 36 }}>Sill</label>
              <input
                type="range" min={0.1} max={1.5} step={0.05}
                value={winConfig.sillHeight}
                onChange={(e) => setWinSill(Number(e.target.value))}
                className="glass-range flex-1"
              />
              <span className={G.value}>{winConfig.sillHeight.toFixed(2)}m</span>
            </div>

            <div className={`h-px ${G.divider}`} />

            {/* Frame color */}
            <div>
              <p className={`${G.label} mb-1.5`}>Frame</p>
              <div className="flex gap-1.5 flex-wrap">
                {FRAME_COLOR_OPTIONS.map(([col, name]) => (
                  <button
                    key={col}
                    title={name}
                    onClick={() => setWinFrameColor(col)}
                    className="w-7 h-7 rounded-lg border-2 transition-all duration-150
                               hover:scale-110 active:scale-95"
                    style={{
                      background: col,
                      borderColor: winConfig.frameColor === col
                        ? "rgba(99,102,241,0.85)"
                        : "rgba(255,255,255,0.30)",
                      boxShadow: winConfig.frameColor === col
                        ? "0 0 0 1px rgba(99,102,241,0.5)"
                        : "none",
                    }}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>{/* end left panels stack */}

      {/* ════════ BOTTOM TOOLBAR ════════ */}
      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 rounded-full ${G.bar}`}>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-white text-[12px] font-semibold
                     transition-all duration-200 hover:brightness-110 active:scale-[0.96]"
          style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}
        >
          <IconPlus /> Add
        </button>

        <button
          onClick={addWall}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-white text-[12px] font-semibold
                     transition-all duration-200 hover:bg-white/18 active:scale-[0.96]"
        >
          <IconGrid /> Wall
        </button>

        <div className={`w-px h-6 mx-0.5 ${G.divider}`} />

        <button
          onClick={toggleViewMode}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-semibold text-gray-700/90
                     hover:bg-white/35 active:scale-[0.96] transition-all duration-200"
        >
          {viewMode === "3d" ? <><IconGrid /> 2D</> : <><IconCube /> 3D</>}
        </button>

        <div className={`w-px h-6 mx-0.5 ${G.divider}`} />

        <button
          onClick={resetRoom}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-semibold text-rose-500/90
                     hover:bg-rose-500/15 active:scale-[0.96] transition-all duration-200"
        >
          <IconTrash /> Reset
        </button>
      </div>

      {/* ════════ RIGHT PANEL — Wall Inspector ════════ */}
      {selectedWall && !selected && (
        <div
          className={`fixed top-14 right-3 z-40 w-[260px] rounded-3xl overflow-hidden ${G.panel}`}
          style={{ animation: "glassSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div className="px-4 pt-4 pb-3 border-b border-white/20">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md bg-white/15 border border-white/25 text-white">
                  <IconGrid />
                </div>
                <div>
                  <span className="text-[14px] font-bold leading-tight text-white block drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                    {selectedWall.kind === "exterior" ? "Exterior wall" : "Partition wall"}
                  </span>
                  <span className="text-[10px] text-white/70 tabular-nums font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    {selectedWall.length.toFixed(2)} m · {selectedWall.thickness.toFixed(2)} m · snap {GRID_SIZE} m
                  </span>
                </div>
              </div>
              <button
                onClick={() => selectWall(null)}
                className="p-1.5 rounded-xl bg-white/20 border border-white/25 text-white/70 hover:bg-white/35 transition-all duration-150 flex-shrink-0"
              >
                <IconX />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <p className={`${G.label} mb-2`}>Geometry</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  ["L", selectedWall.length, "length", 0.25, 20],
                  ["H", selectedWall.height, "height", 0.05, 5],
                  ["T", selectedWall.thickness, "thickness", 0.02, 1],
                ] as [string, number, "length" | "height" | "thickness", number, number][]).map(([label, val, key, step, max]) => (
                  <div key={label} className="relative">
                    <span className="absolute left-0 top-0 w-6 h-full flex items-center justify-center text-[9px] font-bold text-white/70 bg-white/15 border-r border-white/20 rounded-l-xl z-10">
                      {label}
                    </span>
                    <input
                      type="number"
                      step={step}
                      min={step}
                      max={max}
                      value={Number(val.toFixed(2))}
                      disabled={isExteriorWall}
                      onChange={(e) => updateWall(selectedWall.id, { [key]: Number(e.target.value) })}
                      className={`w-full rounded-xl pl-7 pr-1.5 py-[7px] text-[12px] text-right outline-none
                                  focus:ring-2 focus:ring-white/60 tabular-nums ${G.input}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={`${G.label} mb-2`}>Position</p>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ["X", 0, "#fca5a5"],
                  ["Z", 2, "#93c5fd"],
                ] as ["X" | "Z", 0 | 2, string][]).map(([axis, index, color]) => (
                  <div key={axis} className="relative">
                    <span
                      className="absolute left-0 top-0 w-6 h-full flex items-center justify-center text-[9px] font-bold rounded-l-xl bg-white/15 border-r border-white/20 z-10"
                      style={{ color }}
                    >
                      {axis}
                    </span>
                    <input
                      type="number"
                      step={GRID_SIZE}
                      value={Number(selectedWall.position[index].toFixed(2))}
                      disabled={isExteriorWall}
                      onChange={(e) => {
                        const position: [number, number, number] = [...selectedWall.position];
                        position[index] = Number(e.target.value);
                        updateWall(selectedWall.id, { position });
                      }}
                      className={`w-full rounded-xl pl-7 pr-1.5 py-[7px] text-[12px] text-right outline-none
                                  focus:ring-2 focus:ring-white/60 tabular-nums ${G.input}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className={G.label}>Rotation</p>
                <span className={G.value}>{selectedWall.rotation}°</span>
              </div>
              <div className="flex gap-1 mb-2">
                {[0, 45, 90, 135, 180].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => {
                      if (!isExteriorWall) updateWall(selectedWall.id, { rotation: deg });
                    }}
                    className="flex-1 py-1 rounded-xl text-[10px] font-semibold transition-all duration-150"
                    style={{
                      background: selectedWall.rotation === deg
                        ? "linear-gradient(135deg,#6366f1,#3b82f6)"
                        : "rgba(255,255,255,0.2)",
                      color: selectedWall.rotation === deg ? "white" : "rgba(255,255,255,0.8)",
                      border: `1px solid ${selectedWall.rotation === deg ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.3)"}`,
                    }}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={180}
                step={5}
                value={selectedWall.rotation}
                disabled={isExteriorWall}
                onChange={(e) => updateWall(selectedWall.id, { rotation: Number(e.target.value) })}
                className="glass-range w-full"
              />
            </div>

            <div className={`h-px ${G.divider}`} />

            {isFrontFacadeWall ? (
              <p className="text-[10px] leading-4 text-white/68">
                This is the main facade wall. Edit its opening from the Facade window panel on the left.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={G.label}>Wall windows</p>
                    <p className="text-[10px] text-white/62 leading-4">
                      Add one or more openings on this wall and tune their shape.
                    </p>
                  </div>
                  <button
                    onClick={() => addPlacedWindow(selectedWall.id, selectedWall.length, selectedWall.height)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/20 border border-white/30 text-white/90 hover:bg-white/35 transition-all duration-150"
                  >
                    + Add window
                  </button>
                </div>

                {selectedWallWindows.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWallWindows.map((window, index) => (
                        <button
                          key={window.id}
                          onClick={() => selectPlacedWindow(window.id)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all duration-150"
                          style={{
                            background:
                              selectedPlacedWindow?.id === window.id
                                ? "linear-gradient(135deg,#6366f1,#3b82f6)"
                                : "rgba(255,255,255,0.15)",
                            borderColor:
                              selectedPlacedWindow?.id === window.id
                                ? "rgba(99,102,241,0.55)"
                                : "rgba(255,255,255,0.22)",
                            color: "white",
                          }}
                        >
                          Window {index + 1}
                        </button>
                      ))}
                    </div>

                    {selectedPlacedWindow && (
                      <div className="space-y-3 rounded-2xl border border-white/16 bg-black/10 p-3">
                        <div>
                          <p className={`${G.label} mb-1.5`}>Shape</p>
                          <div className="grid grid-cols-5 gap-1">
                            {WINDOW_TYPE_OPTIONS.map(([type, icon, label]) => (
                              <button
                                key={type}
                                onClick={() => updatePlacedWindow(selectedPlacedWindow.id, { type })}
                                title={label}
                                className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-150 border"
                                style={{
                                  background:
                                    selectedPlacedWindow.type === type
                                      ? "linear-gradient(135deg,#6366f1,#3b82f6)"
                                      : "rgba(255,255,255,0.12)",
                                  borderColor:
                                    selectedPlacedWindow.type === type
                                      ? "rgba(99,102,241,0.6)"
                                      : "rgba(255,255,255,0.2)",
                                  color: "white",
                                }}
                              >
                                <span className="text-[13px] leading-none">{icon}</span>
                                <span className="text-[8px] leading-none opacity-80">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className={G.label} style={{ minWidth: 40 }}>Width</label>
                          <input
                            type="range"
                            min={0.7}
                            max={Math.max(0.8, selectedWall.length - 0.22)}
                            step={0.05}
                            value={selectedPlacedWindow.width}
                            onChange={(e) => updatePlacedWindow(selectedPlacedWindow.id, { width: Number(e.target.value) })}
                            className="glass-range flex-1"
                          />
                          <span className={G.value}>{selectedPlacedWindow.width.toFixed(2)}m</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className={G.label} style={{ minWidth: 40 }}>Height</label>
                          <input
                            type="range"
                            min={0.7}
                            max={Math.max(0.8, selectedWall.height - selectedPlacedWindow.sillHeight - 0.12)}
                            step={0.05}
                            value={selectedPlacedWindow.height}
                            onChange={(e) => updatePlacedWindow(selectedPlacedWindow.id, { height: Number(e.target.value) })}
                            className="glass-range flex-1"
                          />
                          <span className={G.value}>{selectedPlacedWindow.height.toFixed(2)}m</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className={G.label} style={{ minWidth: 40 }}>Sill</label>
                          <input
                            type="range"
                            min={0.2}
                            max={Math.max(0.25, selectedWall.height - selectedPlacedWindow.height - 0.08)}
                            step={0.05}
                            value={selectedPlacedWindow.sillHeight}
                            onChange={(e) => updatePlacedWindow(selectedPlacedWindow.id, { sillHeight: Number(e.target.value) })}
                            className="glass-range flex-1"
                          />
                          <span className={G.value}>{selectedPlacedWindow.sillHeight.toFixed(2)}m</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className={G.label} style={{ minWidth: 40 }}>Offset</label>
                          <input
                            type="range"
                            min={-(selectedWall.length / 2 - selectedPlacedWindow.width / 2 - 0.08)}
                            max={selectedWall.length / 2 - selectedPlacedWindow.width / 2 - 0.08}
                            step={0.05}
                            value={selectedPlacedWindow.offset}
                            onChange={(e) => updatePlacedWindow(selectedPlacedWindow.id, { offset: Number(e.target.value) })}
                            className="glass-range flex-1"
                          />
                          <span className={G.value}>{selectedPlacedWindow.offset.toFixed(2)}m</span>
                        </div>

                        <div>
                          <p className={`${G.label} mb-1.5`}>Frame</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {FRAME_COLOR_OPTIONS.map(([col, name]) => (
                              <button
                                key={col}
                                title={name}
                                onClick={() => updatePlacedWindow(selectedPlacedWindow.id, { frameColor: col })}
                                className="w-7 h-7 rounded-lg border-2 transition-all duration-150 hover:scale-110 active:scale-95"
                                style={{
                                  background: col,
                                  borderColor:
                                    selectedPlacedWindow.frameColor === col
                                      ? "rgba(99,102,241,0.85)"
                                      : "rgba(255,255,255,0.30)",
                                  boxShadow:
                                    selectedPlacedWindow.frameColor === col
                                      ? "0 0 0 1px rgba(99,102,241,0.5)"
                                      : "none",
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => removePlacedWindow(selectedPlacedWindow.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold bg-rose-500/15 border border-rose-400/25 text-rose-300 hover:bg-rose-500/25 active:scale-[0.96] transition-all duration-150"
                        >
                          <IconTrash /> Remove window
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] italic text-white/55">
                    No added windows on this wall yet.
                  </p>
                )}
              </div>
            )}

            {!isFrontFacadeWall && (
              <>
                <div className={`h-px ${G.divider}`} />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={G.label}>Doors</p>
                      <p className="text-[10px] text-white/62 leading-4">
                        Add interior or service doors on this wall.
                      </p>
                    </div>
                    <button
                      onClick={() => addPlacedDoor(selectedWall.id, selectedWall.length, selectedWall.height)}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/20 border border-white/30 text-white/90 hover:bg-white/35 transition-all duration-150"
                    >
                      + Add door
                    </button>
                  </div>

                  {selectedWallDoors.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedWallDoors.map((door, index) => (
                          <button
                            key={door.id}
                            onClick={() => selectPlacedDoor(door.id)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all duration-150"
                            style={{
                              background:
                                selectedPlacedDoor?.id === door.id
                                  ? "linear-gradient(135deg,#8b5cf6,#6366f1)"
                                  : "rgba(255,255,255,0.15)",
                              borderColor:
                                selectedPlacedDoor?.id === door.id
                                  ? "rgba(139,92,246,0.55)"
                                  : "rgba(255,255,255,0.22)",
                              color: "white",
                            }}
                          >
                            Door {index + 1}
                          </button>
                        ))}
                      </div>

                      {selectedPlacedDoor && (
                        <div className="space-y-3 rounded-2xl border border-white/16 bg-black/10 p-3">
                          <div>
                            <p className={`${G.label} mb-1.5`}>Type</p>
                            <div className="grid grid-cols-3 gap-1">
                              {DOOR_TYPE_OPTIONS.map(([type, icon, label]) => (
                                <button
                                  key={type}
                                  onClick={() => updatePlacedDoor(selectedPlacedDoor.id, { type })}
                                  className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-150 border"
                                  style={{
                                    background:
                                      selectedPlacedDoor.type === type
                                        ? "linear-gradient(135deg,#8b5cf6,#6366f1)"
                                        : "rgba(255,255,255,0.12)",
                                    borderColor:
                                      selectedPlacedDoor.type === type
                                        ? "rgba(139,92,246,0.6)"
                                        : "rgba(255,255,255,0.2)",
                                    color: "white",
                                  }}
                                >
                                  <span className="text-[13px] leading-none">{icon}</span>
                                  <span className="text-[8px] leading-none opacity-80">{label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label className={G.label} style={{ minWidth: 40 }}>Width</label>
                            <input
                              type="range"
                              min={0.8}
                              max={Math.max(0.9, selectedWall.length - 0.16)}
                              step={0.05}
                              value={selectedPlacedDoor.width}
                              onChange={(e) => updatePlacedDoor(selectedPlacedDoor.id, { width: Number(e.target.value) })}
                              className="glass-range flex-1"
                            />
                            <span className={G.value}>{selectedPlacedDoor.width.toFixed(2)}m</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label className={G.label} style={{ minWidth: 40 }}>Height</label>
                            <input
                              type="range"
                              min={1.95}
                              max={Math.max(2.0, selectedWall.height - 0.05)}
                              step={0.05}
                              value={selectedPlacedDoor.height}
                              onChange={(e) => updatePlacedDoor(selectedPlacedDoor.id, { height: Number(e.target.value) })}
                              className="glass-range flex-1"
                            />
                            <span className={G.value}>{selectedPlacedDoor.height.toFixed(2)}m</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label className={G.label} style={{ minWidth: 40 }}>Offset</label>
                            <input
                              type="range"
                              min={-(selectedWall.length / 2 - selectedPlacedDoor.width / 2 - 0.08)}
                              max={selectedWall.length / 2 - selectedPlacedDoor.width / 2 - 0.08}
                              step={0.05}
                              value={selectedPlacedDoor.offset}
                              onChange={(e) => updatePlacedDoor(selectedPlacedDoor.id, { offset: Number(e.target.value) })}
                              className="glass-range flex-1"
                            />
                            <span className={G.value}>{selectedPlacedDoor.offset.toFixed(2)}m</span>
                          </div>

                          <div>
                            <p className={`${G.label} mb-1.5`}>Finish</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {DOOR_COLOR_OPTIONS.map(([col, name]) => (
                                <button
                                  key={col}
                                  title={name}
                                  onClick={() => updatePlacedDoor(selectedPlacedDoor.id, { color: col })}
                                  className="w-7 h-7 rounded-lg border-2 transition-all duration-150 hover:scale-110 active:scale-95"
                                  style={{
                                    background: col,
                                    borderColor:
                                      selectedPlacedDoor.color === col
                                        ? "rgba(139,92,246,0.85)"
                                        : "rgba(255,255,255,0.30)",
                                    boxShadow:
                                      selectedPlacedDoor.color === col
                                        ? "0 0 0 1px rgba(139,92,246,0.5)"
                                        : "none",
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => removePlacedDoor(selectedPlacedDoor.id)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold bg-rose-500/15 border border-rose-400/25 text-rose-300 hover:bg-rose-500/25 active:scale-[0.96] transition-all duration-150"
                          >
                            <IconTrash /> Remove door
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] italic text-white/55">
                      No doors on this wall yet.
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={addWall}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold
                           bg-white/20 border border-white/30 text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]
                           hover:bg-white/35 active:scale-[0.96] transition-all duration-150"
              >
                <IconPlus /> Add wall
              </button>
              <button
                onClick={() => {
                  if (!isExteriorWall) removeWall(selectedWall.id);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold
                           bg-rose-500/15 border border-rose-400/25 text-rose-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]
                           hover:bg-rose-500/25 active:scale-[0.96] transition-all duration-150"
                disabled={isExteriorWall}
                style={{ opacity: isExteriorWall ? 0.45 : 1, cursor: isExteriorWall ? "not-allowed" : "pointer" }}
              >
                <IconTrash /> {isExteriorWall ? "Locked" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ RIGHT PANEL — Furniture Inspector ════════ */}
      {selected && (
        <div
          className={`fixed top-14 right-3 z-40 w-[260px] rounded-3xl overflow-hidden ${G.panel}`}
          style={{ animation: "glassSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/20">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
                     style={{ background: selected.color, border: "1px solid rgba(255,255,255,0.3)" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                       stroke={["#FFFFFF","#F5F0EB","#D4C5B2","#C4A882","#9CA3AF"].includes(selected.color) ? "#555" : "rgba(255,255,255,0.85)"}
                       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.5 4.5L8 7.5l-5.5-3M8 7.5V14M2.5 5v6l5.5 3 5.5-3V5L8 2 2.5 5z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[14px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] block">{selected.name}</span>
                  <span className="text-[10px] text-white/70 tabular-nums font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    {(selected.width * 100).toFixed(0)} × {(selected.depth * 100).toFixed(0)} × {(selected.height * 100).toFixed(0)} cm
                  </span>
                </div>
              </div>
              <button
                onClick={() => selectFurniture(null)}
                className="p-1.5 rounded-xl bg-white/20 border border-white/25 text-white/70
                           hover:bg-white/35 transition-all duration-150 flex-shrink-0"
              >
                <IconX />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Size */}
            <div>
              <p className={`${G.label} mb-2`}>Size</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  ["W", selected.width, "width"],
                  ["H", selected.height, "height"],
                  ["D", selected.depth, "depth"],
                ] as [string, number, string][]).map(([label, val, key]) => (
                  <div key={label} className="relative">
                    <span className="absolute left-0 top-0 w-6 h-full flex items-center justify-center text-[9px] font-bold
                                    text-white/70 bg-white/15 border-r border-white/20 rounded-l-xl z-10">
                      {label}
                    </span>
                    <input
                      type="number" step={1} min={1} max={500}
                      value={Number((val * 100).toFixed(0))}
                      onChange={(e) => updateFurniture(selected.id, { [key]: Number(e.target.value) / 100 })}
                      className={`w-full rounded-xl pl-7 pr-1.5 py-[7px] text-[12px] text-right outline-none
                                  focus:ring-2 focus:ring-white/60 tabular-nums ${G.input}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <p className={`${G.label} mb-2`}>Position</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["X", "Z"] as const).map((axis) => {
                  const idx = axis === "X" ? 0 : 2;
                  return (
                    <div key={axis} className="relative">
                      <span className="absolute left-0 top-0 w-6 h-full flex items-center justify-center text-[9px] font-bold
                                      rounded-l-xl bg-white/15 border-r border-white/20 z-10"
                            style={{ color: axis === "X" ? "#fca5a5" : "#93c5fd" }}>
                        {axis}
                      </span>
                      <input
                        type="number" step={0.1}
                        value={Number(selected.position[idx].toFixed(2))}
                        onChange={(e) => {
                          const pos: [number, number, number] = [...selected.position];
                          pos[idx] = Number(e.target.value);
                          updateFurniture(selected.id, { position: pos });
                        }}
                        className={`w-full rounded-xl pl-7 pr-1.5 py-[7px] text-[12px] text-right outline-none
                                    focus:ring-2 focus:ring-white/60 tabular-nums ${G.input}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rotation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className={G.label}>Rotation</p>
                <span className={G.value}>{selected.rotation}°</span>
              </div>
              <div className="flex gap-1 mb-2">
                {[0, 45, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => updateFurniture(selected.id, { rotation: deg })}
                    className="flex-1 py-1 rounded-xl text-[10px] font-semibold transition-all duration-150"
                    style={{
                      background: selected.rotation === deg
                        ? "linear-gradient(135deg,#6366f1,#3b82f6)"
                        : "rgba(255,255,255,0.2)",
                      color: selected.rotation === deg ? "white" : "rgba(255,255,255,0.8)",
                      border: `1px solid ${selected.rotation === deg ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.3)"}`,
                    }}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
              <input type="range" min={0} max={360} step={5}
                     value={selected.rotation}
                     onChange={(e) => updateFurniture(selected.id, { rotation: Number(e.target.value) })}
                     className="glass-range w-full" />
            </div>

            <div className={`h-px ${G.divider}`} />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => addFurniture({
                  name: selected.name + " copy",
                  width: selected.width * 100,
                  height: selected.height * 100,
                  depth: selected.depth * 100,
                  color: selected.color,
                })}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold
                           bg-white/20 border border-white/30 text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]
                           hover:bg-white/35 active:scale-[0.96] transition-all duration-150"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="4" y="1" width="7" height="7" rx="1.5" />
                  <path d="M8 4H2.5A1.5 1.5 0 0 0 1 5.5V11h5.5A1.5 1.5 0 0 0 8 9.5V4z" />
                </svg>
                Duplicate
              </button>
              <button
                onClick={() => removeFurniture(selected.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-[11px] font-bold
                           bg-rose-500/15 border border-rose-400/25 text-rose-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]
                           hover:bg-rose-500/25 active:scale-[0.96] transition-all duration-150"
              >
                <IconTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ FURNITURE FORM MODAL ════════ */}
      {showForm && <FurnitureForm onClose={() => setShowForm(false)} />}

      <style>{`
        @keyframes glassSlideIn {
          from { opacity: 0; transform: translateX(10px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .glass-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 99px;
          background: rgba(255,255,255,0.3);
          outline: none;
          cursor: pointer;
        }
        .glass-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 6px rgba(0,0,0,0.2), 0 0 0 2px rgba(99,102,241,0.35);
          cursor: pointer;
          transition: transform 0.15s;
        }
        .glass-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .glass-range::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: white;
          border: none;
          box-shadow: 0 1px 6px rgba(0,0,0,0.2);
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
