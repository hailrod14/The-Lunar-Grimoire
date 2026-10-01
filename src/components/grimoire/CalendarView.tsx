"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePageTurn } from "@/components/pixel/usePageTurn";
import { BloodDropGlyph, StarGlyph } from "@/components/sprites/Glyphs";
import { PHASE_LABEL, nextTideWindow, tideDay, type Phase, type TideDay } from "@/lib/cycle";
import { addMonths, dateKey, formatMonth, formatShort, monthGrid, parseKey, type DateKey } from "@/lib/dates";
import { ELEMENT_INFO } from "@/lib/elements";
import { loggedElements } from "@/lib/grimoire";
import { allDosesOn, doseLog } from "@/lib/potions";
import { skyDay, type SkyDay } from "@/lib/wheel";
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

/** Whether every scheduled dose was taken that day. */
function potionStatus(g: Grimoire, date: DateKey, day?: DayEntry): "all" | "some" | "none" {
  const doses = allDosesOn(g, date);
  const taken = doses.filter((d) => doseLog(day, d.potion.id, d.slot)).length;
  if (taken === 0) return day?.potionLogs.some((l) => !l.extra) ? "some" : "none";
  return taken === doses.length ? "all" : "some";
}

/** The lines under "Your Tide" in the header. */
export function tideLines(g: Grimoire, today: DateKey, tide: TideDay | null): string[] {
  if (!tide) return ["Tap “My tide has begun” when it arrives."];
  if (tide.bleeding) return [`Tide flowing · Day ${tide.cycleDay}`];
  if (tide.daysLate > 0) return [`Day ${tide.cycleDay}`, `${tide.daysLate} day${tide.daysLate === 1 ? "" : "s"} late`];
  const tideWindow = nextTideWindow(g.tides, g.settings, today);
  if (!tideWindow) return [`Day ${tide.cycleDay}`];
  return [`Day ${tide.cycleDay}`, `Next tide ${formatRange(tideWindow.earliest, tideWindow.latest)}`, `most likely ${formatShort(parseKey(tideWindow.likely))}`];
}

/** "Oct 15–19" or "Sep 29–Oct 3". */
export function formatRange(from: DateKey, to: DateKey): string {
  const a = parseKey(from);
  const b = parseKey(to);
  return a.getMonth() === b.getMonth() ? `${formatShort(a)}–${b.getDate()}` : `${formatShort(a)}–${formatShort(b)}`;
}

/** Tiny marks for a full or new moon and a sabbat on a calendar day. */
function SkyMarks({ sky }: { sky: SkyDay }) {
  return (
    <>
      {sky.moon && (
        <span
          aria-hidden
          className={`inline-block size-2 shrink-0 rounded-full ${sky.moon.kind === "full" ? "bg-silver-100" : "border border-silver-300 bg-midnight-950"}`}
        />
      )}
      {sky.sabbat && <StarGlyph size={10} />}
    </>
  );
}

export function CalendarView({ g, today, onOpenDay }: { g: Grimoire; today: DateKey; onOpenDay: (d: DateKey) => void }) {
  const [month, setMonth] = useState(() => {
    const t = parseKey(today);
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const { pageRef, overlay, turn } = usePageTurn();
  const tracking = g.settings.cycleTracking;
  const todayTide = tideDay(today, g.tides, g.settings, today);
  const tideWindow = nextTideWindow(g.tides, g.settings, today);
  const possibleTide = (key: DateKey) => Boolean(tideWindow && key > today && key >= tideWindow.earliest && key <= tideWindow.latest);

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
                const status = future ? "none" : potionStatus(g, key, entry);
                const bled = tide?.bleeding || Boolean(entry?.flow);
                const possible = possibleTide(key);
                const sky = skyDay(key, g.settings.hemisphere);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onOpenDay(key)}
                    aria-label={`${d.toDateString()}${tide ? `, ${tide.predicted ? "predicted " : ""}${PHASE_LABEL[tide.phase]}` : ""}${possible ? ", tide possible" : ""}${sky.sabbat ? `, ${sky.sabbat.name}` : ""}${sky.moon ? `, ${sky.moon.kind === "full" ? sky.moon.name : "New Moon"}` : ""}`}
                    aria-current={key === today ? "date" : undefined}
                    className={`flex aspect-square flex-col bg-midnight-950 p-1 text-left hover:bg-midnight-700 ${
                      key === today ? "outline-2 outline-gold-300" : ""
                    } ${future ? "text-silver-500" : "text-silver-100"}`}
                  >
                    <span className="flex items-start justify-between font-journal text-base leading-none">
                      <span className="flex items-center gap-0.5">
                        {d.getDate()}
                        <SkyMarks sky={sky} />
                      </span>
                      {bled ? (
                        <BloodDropGlyph size={7} />
                      ) : (
                        possible && (
                          <span className="opacity-40">
                            <BloodDropGlyph size={7} />
                          </span>
                        )
                      )}
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
            <li className="flex items-center gap-1">
              <SkyMarks sky={{ moon: { kind: "full", time: "", name: "" } }} /> Full moon
            </li>
            <li className="flex items-center gap-1">
              <SkyMarks sky={{ moon: { kind: "new", time: "", name: "" } }} /> New moon
            </li>
            <li className="flex items-center gap-1">
              <StarGlyph size={8} /> Sabbat
            </li>
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
            {tracking && tideWindow && (
              <li className="flex items-center gap-1">
                <span className="opacity-40">
                  <BloodDropGlyph size={7} />
                </span>{" "}
                Possible tide
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
