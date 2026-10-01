"use client";

import { useState } from "react";
import { ArchiveRestore, Pencil, Plus } from "lucide-react";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { archivePotion, deletePotion, potionHasHistory, savePotion } from "@/lib/grimoire";
import { VESSEL_NAMES, describeSchedule } from "@/lib/potions";
import { dispatch } from "@/lib/store";
import type { Grimoire, Potion } from "@/lib/types";
import { BLANK_POTION, PotionForm, type PotionDraft } from "./PotionForm";
import { Section } from "./Section";

const describe = (p: Potion) => `${p.dose ? `${p.dose} · ` : ""}${describeSchedule(p)}`;

export function CabinetView({ g }: { g: Grimoire }) {
  const [editing, setEditing] = useState<PotionDraft | null>(null);
  const [showRetired, setShowRetired] = useState(false);
  const active = g.potions.filter((p) => !p.archived);
  const retired = g.potions.filter((p) => p.archived);

  if (editing) {
    const existing = editing.id ? g.potions.find((p) => p.id === editing.id) : undefined;
    const hasHistory = existing ? potionHasHistory(g, existing.id) : false;
    return (
      <div className="space-y-4">
        <PotionForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(p) => {
            dispatch((x) => savePotion(x, p));
            setEditing(null);
          }}
        />
        {existing && (
          <Section title="Remove from cabinet">
            <p className="font-journal text-lg text-silver-300">
              {hasHistory
                ? "Retiring takes it off your daily checklist. Every dose you've logged stays in your history, and you can restore it any time."
                : "You've never logged this potion, so it will be removed completely."}
            </p>
            <button
              type="button"
              onClick={() => {
                dispatch((x) => (hasHistory ? archivePotion(x, existing.id) : deletePotion(x, existing.id)));
                setEditing(null);
              }}
              className="pixel-button pixel-button--ghost"
            >
              {hasHistory ? "Retire this potion" : "Remove this potion"}
            </button>
          </Section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Potion &amp; Elixir Cabinet</h2>
      <p className="text-center font-journal text-lg text-silver-300">
        Your potions live here. Check them off on each day&apos;s page.
      </p>

      {active.length === 0 ? (
        <p className="pixel-frame p-4 text-center font-journal text-xl text-silver-300">The shelves are empty. Brew your first potion.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((p) => (
            <li key={p.id} className="pixel-frame flex items-center gap-3 p-3">
              <VesselSprite vessel={p.vessel} color={p.color} size={40} title={VESSEL_NAMES[p.vessel]} />
              <div className="min-w-0 flex-1">
                <p className="text-silver-100">{p.name}</p>
                <p className="font-journal text-lg leading-tight text-silver-500">{describe(p)}</p>
              </div>
              <button type="button" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)} className="p-2 text-silver-500 hover:text-gold-300">
                <Pencil size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => setEditing(BLANK_POTION)} className="pixel-button pixel-button--gold w-full">
        <Plus size={16} strokeWidth={3} /> Brew a new potion
      </button>

      {retired.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            aria-expanded={showRetired}
            onClick={() => setShowRetired((s) => !s)}
            className="w-full text-center font-journal text-lg text-silver-500 hover:text-gold-300"
          >
            {showRetired ? "Hide" : "Show"} retired potions ({retired.length})
          </button>
          {showRetired && (
            <ul className="space-y-2">
              {retired.map((p) => (
                <li key={p.id} className="pixel-frame flex items-center gap-3 p-3 opacity-75">
                  <VesselSprite vessel={p.vessel} color={p.color} size={32} dim />
                  <div className="min-w-0 flex-1">
                    <p className="text-silver-300">{p.name}</p>
                    <p className="font-journal text-lg leading-tight text-silver-500">{describe(p)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch((x) => archivePotion(x, p.id, false))}
                    className="pixel-button pixel-button--ghost text-sm"
                  >
                    <ArchiveRestore size={14} /> Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
