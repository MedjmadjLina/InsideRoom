"use client";

import { useMemo, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import { getApartmentTemplate } from "@/lib/apartmentLayout";
import type { ApartmentType } from "@/types/apartment";

const OPTIONS: Array<{
  type: ApartmentType;
  label: string;
  sub: string;
  mood: string;
  badge?: string;
}> = [
  { type: "studio", label: "Studio", sub: "Living + Kitchen + Bath", mood: "Compact and efficient", badge: "Popular" },
  { type: "two-room", label: "2-room", sub: "Living + Bedroom + Bath", mood: "Balanced everyday plan", badge: "Easy start" },
  { type: "three-room", label: "3-room", sub: "Living + Kitchen + Bedroom + Bath", mood: "More separation, more rhythm" },
  { type: "four-room", label: "4-room", sub: "Living + Kitchen + 2 Bedrooms + Bath", mood: "Family-ready structure" },
  { type: "loft", label: "Loft", sub: "Open volume + Bedroom + Bath", mood: "Large open atmosphere", badge: "Open plan" },
  { type: "empty-space", label: "Empty space", sub: "Blank canvas", mood: "Start from pure volume" },
];

function PlanPreview({ type }: { type: ApartmentType }) {
  const template = getApartmentTemplate(type);
  const maxWidth = template.room.width;
  const maxLength = template.room.length;

  return (
    <div
      className="relative h-40 w-full overflow-hidden rounded-[24px]"
      style={{
        background:
          "linear-gradient(180deg, rgba(88,59,43,0.65), rgba(44,29,23,0.65))",
        border: "1px solid rgba(255,234,211,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,245,230,0.1)",
      }}
    >
      <div
        className="absolute inset-[12px] rounded-[18px]"
        style={{
          background: "rgba(250,235,214,0.06)",
          border: "1px solid rgba(255,234,211,0.09)",
        }}
      />
      {template.rooms.map((room) => {
        const previewRoom = room as {
          id: string;
          x1: number;
          x2: number;
          z1: number;
          z2: number;
          color: string;
        };
        const roomWidth = `${((previewRoom.x2 - previewRoom.x1) / maxWidth) * 100}%`;
        const roomHeight = `${((previewRoom.z2 - previewRoom.z1) / maxLength) * 100}%`;
        const left = `${((previewRoom.x1 + maxWidth / 2) / maxWidth) * 100}%`;
        const top = `${((previewRoom.z1 + maxLength / 2) / maxLength) * 100}%`;

        return (
          <div
            key={previewRoom.id}
            className="absolute overflow-hidden rounded-[14px]"
            style={{
              left: `calc(12px + (${left} * (100% - 24px) / 100))`,
              top: `calc(12px + (${top} * (100% - 24px) / 100))`,
              width: `calc(${roomWidth} * (100% - 24px) / 100)`,
              height: `calc(${roomHeight} * (100% - 24px) / 100)`,
              background: previewRoom.color,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
              border: "1px solid rgba(82,57,42,0.12)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.04))",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function ApartmentGenerator() {
  const generateApartment = useRoomStore((s) => s.generateApartment);
  const setAppState = useRoomStore((s) => s.setAppState);
  const apartmentType = useRoomStore((s) => s.apartmentType);
  const [hovered, setHovered] = useState<ApartmentType | null>(null);

  const featured = useMemo(() => OPTIONS[0], []);
  const remaining = useMemo(() => OPTIONS.slice(1), []);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top, rgba(255,216,168,0.18), transparent 26%), linear-gradient(180deg, #241a16 0%, #36261f 30%, #6d4b39 66%, #e2cfbb 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 14% 16%, rgba(255,226,192,0.16), transparent 24%), radial-gradient(circle at 84% 28%, rgba(117,77,53,0.24), transparent 18%), radial-gradient(circle at 78% 80%, rgba(255,213,159,0.12), transparent 14%), linear-gradient(180deg, rgba(16,10,8,0.16), rgba(16,10,8,0.48))",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_1.35fr]">
          <section
            className="rounded-[36px] p-6 lg:p-8"
            style={{
              background: "linear-gradient(180deg, rgba(72,49,38,0.58), rgba(34,23,18,0.40))",
              border: "1px solid rgba(255,228,197,0.14)",
              boxShadow: "0 30px 70px rgba(10,7,6,0.28), inset 0 1px 0 rgba(255,241,223,0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d7baa0]">
              Choose a layout
            </p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#fff1e0]">
              Pick a plan
              <br />
              with a bit more character
            </h1>
            <p className="mt-5 max-w-[28rem] text-[14px] leading-6 text-[#dbc2ac]">
              Start from a compact shell, a more separated apartment, or a larger open volume.
              The structure is editable once you enter the planner.
            </p>

            <div className="mt-8 rounded-[30px] p-4"
              style={{
                background: "linear-gradient(180deg, rgba(255,228,197,0.10), rgba(255,228,197,0.04))",
                border: "1px solid rgba(255,228,197,0.12)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a3b28]"
                  style={{ background: "#f0d3ad" }}
                >
                  Suggested start
                </span>
                <span className="text-[11px] font-medium text-[#d8bca2]">
                  Flexible and fast
                </span>
              </div>

              <button
                onClick={() => {
                  generateApartment(featured.type);
                  setAppState("planner");
                }}
                onMouseEnter={() => setHovered(featured.type)}
                onMouseLeave={() => setHovered(null)}
                className="mt-4 block w-full text-left transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                <PlanPreview type={featured.type} />
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[22px] font-semibold tracking-[-0.03em] text-[#fff1e0]">
                      {featured.label}
                    </div>
                    <div className="mt-1 text-[13px] text-[#d4b59a]">{featured.sub}</div>
                    <div className="mt-3 text-[12px] uppercase tracking-[0.16em] text-[#b99678]">
                      {featured.mood}
                    </div>
                  </div>
                  <div className="rounded-2xl px-4 py-3 text-right"
                    style={{
                      background: hovered === featured.type ? "rgba(255,227,196,0.14)" : "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,227,196,0.12)",
                    }}
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#c7a88c]">Enter</div>
                    <div className="mt-1 text-[18px] text-[#fff1e0]">03D</div>
                  </div>
                </div>
              </button>
            </div>

          <button
            onClick={() => setAppState("planner")}
            className="mt-8 text-[12px] font-medium text-[#d3b69b] transition-colors hover:text-[#fff1e0]"
          >
              Skip and keep current layout
            </button>
          </section>

          <section
            className="rounded-[36px] p-5 lg:p-6"
            style={{
              background: "linear-gradient(180deg, rgba(64,43,34,0.42), rgba(30,20,16,0.34))",
              border: "1px solid rgba(255,228,197,0.12)",
              boxShadow: "0 30px 70px rgba(10,7,6,0.18), inset 0 1px 0 rgba(255,241,223,0.10)",
              backdropFilter: "blur(18px)",
            }}
          >
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d7baa0]">
                  More structures
                </p>
                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#fff1e0]">
                  Browse by spatial feel
                </h2>
              </div>
              <div className="text-right text-[12px] text-[#d4b59a]">
                Select a base plan,
                <br />
                then refine it in 3D.
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {remaining.map((option) => {
                const template = getApartmentTemplate(option.type);
                const isActive = option.type === apartmentType;
                const isHovered = option.type === hovered;

                return (
                  <button
                    key={option.type}
                    onClick={() => {
                      generateApartment(option.type);
                      setAppState("planner");
                    }}
                    onMouseEnter={() => setHovered(option.type)}
                    onMouseLeave={() => setHovered(null)}
                    className="group rounded-[28px] p-3 text-left transition-all duration-200 hover:-translate-y-1 active:translate-y-0"
                    style={{
                      background: isActive
                        ? "linear-gradient(180deg, rgba(255,228,197,0.14), rgba(255,228,197,0.08))"
                        : isHovered
                          ? "linear-gradient(180deg, rgba(255,228,197,0.10), rgba(255,228,197,0.05))"
                          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                      border: `1px solid ${isActive ? "rgba(255,228,197,0.24)" : "rgba(255,228,197,0.10)"}`,
                      boxShadow: isHovered ? "0 20px 30px rgba(11,8,7,0.16)" : "none",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[18px] font-semibold tracking-[-0.03em] text-[#fff1e0]">
                          {option.label}
                        </div>
                        <div className="mt-1 text-[12px] leading-5 text-[#d4b59a]">{option.sub}</div>
                      </div>
                      {option.badge ? (
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a3b28]"
                          style={{ background: "#f0d3ad" }}
                        >
                          {option.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <PlanPreview type={option.type} />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.15em] text-[#bc9b7f]">
                          Atmosphere
                        </div>
                        <div className="mt-1 text-[13px] text-[#ecd8c5]">{option.mood}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] uppercase tracking-[0.15em] text-[#bc9b7f]">
                          Size
                        </div>
                        <div className="mt-1 text-[13px] font-medium text-[#ecd8c5]">
                          {template.room.width} x {template.room.length} m
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
