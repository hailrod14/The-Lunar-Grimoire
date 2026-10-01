"use client";

import { useState } from "react";
import { ArchiveRestore, Pencil, Plus } from "lucide-react";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { dateKey, nowTime, type DateKey } from "@/lib/dates";
import { archivePotion, countSupply, deletePotion, potionHasHistory, savePotion } from "@/lib/grimoire";
import { VESSEL_NAMES, describeSchedule, stamp, supplyLeft, supplyStatus, type SupplyStatus } from "@/lib/potions";
import { dispatch } from "@/lib/store";
import type { Grimoire, Potion } from "@/lib/types";
import { ShelfPeek } from "./Cameos";
import { BLANK_POTION, PotionForm, type PotionDraft } from "./PotionForm";
import { Section } from "./Section";

const describe = (p: Potion) => `${p.dose ? `${p.dose} · ` : ""}${describeSchedule(p)}`;

/** "23 pills left · about 11 days" */
export function describeSupply(s: SupplyStatus): string {
  const amount = `${s.left % 1 ? s.left.toFixed(1) : s.left} ${s.unit} left`;
  if (s.out) return `Out of ${s.unit}`;
  return s.daysLeft === null ? amount : `${amount} · about ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"}`;
}

function Refill({ g, p, onDone }: { g: Grimoire; p: Potion; onDone: () => void }) {
  const [added, setAdded] = useState("");
  const n = Number(added.replace(",", "."));
  const valid = added.trim() !== "" && Number.isFinite(n) && n > 0;
  return (
    <form
      className="flex flex-wrap items-end gap-2 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const left = supplyLeft(g, p) ?? 0;
        dispatch((x) => countSupply(x, p.id, left + n, stamp(dateKey(new Date()), nowTime())));
        onDone();
      }}
    >
      <label className="space-y-1">
        <span className="block text-sm text-silver-300">How many did you add?</span>
        <input
          inputMode="decimal"
          autoFocus
          value={added}
          onChange={(e) => setAdded(e.target.value)}
          placeholder="30"
          className="block w-28 bg-midnight-950 px-3 py-2 font-journal text-xl text-silver-100 outline-2 outline-violet-500 placeholder:text-silver-700 focus:outline-gold-300"
        />
      </label>
      <button type="submit" disabled={!valid} className="pixel-button pixel-button--gold disabled:opacity-40">
        Restock
      </button>
      <button type="button" onClick={onDone} className="pixel-button pixel-button--ghost">
        Cancel
      </button>
    </form>
  );
}

export function CabinetView({ g, today }: { g: Grimoire; today: DateKey }) {
  const [refilling, setRefilling] = useState<string | null>(null);
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
          supplyLeft={existing ? supplyLeft(g, existing) : null}
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
        Your potions live here. Check them off on each day&apos;s page, and keep count of your supply so you know when to refill.
      </p>

      <ShelfPeek g={g} today={today} />
      {active.length === 0 ? (
        <p className="pixel-frame p-4 text-center font-journal text-xl text-silver-300">The shelves are empty. Brew your first potion.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((p) => {
            const supply = supplyStatus(g, p, today);
            return (
              <li key={p.id} className={`pixel-frame p-3 ${supply?.low ? "pixel-frame--gold" : ""}`}>
                <div className="flex items-center gap-3">
                  <VesselSprite vessel={p.vessel} color={p.color} size={40} title={VESSEL_NAMES[p.vessel]} dim={supply?.out} />
                  <div className="min-w-0 flex-1">
                    <p className="text-silver-100">{p.name}</p>
                    <p className="font-journal text-lg leading-tight text-silver-500">{describe(p)}</p>
                    {supply && (
                      <p className={`font-journal text-lg leading-tight ${supply.low ? "text-gold-300" : "text-silver-300"}`}>
                        🧪 {describeSupply(supply)}
                        {supply.low && !supply.out && " · time to refill"}
                      </p>
                    )}
                  </div>
                  <button type="button" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)} className="p-2 text-silver-500 hover:text-gold-300">
                    <Pencil size={18} />
                  </button>
                </div>
                {supply &&
                  (refilling === p.id ? (
                    <Refill g={g} p={p} onDone={() => setRefilling(null)} />
                  ) : (
                    <button type="button" onClick={() => setRefilling(p.id)} className="pixel-button pixel-button--ghost mt-2 text-sm">
                      <Plus size={14} strokeWidth={3} /> Restock
                    </button>
                  ))}
              </li>
            );
          })}
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
