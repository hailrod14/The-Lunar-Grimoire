"use client";

import { useState } from "react";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { Minus, Plus } from "lucide-react";
import { LIQUID_COLORS, VESSELS, VESSEL_NAMES, WEEKDAYS_SHORT, type LiquidColor } from "@/lib/potions";
import type { Potion, Schedule } from "@/lib/types";
import { Section } from "./Section";

export type PotionDraft = Omit<Potion, "id"> & { id?: string };

export const BLANK_POTION: PotionDraft = {
  name: "",
  dose: "",
  times: ["09:00"],
  days: [],
  vessel: "flask",
  color: "gold",
  schedule: "daily",
  archived: false,
  reminder: false,
};

const SCHEDULES: { id: Schedule; label: string }[] = [
  { id: "daily", label: "Every day" },
  { id: "weekly", label: "Certain days" },
  { id: "as-needed", label: "As needed" },
];

const MAX_DOSES = 6;

/** A sensible next dose time: 12 hours after the last (or 9 pm). */
function nextTime(times: string[]): string {
  const last = times.at(-1);
  if (!last) return "09:00";
  const h = (Number(last.slice(0, 2)) + 12) % 24;
  return `${String(h).padStart(2, "0")}:${last.slice(3)}`;
}

const input =
  "pixel-frame block w-[calc(100%-8px)] bg-midnight-950 px-3 py-2 font-journal text-xl text-silver-100 placeholder:text-silver-700 focus:outline-none";

type Props = {
  initial: PotionDraft;
  onSave: (p: PotionDraft) => void;
  onCancel: () => void;
  saveLabel?: string;
};

export function PotionForm({ initial, onSave, onCancel, saveLabel = "Save" }: Props) {
  const [p, setP] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const set = (patch: Partial<PotionDraft>) => setP((x) => ({ ...x, ...patch }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!p.name.trim()) return;
        if (p.schedule === "weekly" && p.days.length === 0) return setProblem("Choose at least one day.");
        const scheduled = p.schedule !== "as-needed";
        onSave({
          ...p,
          name: p.name.trim(),
          dose: p.dose.trim(),
          times: scheduled ? [...new Set(p.times.filter(Boolean))].sort() : [],
          days: p.schedule === "weekly" ? [...p.days].sort((a, b) => a - b) : [],
          reminder: scheduled && p.reminder,
        });
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="animate-float">
          <VesselSprite vessel={p.vessel} color={p.color} size={72} />
        </div>
        <h2 className="pixel-title text-xl">{initial.id ? "Edit potion" : "Brew a new potion"}</h2>
      </div>

      <Section title="Label">
        <label className="block space-y-1">
          <span className="text-sm text-silver-300">Name</span>
          <input className={input} value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Magnesium Elixir" required autoFocus />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-silver-300">Dose</span>
          <input className={input} value={p.dose} onChange={(e) => set({ dose: e.target.value })} placeholder="200 mg" />
        </label>
      </Section>

      <Section title="When">
        <div className="grid grid-cols-3 gap-1">
          {SCHEDULES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={p.schedule === option.id}
              onClick={() => set({ schedule: option.id, times: option.id !== "as-needed" && p.times.length === 0 ? ["09:00"] : p.times })}
              className={`py-2 text-sm ${p.schedule === option.id ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-500"}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {p.schedule === "weekly" && (
          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Days of the week">
            {WEEKDAYS_SHORT.map((name, day) => {
              const on = p.days.includes(day);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setProblem(null);
                    set({ days: on ? p.days.filter((d) => d !== day) : [...p.days, day] });
                  }}
                  className={`py-2 text-xs ${on ? "bg-gold-500 text-midnight-950" : "bg-midnight-950 text-silver-500"}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        {p.schedule !== "as-needed" && (
          <div className="space-y-2">
            <span className="text-sm text-silver-300">{p.times.length > 1 ? "Dose times" : "Usual time"}</span>
            {p.times.map((time, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  required
                  aria-label={`Dose ${i + 1} time`}
                  className={input}
                  value={time}
                  onChange={(e) => set({ times: p.times.map((t, j) => (j === i ? e.target.value : t)) })}
                />
                {p.times.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove dose ${i + 1}`}
                    onClick={() => set({ times: p.times.filter((_, j) => j !== i) })}
                    className="grid size-9 shrink-0 place-items-center bg-midnight-950 text-silver-300 hover:text-blood"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
            {p.times.length < MAX_DOSES && (
              <button
                type="button"
                onClick={() => set({ times: [...p.times, nextTime(p.times)] })}
                className="pixel-button pixel-button--ghost"
              >
                <Plus size={14} strokeWidth={3} /> Another dose each day
              </button>
            )}
            <button
              type="button"
              aria-pressed={p.reminder}
              onClick={() => set({ reminder: !p.reminder })}
              className={`w-full px-3 py-2 text-left text-sm ${p.reminder ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-500"}`}
            >
              🔔 {p.reminder ? (p.times.length > 1 ? "Remind me at each time" : "Remind me at this time") : "No reminder"}
            </button>
          </div>
        )}
        {problem && (
          <p role="alert" className="font-journal text-lg text-fire">
            {problem}
          </p>
        )}
        <p className="font-journal text-base text-silver-500">Any potion can also have extra doses logged on the day page.</p>
      </Section>

      <Section title="Vessel">
        <div className="grid grid-cols-3 gap-1">
          {VESSELS.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={p.vessel === v}
              onClick={() => set({ vessel: v })}
              className={`flex flex-col items-center gap-1 py-2 ${p.vessel === v ? "bg-midnight-600 outline-2 outline-gold-300" : "bg-midnight-950"}`}
            >
              <VesselSprite vessel={v} color={p.color} size={32} />
              <span className="font-journal text-base leading-none text-silver-300">{VESSEL_NAMES[v]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Liquid color">
          {(Object.keys(LIQUID_COLORS) as LiquidColor[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={p.color === c}
              aria-label={c}
              onClick={() => set({ color: c })}
              className={`size-8 ${p.color === c ? "outline-2 outline-offset-2 outline-gold-300" : ""}`}
              style={{ background: LIQUID_COLORS[c] }}
            />
          ))}
        </div>
      </Section>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="pixel-button pixel-button--ghost flex-1">
          Cancel
        </button>
        <button type="submit" className="pixel-button pixel-button--gold flex-1">
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
