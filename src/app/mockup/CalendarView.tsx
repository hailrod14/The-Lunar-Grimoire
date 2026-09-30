"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePageTurn } from "@/components/pixel/usePageTurn";
import { BloodDropGlyph } from "@/components/sprites/Glyphs";
import { addMonths, dateKey, diffDays, formatMonth, formatShort, monthGrid } from "@/lib/dates";
import { ELEMENT_INFO, type ElementLog } from "@/lib/elements";
import { SkyBadge, TideBadge } from "./Badges";
import { NEXT_TIDE, PHASE_BG, PHASE_LABEL, TODAY, tideFor, type DayMock, type Potion } from "./mockData";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function loggedElements(day?: DayMock): ElementLog["element"][] {
  if (!day) return [];
  const all = [...day.elements.morning, ...day.elements.afternoon, ...day.elements.night].map((e) => e.element);
  return [...new Set(all)];
}

function potionStatus(day: DayMock | undefined, potions: Potion[]): "all" | "some" | "none" {
  const daily = potions.filter((p) => p.schedule === "daily");
  const taken = daily.filter((p) => day?.taken[p.id]).length;
  return taken === 0 ? "none" : taken === daily.length ? "all" : "some";
}

type Props = {
  days: Record<string, DayMock>;
  potions: Potion[];
  onOpenDay: (d: Date) => void;
};

export function CalendarView({ days, potions, onOpenDay }: Props) {
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const todayTide = tideFor(TODAY);
  const today = days[dateKey(TODAY)];
  const { pageRef, overlay, turn } = usePageTurn();
  const daily = potions.filter((p) => p.schedule === "daily");

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <TideBadge tide={todayTide} detail={`Next tide ~${formatShort(NEXT_TIDE)}`} />
        <SkyBadge date={TODAY} />
      </header>

      <section aria-label="Calendar" className="relative">
        <div ref={pageRef}>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => turn("backward", () => setMonth((m) => addMonths(m, -1)))} className="p-1 text-gold-300">
              <ChevronLeft strokeWidth={3} />
            </button>
            <h2 className="pixel-title text-xl">{formatMonth(month)}</h2>
            <button type="button" aria-label="Next month" onClick={() => turn("forward", () => setMonth((m) => addMonths(m, 1)))} className="p-1 text-gold-300">
              <ChevronRight strokeWidth={3} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-silver-500">
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthGrid(month).flat().map((d, i) => {
              if (!d) return <span key={i} />;
              const tide = tideFor(d);
              const data = days[dateKey(d)];
              const isToday = diffDays(d, TODAY) === 0;
              const elements = loggedElements(data);
              const status = tide.predicted ? "none" : potionStatus(data, potions);
              const bled = Boolean(data?.flow);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onOpenDay(d)}
                  aria-label={`${d.toDateString()}, ${tide.predicted ? "predicted " : ""}${PHASE_LABEL[tide.phase]}`}
                  className={`flex aspect-square flex-col bg-midnight-950 p-1 text-left hover:bg-midnight-700 ${
                    isToday ? "outline-2 outline-gold-300" : ""
                  } ${tide.predicted ? "text-silver-500" : "text-silver-100"}`}
                >
                  <span className="flex items-start justify-between text-xs leading-none">
                    {d.getDate()}
                    {bled && <BloodDropGlyph size={7} />}
                  </span>
                  <span className="mt-auto flex items-end justify-between">
                    <span className="flex gap-px">
                      {elements.map((e) => (
                        <span key={e} className={`size-1 ${ELEMENT_INFO[e].bg}`} />
                      ))}
                    </span>
                    {status !== "none" && (
                      <span className={`size-1.5 ${status === "all" ? "bg-gold-300" : "bg-gold-900"}`} />
                    )}
                  </span>
                  <span className={`mt-0.5 h-1 w-full ${PHASE_BG[tide.phase]} ${tide.predicted ? "opacity-35" : ""}`} />
                </button>
              );
            })}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-journal text-base text-silver-300">
            {(["dark", "waxing", "full", "waning"] as const).map((p) => (
              <li key={p} className="flex items-center gap-1">
                <span className={`h-1 w-3 ${PHASE_BG[p]}`} /> {PHASE_LABEL[p]}
              </li>
            ))}
            <li className="flex items-center gap-1">
              <BloodDropGlyph size={7} /> Tide
            </li>
            <li className="flex items-center gap-1">
              <span className="size-1.5 bg-gold-300" /> All potions
            </li>
            <li className="flex items-center gap-1">
              <span className="h-1 w-3 bg-tide-waxing opacity-35" /> Predicted
            </li>
          </ul>
        </div>
        {overlay}
      </section>

      <section className="pixel-frame space-y-3 p-3">
        <h3 className="text-gold-300">Today</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-journal text-lg text-silver-300">
          <span>
            Elements: {loggedElements(today).map((e) => ELEMENT_INFO[e].name).join(", ") || "none yet"}
          </span>
          <span>
            Potions: {daily.filter((p) => today?.taken[p.id]).length} of {daily.length} taken
          </span>
          <span>Journal: {today?.journal ? "written" : "not yet"}</span>
        </div>
        <button type="button" onClick={() => onOpenDay(TODAY)} className="pixel-button pixel-button--gold w-full">
          Open today&apos;s page
        </button>
      </section>
    </div>
  );
}
