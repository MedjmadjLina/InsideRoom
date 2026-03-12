// ============================================
// FurnitureForm.tsx — Polished add-furniture modal
// Two-step: pick a preset or custom, then configure
// ============================================

"use client";

import { useState, useEffect, useRef } from "react";
import { useRoomStore } from "@/store/roomStore";
import type { FurnitureFormData } from "@/types/furniture";

/* ── Furniture presets ── */
const PRESETS: { name: string; icon: string; w: number; h: number; d: number; color: string }[] = [
  { name: "Bed",          icon: "🛏", w: 200, h: 45,  d: 160, color: "#C4A882" },
  { name: "Sofa",         icon: "🛋", w: 200, h: 78,  d: 85,  color: "#7C8B9A" },
  { name: "Desk",         icon: "🖥", w: 120, h: 75,  d: 60,  color: "#8B7355" },
  { name: "Chair",        icon: "💺", w: 50,  h: 85,  d: 50,  color: "#1F2937" },
  { name: "Bookshelf",    icon: "📚", w: 80,  h: 180, d: 30,  color: "#6B7280" },
  { name: "Wardrobe",     icon: "🗄", w: 120, h: 200, d: 60,  color: "#A0522D" },
  { name: "Nightstand",   icon: "🪟", w: 45,  h: 55,  d: 40,  color: "#8B7355" },
  // — Lamps —
  { name: "Floor Lamp",   icon: "🕯", w: 35,  h: 165, d: 35,  color: "#C8A840" },
  { name: "Bedside Lamp", icon: "💡", w: 25,  h: 45,  d: 25,  color: "#E2C878" },
  { name: "Desk Lamp",    icon: "🔦", w: 22,  h: 55,  d: 28,  color: "#9A9A9A" },
  { name: "Pendant Lamp", icon: "🏮", w: 30,  h: 240, d: 30,  color: "#C8A840" },
];

const PALETTE = [
  "#C4A882", "#8B7355", "#A0522D", "#D4C5B2",
  "#9CA3AF", "#6B7280", "#3B82F6", "#1F2937",
  "#F5F0EB", "#FFFFFF", "#C8A840", "#E2C878",
];

interface FurnitureFormProps {
  onClose: () => void;
}

