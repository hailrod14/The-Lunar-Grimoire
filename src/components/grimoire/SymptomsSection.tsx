"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { DateKey } from "@/lib/dates";
import { addCustomSymptom, setSymptom } from "@/lib/grimoire";
import { dispatch } from "@/lib/store";
import { SEVERITY_LABEL, availableSymptoms } from "@/lib/symptoms";
import type { DayEntry, Grimoire, SymptomSeverity } from "@/lib/types";
import { Section } from "./Section";

const PIP_COLOR: Record<SymptomSeverity, string> = { 1: "bg-violet-300", 2: "bg-gold-500", 3: "bg-blood" };

/** Tap a symptom to cycle: mild → moderate → strong → off. */
export function SymptomsSection({ g, date, day }: { g: Grimoire; date: DateKey; day: DayEntry }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const symptoms = availableSymptoms(g);
  const severityOf = (id: string) => day.symptoms.find((s) => s.id === id)?.severity ?? 0;
  // A retired custom symptom logged on this day still shows, so history stays visible.
  const extra = day.symptoms.filter((s) => !symptoms.some((a) => a.id === s.id));

  const cycle = (id: string) => {
    const next = ((severityOf(id) + 1) % 4) as SymptomSeverity | 0;
    dispatch((x) => setSymptom(x, date, id, next));
  };

  return (
    <Section title="Symptoms">
      <p className="font-journal text-lg text-silver-500">Tap to mark mild, again for moderate, again for strong, once more to clear.</p>
      <div className="flex flex-wrap gap-1.5">
        {[...symptoms, ...extra.map((s) => ({ id: s.id, name: g.customSymptoms.find((c) => c.id === s.id)?.name ?? "Retired symptom" }))].map((s) => {
          const severity = severityOf(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => cycle(s.id)}
              aria-label={`${s.name}: ${severity ? SEVERITY_LABEL[severity] : "not felt"}. Tap to change.`}
              className={`flex items-center gap-1.5 px-2 py-1 text-sm ${severity ? "bg-midnight-600 text-silver-100" : "bg-midnight-950 text-silver-500 hover:text-silver-300"}`}
            >
              {s.name}
              {severity > 0 && (
                <span aria-hidden className="flex gap-px">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`size-1.5 ${n <= severity ? PIP_COLOR[severity as SymptomSeverity] : "bg-midnight-800"}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {adding ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            dispatch((x) => addCustomSymptom(x, name));
            setName("");
            setAdding(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dizziness"
            aria-label="New symptom name"
            maxLength={40}
            className="min-w-0 flex-1 bg-midnight-950 px-2 py-1 font-journal text-lg text-silver-100 shadow-[0_0_0_4px_var(--color-violet-500)]"
          />
          <button type="submit" className="pixel-button pixel-button--gold">
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} className="pixel-button pixel-button--ghost">
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="pixel-button pixel-button--ghost">
          <Plus size={14} strokeWidth={3} /> Add your own
        </button>
      )}
    </Section>
  );
}
