"use client";

import { useState } from "react";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { Minus, Plus } from "lucide-react";
import { dateKey, nowTime } from "@/lib/dates";
import { LIQUID_COLORS, VESSELS, VESSEL_NAMES, WEEKDAYS_SHORT, stamp, type LiquidColor, type Vessel } from "@/lib/potions";
import type { Potion, Schedule, Supply } from "@/lib/types";
import { Stepper } from "./Controls";
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

const UNITS = ["pills", "capsules", "tablets", "gummies", "ml", "drops", "sachets", "doses"];

/** A likely unit for a vessel, as a starting point. */
const UNIT_FOR: Record<Vessel, string> = {
  flask: "ml",
  vial: "ml",
  dropper: "drops",
  capsule: "capsules",
  tablet: "tablets",
  bottle: "pills",
  herbs: "doses",
  crystal: "doses",
  cauldron: "doses",
};

/** Parse a count typed by hand: whole or decimal, never negative. */
const parseCount = (text: string) => {
  const n = Number(text.replace(",", "."));
  return text.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

type Props = {
  initial: PotionDraft;
  /** How much is left now, for a potion whose supply is already tracked. */
  supplyLeft?: number | null;
  onSave: (p: PotionDraft) => void;
  onCancel: () => void;
  saveLabel?: string;
};

export function PotionForm({ initial, supplyLeft = null, onSave, onCancel, saveLabel = "Save" }: Props) {
  const [p, setP] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const set = (patch: Partial<PotionDraft>) => setP((x) => ({ ...x, ...patch }));
  const [tracking, setTracking] = useState(Boolean(initial.supply));
  const [count, setCount] = useState(supplyLeft === null ? "" : String(supplyLeft));
  const [supply, setSupply] = useState<Omit<Supply, "amount" | "since">>({
    perDose: initial.supply?.perDose ?? 1,
    unit: initial.supply?.unit ?? UNIT_FOR[initial.vessel],
    warnDays: initial.supply?.warnDays ?? 7,
  });
  const countChanged = count !== (supplyLeft === null ? "" : String(supplyLeft));

  /** The supply to save: recounted now if the count was edited, otherwise as it was. */
  const savedSupply = (): Supply | undefined => {
    if (!tracking) return undefined;
    const amount = parseCount(count);
    if (initial.supply && !countChanged) return { ...initial.supply, ...supply };
    if (amount === null) return undefined;
    return { ...supply, amount, since: stamp(dateKey(new Date()), nowTime()) };
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!p.name.trim()) return;
        if (p.schedule === "weekly" && p.days.length === 0) return setProblem("Choose at least one day.");
        if (tracking && (!initial.supply || countChanged) && parseCount(count) === null) return setProblem("Enter how many you have now.");
        const scheduled = p.schedule !== "as-needed";
        onSave({
          ...p,
          name: p.name.trim(),
          dose: p.dose.trim(),
          times: scheduled ? [...new Set(p.times.filter(Boolean))].sort() : [],
          days: p.schedule === "weekly" ? [...p.days].sort((a, b) => a - b) : [],
          reminder: scheduled && p.reminder,
          supply: savedSupply(),
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

      <Section title="Apothecary shelf">
        <button
          type="button"
          aria-pressed={tracking}
          onClick={() => {
            if (!tracking && !initial.supply) setSupply((x) => ({ ...x, unit: UNIT_FOR[p.vessel] }));
            setTracking((t) => !t);
          }}
          className={`w-full px-3 py-2 text-left text-sm ${tracking ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-500"}`}
        >
          🧪 {tracking ? "Keeping count of my supply" : "Keep count of my supply"}
        </button>
        {tracking && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="space-y-1">
                <span className="block text-sm text-silver-300">How many you have now</span>
                <input
                  inputMode="decimal"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="30"
                  className="block w-28 bg-midnight-950 px-3 py-2 font-journal text-xl text-silver-100 outline-2 outline-violet-500 placeholder:text-silver-700 focus:outline-gold-300"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-sm text-silver-300">Counted in</span>
                <input
                  list="supply-units"
                  value={supply.unit}
                  onChange={(e) => setSupply((x) => ({ ...x, unit: e.target.value }))}
                  maxLength={20}
                  className="block w-36 bg-midnight-950 px-3 py-2 font-journal text-xl text-silver-100 outline-2 outline-violet-500 focus:outline-gold-300"
                />
                <datalist id="supply-units">
                  {UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </label>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-silver-300">Each dose uses</p>
              <Stepper
                label="Amount per dose"
                value={supply.perDose}
                min={0.5}
                max={50}
                step={0.5}
                unit={supply.unit || "each"}
                onChange={(n) => setSupply((x) => ({ ...x, perDose: n }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-silver-300">Nudge me to refill when there&apos;s this much left</p>
              <Stepper
                label="Days before running out"
                value={supply.warnDays}
                min={0}
                max={30}
                unit="days"
                onChange={(n) => setSupply((x) => ({ ...x, warnDays: n }))}
              />
            </div>
            <p className="font-journal text-base text-silver-500">Every dose you check off is taken from the count. Recount any time by changing the number above.</p>
          </div>
        )}
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
