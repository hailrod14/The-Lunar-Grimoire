"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePageTurn } from "@/components/pixel/usePageTurn";
import { BloodDropGlyph } from "@/components/sprites/Glyphs";
import { PHASE_LABEL, nextTideStart, tideDay, type Phase, type TideDay } from "@/lib/cycle";
import { addMonths, dateKey, formatMonth, formatShort, monthGrid, parseKey, type DateKey } from "@/lib/dates";
import { ELEMENT_INFO } from "@/lib/elements";
import { loggedElements } from "@/lib/grimoire";
import type { DayEntry, Grimoire } from "@/lib/types";
import { SkyBadge, TideBadge } from "./Badges";
import { TodayCard } from "./TodayCard";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export const PHASE_BG: Record<Phase, string> = {
  dark: "bg-tide-dark",
  waxing: "bg-tide-waxing",
  full: "bg-tide-full",
  waning: "bg-tide-waning",
};

/** Whether every daily potion was ticked off that day. */
function potionStatus(g: Grimoire, day?: DayEntry): "all" | "some" | "none" {
  const taken = new Set(day?.potionLogs.filter((l) => !l.extra).map((l) => l.potionId));
  if (taken.size === 0) return "none";
  const daily = g.potions.filter((p) => p.schedule === "daily" && !p.archived);
  return daily.every((p) => taken.has(p.id)) ? "all" : "some";
}

/** The lines under "Your Tide" in the header. */
export function tideLines(g: Grimoire, today: DateKey, tide: TideDay | null): string[] {
  if (!tide) return ["Tap “My tide has begun” when it arrives."];
  if (tide.bleeding) return [`Tide flowing · Day ${tide.cycleDay}`];
  if (tide.daysLate > 0) return [`Day ${tide.cycleDay}`, `${tide.daysLate} day${tide.daysLate === 1 ? "" : "s"} late`];
  const next = nextTideStart(g.tides, g.settings, today);
  return [`Day ${tide.cycleDay}`, ...(next ? [`Next tide ~${formatShort(parseKey(next))}`] : [])];
}

export function CalendarView({ g, today, onOpenDay }: { g: Grimoire; today: DateKey; onOpenDay: (d: DateKey) => void }) {
  const [month, setMonth] = useState(() => {
    const t = parseKey(today);
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const { pageRef, overlay, turn } = usePageTurn();
  const tracking = g.settings.cycleTracking;
  const todayTide = tideDay(today, g.tides, g.settings, today);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        {tracking ? (
          <TideBadge tide={todayTide} lines={tideLines(g, today, todayTide)} />
        ) : (
          <p className="font-journal text-lg text-silver-500">Cycle tracking is off. Moods and potions only.</p>
        )}
        <SkyBadge date={today} />
      </header>

      <section aria-label="Calendar" className="relative">
        <div ref={pageRef}>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => turn("backward", () => setMonth((m) => addMonths(m, -1)))}
              className="p-1 text-gold-300"
            >
              <ChevronLeft strokeWidth={3} />
            </button>
            <h2 className="pixel-title text-xl">{formatMonth(month)}</h2>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => turn("forward", () => setMonth((m) => addMonths(m, 1)))}
              className="p-1 text-gold-300"
            >
              <ChevronRight strokeWidth={3} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-silver-500">
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthGrid(month)
              .flat()
              .map((d, i) => {
                if (!d) return <span key={i} />;
                const key = dateKey(d);
                const tide = tideDay(key, g.tides, g.settings, today);
                const entry = g.days[key];
                const future = key > today;
                const elements = loggedElements(entry);
                const status = future ? "none" : potionStatus(g, entry);
                const bled = tide?.bleeding || Boolean(entry?.flow);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onOpenDay(key)}
                    aria-label={`${d.toDateString()}${tide ? `, ${tide.predicted ? "predicted " : ""}${PHASE_LABEL[tide.phase]}` : ""}`}
                    aria-current={key === today ? "date" : undefined}
                    className={`flex aspect-square flex-col bg-midnight-950 p-1 text-left hover:bg-midnight-700 ${
                      key === today ? "outline-2 outline-gold-300" : ""
                    } ${future ? "text-silver-500" : "text-silver-100"}`}
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
                      {status !== "none" && <span className={`size-1.5 ${status === "all" ? "bg-gold-300" : "bg-gold-900"}`} />}
                    </span>
                    <span className={`mt-0.5 h-1 w-full ${tide ? PHASE_BG[tide.phase] : ""} ${tide?.predicted ? "opacity-35" : ""}`} />
                  </button>
                );
              })}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-journal text-base text-silver-300">
            {tracking &&
              (["dark", "waxing", "full", "waning"] as const).map((p) => (
                <li key={p} className="flex items-center gap-1">
                  <span className={`h-1 w-3 ${PHASE_BG[p]}`} /> {PHASE_LABEL[p]}
                </li>
              ))}
            {tracking && (
              <li className="flex items-center gap-1">
                <BloodDropGlyph size={7} /> Tide
              </li>
            )}
            <li className="flex items-center gap-1">
              <span className="size-1.5 bg-gold-300" /> All potions
            </li>
            {tracking && (
              <li className="flex items-center gap-1">
                <span className="h-1 w-3 bg-tide-waxing opacity-35" /> Predicted
              </li>
            )}
          </ul>
        </div>
        {overlay}
      </section>

      <TodayCard g={g} today={today} tide={todayTide} onOpenToday={() => onOpenDay(today)} />
    </div>
  );
}