export default function FurnitureForm({ onClose }: FurnitureFormProps) {
  const addFurniture = useRoomStore((s) => s.addFurniture);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const [form, setForm] = useState<FurnitureFormData>({
    name: "",
    width: 80,
    height: 75,
    depth: 50,
    color: PALETTE[0],
  });

  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 180);
  };

  const handlePreset = (p: typeof PRESETS[number]) => {
    setForm({ name: p.name, width: p.w, height: p.h, depth: p.d, color: p.color });
    setShowCustom(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addFurniture(form);
    handleClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && handleClose()}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: visible ? "rgba(10,10,20,0.35)" : "rgba(10,10,20,0)",
        backdropFilter: visible ? "blur(16px) saturate(1.4)" : "blur(0px)",
        WebkitBackdropFilter: visible ? "blur(16px) saturate(1.4)" : "blur(0px)",
        transition: "all 0.22s ease",
      }}
    >
      <div
        className="w-full max-w-[420px] mx-4 rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)",
          backdropFilter: "blur(40px) saturate(1.6)",
          WebkitBackdropFilter: "blur(40px) saturate(1.6)",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: visible ? "0 24px 80px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.6)" : "none",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900/90">
              {showCustom ? "Configure" : "Add Furniture"}
            </h2>
            <p className="text-[11px] mt-0.5 text-gray-500/80">
              {showCustom ? `Customize ${form.name || "your piece"} before placing` : "Choose a preset or create custom"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/20 border border-white/30 text-gray-500/80
                       hover:bg-white/40 transition-all duration-150"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        {/* ── Presets grid ── */}
        {!showCustom && (
          <div className="px-6 pt-4 pb-2">
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className="group flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-150
                             bg-white/15 border border-white/25 hover:bg-white/30 hover:border-white/45
                             hover:shadow-[0_4px_16px_rgba(99,102,241,0.15)] active:scale-[0.97]"
                >
                  <span className="text-xl leading-none">{p.icon}</span>
                  <span className="text-[11px] font-semibold text-gray-800/90">{p.name}</span>
                  <span className="text-[9px] tabular-nums text-gray-500/70">
                    {p.w}×{p.d}×{p.h}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setForm({ name: "", width: 80, height: 75, depth: 50, color: PALETTE[0] }); setShowCustom(true); }}
              className="w-full mt-2 py-2.5 rounded-2xl text-[11px] font-semibold transition-all duration-150
                         bg-white/10 border border-dashed border-white/35 text-gray-600/80
                         hover:bg-white/20 hover:border-white/50"
            >
              + Custom dimensions
            </button>
          </div>
        )}

        {/* ── Custom form ── */}
        {showCustom && (
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-4 pb-1 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 text-gray-500/80">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standing Desk"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-2xl px-3 py-2 text-[13px] outline-none transition-all duration-150
                             focus:ring-2 focus:ring-white/50 bg-white/20 border border-white/30
                             backdrop-blur-sm text-gray-900 placeholder-gray-400/70 font-medium"
                  autoFocus
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 text-gray-500/80">
                  Size <span className="normal-case font-normal">(cm)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["width", "height", "depth"] as const).map((dim) => (
                    <div key={dim} className="relative">
                      <span
                        className="absolute left-0 top-0 w-7 h-full flex items-center justify-center text-[9px] font-bold uppercase rounded-l-2xl
                                   text-gray-400/80 bg-white/20 border-r border-white/20 z-10"
                      >
                        {dim === "width" ? "W" : dim === "height" ? "H" : "D"}
                      </span>
                      <input
                        type="number" min={5} max={500} required
                        value={form[dim]}
                        onChange={(e) => setForm((f) => ({ ...f, [dim]: Number(e.target.value) }))}
                        className="w-full rounded-2xl pl-8 pr-2 py-2 text-[13px] text-right outline-none transition-all
                                   focus:ring-2 focus:ring-white/50 tabular-nums font-medium text-gray-900
                                   bg-white/20 border border-white/30 backdrop-blur-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2 text-gray-500/80">
                  Material color
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {PALETTE.map((c) => {
                    const active = form.color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className="relative w-[28px] h-[28px] rounded-full transition-all duration-150"
                        style={{
                          backgroundColor: c,
                          border: active ? `2.5px solid rgba(99,102,241,0.8)` : `1.5px solid rgba(255,255,255,0.4)`,
                          boxShadow: active ? "0 0 0 3px rgba(99,102,241,0.25), 0 2px 8px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.1)",
                          transform: active ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        {active && (
                          <svg className="absolute inset-0 m-auto" width="12" height="12" viewBox="0 0 12 12" fill="none"
                               stroke={c === "#FFFFFF" || c === "#F5F0EB" || c === "#D4C5B2" || c === "#C4A882" ? "#555" : "white"}
                               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.5 6l2.5 2.5L9.5 4" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Texture upload */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5 text-gray-500/80">
                  Texture <span className="normal-case font-normal">(optional)</span>
                </label>
                {!form.imageUrl ? (
                  <label
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-[11px] font-semibold cursor-pointer
                               transition-all duration-150 bg-white/10 border border-dashed border-white/35 text-gray-500/80
                               hover:bg-white/20 hover:border-white/50"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M7 3v8M3.5 7h7" />
                    </svg>
                    Upload image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <img src={form.imageUrl} alt="preview" className="w-11 h-11 object-cover rounded-2xl"
                         style={{ border: "1.5px solid rgba(255,255,255,0.35)" }} />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: undefined }))}
                            className="text-[11px] font-semibold text-rose-400/90 hover:text-rose-500 transition-colors">
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center gap-2 px-6 py-4 mt-1 border-t border-white/20">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="px-3 py-2 rounded-2xl text-[12px] font-semibold transition-all duration-150
                           bg-white/15 border border-white/25 text-gray-600/90 hover:bg-white/30"
              >
                ← Back
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 rounded-2xl text-[12px] font-semibold transition-all duration-150
                           bg-white/15 border border-white/25 text-gray-600/90 hover:bg-white/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-2xl text-[12px] font-semibold text-white transition-all duration-200
                           hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                Place in Room
              </button>
            </div>
          </form>
        )}

        {/* Spacing at bottom when on presets view */}
        {!showCustom && <div className="h-4" />}
      </div>
    </div>
  );
}
