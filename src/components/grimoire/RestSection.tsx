"use client";

import { Minus, Plus } from "lucide-react";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import type { DateKey } from "@/lib/dates";
import { setRest } from "@/lib/grimoire";
import { dispatch } from "@/lib/store";
import type { DayEntry, Level } from "@/lib/types";
import { Section } from "./Section";

export const SLEEP_QUALITY: Record<Level, string> = { 1: "Restless", 2: "Light", 3: "Okay", 4: "Good", 5: "Deep" };
export const ENERGY: Record<Level, string> = { 1: "Drained", 2: "Low", 3: "Steady", 4: "Bright", 5: "Sparkling" };
const LEVELS: Level[] = [1, 2, 3, 4, 5];

/** "7½ hours" */
export const formatHours = (h: number) => (h === 0.5 ? "½ hour" : `${Math.floor(h)}${h % 1 ? "½" : ""} hour${h === 1 ? "" : "s"}`);

function Pips({ n }: { n: number }) {
  return (
    <span aria-hidden className="flex gap-0.5">
      {LEVELS.map((i) => (
        <span key={i} className={`size-1.5 ${i <= n ? "bg-gold-300" : "bg-midnight-600"}`} />
      ))}
    </span>
  );
}

function LevelPicker({
  label,
  names,
  value,
  icon,
  onPick,
}: {
  label: string;
  names: Record<Level, string>;
  value?: Level;
  icon: (n: Level) => React.ReactNode;
  onPick: (n: Level | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-silver-300">{label}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(4.25rem,1fr))] gap-1" role="group" aria-label={label}>
        {LEVELS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onPick(value === n ? undefined : n)}
            className={`flex flex-col items-center gap-1 px-1 py-2 ${value === n ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-300 hover:bg-midnight-700"}`}
          >
            {icon(n)}
            <span className="font-journal text-base leading-tight">{names[n]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function RestSection({ date, day }: { date: DateKey; day: DayEntry }) {
  const rest = day.rest ?? {};
  const hours = rest.sleepHours;
  const setHours = (h: number | undefined) => dispatch((g) => setRest(g, date, { sleepHours: h }));

  return (
    <Section title="Rest & energy">
      <div className="space-y-1">
        <p className="text-sm text-silver-300">Sleep last night</p>
        <div className="flex items-center gap-2" role="group" aria-label="Hours of sleep">
          <button
            type="button"
            aria-label="Half an hour less"
            disabled={hours === 0}
            onClick={() => setHours(Math.max(0, (hours ?? 7.5) - 0.5))}
            className="pixel-button pixel-button--ghost px-3 disabled:opacity-40"
          >
            <Minus size={16} strokeWidth={3} />
          </button>
          <span aria-live="polite" className="min-w-28 text-center font-journal text-2xl text-gold-300">
            {hours === undefined ? <span className="text-silver-500">not logged</span> : formatHours(hours)}
          </span>
          <button
            type="button"
            aria-label="Half an hour more"
            disabled={hours === 16}
            onClick={() => setHours(Math.min(16, (hours ?? 7) + 0.5))}
            className="pixel-button pixel-button--ghost px-3 disabled:opacity-40"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
          {hours !== undefined && (
            <button type="button" onClick={() => setHours(undefined)} className="font-journal text-base text-violet-300 underline">
              Clear
            </button>
          )}
        </div>
      </div>
      <LevelPicker
        label="How you slept"
        names={SLEEP_QUALITY}
        value={rest.sleepQuality}
        icon={(n) => <PixelMoon phase={[0.04, 0.12, 0.25, 0.37, 0.5][n - 1]} variant="sky" size={18} resolution={10} />}
        onPick={(n) => dispatch((g) => setRest(g, date, { sleepQuality: n }))}
      />
      <LevelPicker
        label="Energy today"
        names={ENERGY}
        value={rest.energy}
        icon={(n) => <Pips n={n} />}
        onPick={(n) => dispatch((g) => setRest(g, date, { energy: n }))}
      />
    </Section>
  );
}
