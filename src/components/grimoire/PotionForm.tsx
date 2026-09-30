"use client";

import { useState } from "react";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { LIQUID_COLORS, VESSELS, VESSEL_NAMES, type LiquidColor } from "@/lib/potions";
import type { Potion } from "@/lib/types";
import { Section } from "./Section";

export type PotionDraft = Omit<Potion, "id"> & { id?: string };

export const BLANK_POTION: PotionDraft = {
  name: "",
  dose: "",
  time: "09:00",
  vessel: "flask",
  color: "gold",
  schedule: "daily",
  archived: false,
};

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
  const set = (patch: Partial<PotionDraft>) => setP((x) => ({ ...x, ...patch }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!p.name.trim()) return;
        onSave({ ...p, name: p.name.trim(), dose: p.dose.trim(), time: p.schedule === "daily" ? p.time : "" });
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
        <div className="grid grid-cols-2 gap-1">
          {(["daily", "as-needed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={p.schedule === s}
              onClick={() => set({ schedule: s, time: s === "daily" && !p.time ? "09:00" : p.time })}
              className={`py-2 text-sm ${p.schedule === s ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-500"}`}
            >
              {s === "daily" ? "Every day" : "As needed"}
            </button>
          ))}
        </div>
        {p.schedule === "daily" && (
          <label className="block space-y-1">
            <span className="text-sm text-silver-300">Usual time</span>
            <input type="time" required className={input} value={p.time} onChange={(e) => set({ time: e.target.value })} />
          </label>
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
