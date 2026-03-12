"use client";

import { useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import { getApartmentTemplate } from "@/lib/apartmentLayout";
import type { ApartmentType } from "@/types/apartment";

const OPTIONS: Array<{
  type: ApartmentType;
  label: string;
  sub: string;
}> = [
  { type: "empty-space", label: "Empty space",       sub: "Blank canvas" },
  { type: "studio",      label: "Studio",             sub: "Living · Kitchen · Bath" },
  { type: "two-room",    label: "2-room apartment",   sub: "Living · Bedroom · Bath" },
  { type: "three-room",  label: "3-room apartment",   sub: "Living · Kitchen · Bedroom · Bath" },
  { type: "four-room",   label: "4-room apartment",   sub: "Living · Kitchen · 2 Bedrooms · Bath" },
  { type: "loft",        label: "Loft",               sub: "Open volume · Bedroom · Bath" },
];

export default function ApartmentGenerator() {
  const generateApartment = useRoomStore((s) => s.generateApartment);
  const setAppState       = useRoomStore((s) => s.setAppState);
  const apartmentType     = useRoomStore((s) => s.apartmentType);
  const [hovered, setHovered] = useState<ApartmentType | null>(null);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#f0ece6]"
      style={{ fontFamily: "inherit" }}
    >
      <div className="w-full max-w-md px-6 py-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a09484] mb-6">
          Choose a layout
        </p>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#2c2824] leading-snug mb-12">
          What type of apartment<br />do you want to plan?
        </h1>

        <div className="flex flex-col gap-1">
          {OPTIONS.map((option) => {
            const template = getApartmentTemplate(option.type);
            const isActive = option.type === apartmentType;
            const isHovered = option.type === hovered;

            return (
              <button
                key={option.type}
                onClick={() => { generateApartment(option.type); setAppState("planner"); }}
                onMouseEnter={() => setHovered(option.type)}
                onMouseLeave={() => setHovered(null)}
                className="group flex items-center justify-between w-full px-5 py-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.985]"
                style={{
                  background: isActive
                    ? "rgba(44,40,36,0.08)"
                    : isHovered
                    ? "rgba(44,40,36,0.05)"
                    : "transparent",
                  border: `1px solid ${isActive ? "rgba(44,40,36,0.18)" : "rgba(44,40,36,0.08)"}`,
                }}
              >
                <div className="text-left">
                  <span className="block text-[15px] font-semibold text-[#2c2824] leading-tight">
                    {option.label}
                  </span>
                  <span className="block text-[12px] text-[#9a8e82] mt-0.5">
                    {option.sub}
                  </span>
                </div>
                <span className="text-[12px] font-medium text-[#b5a898] group-hover:text-[#6e6258] transition-colors tabular-nums">
                  {template.room.width} × {template.room.length} m
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setAppState("planner")}
          className="mt-10 text-[12px] font-medium text-[#a09484] hover:text-[#2c2824] transition-colors"
        >
          Skip — keep current layout
        </button>
      </div>
    </div>
  );
}
