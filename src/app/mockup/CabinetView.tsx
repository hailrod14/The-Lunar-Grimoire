"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { LIQUID_COLORS, VESSELS, VESSEL_NAMES, VesselSprite, type LiquidColor } from "@/components/sprites/VesselSprite";
import { Section } from "./DayView";
import { displayTime, type Potion } from "./mockData";

type Props = { potions: Potion[]; setPotions: (fn: (p: Potion[]) => Potion[]) => void };

const BLANK: Potion = { id: "", name: "", dose: "", time: "09:00", vessel: "flask", color: "gold", schedule: "daily" };

export function CabinetView({ potions, setPotions }: Props) {
  const [editing, setEditing] = useState<Potion | null>(null);

  if (editing) {
    return (
      <PotionForm
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={(p) => {
          setPotions((list) => (p.id ? list.map((x) => (x.id === p.id ? p : x)) : [...list, { ...p, id: crypto.randomUUID() }]));
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Potion &amp; Elixir Cabinet</h2>
      <p className="text-center font-journal text-lg text-silver-300">
        Your potions live here. You check them off on each day&apos;s page.
      </p>
      <div className="space-y-2">
        {potions.map((p) => (
          <div key={p.id} className="pixel-frame flex items-center gap-3 p-3">
            <VesselSprite vessel={p.vessel} color={p.color} size={40} title={VESSEL_NAMES[p.vessel]} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-silver-100">{p.name}</p>
              <p className="font-journal text-lg leading-tight text-silver-500">
                {p.dose} · {p.schedule === "daily" ? `daily at ${displayTime(p.time)}` : "as needed"}
              </p>
            </div>
            <button type="button" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)} className="p-2 text-silver-500 hover:text-gold-300">
              <Pencil size={18} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setEditing(BLANK)} className="pixel-button pixel-button--gold w-full">
        <Plus size={16} strokeWidth={3} /> Brew a new potion
      </button>
    </div>
  );
}

function PotionForm({ initial, onSave, onCancel }: { initial: Potion; onSave: (p: Potion) => void; onCancel: () => void }) {
  const [p, setP] = useState(initial);
  const set = (patch: Partial<Potion>) => setP((x) => ({ ...x, ...patch }));
  const input = "pixel-frame block w-[calc(100%-8px)] bg-midnight-950 px-3 py-2 font-journal text-xl text-silver-100 focus:outline-none";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (p.name.trim()) onSave(p);
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
          <input className={input} value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Magnesium Elixir" required />
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
              onClick={() => set({ schedule: s })}
              className={`py-2 text-sm ${p.schedule === s ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-500"}`}
            >
              {s === "daily" ? "Every day" : "As needed"}
            </button>
          ))}
        </div>
        {p.schedule === "daily" && (
          <label className="block space-y-1">
            <span className="text-sm text-silver-300">Usual time</span>
            <input type="time" className={input} value={p.time} onChange={(e) => set({ time: e.target.value })} />
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
          Save
        </button>
      </div>
    </form>
  );
}
