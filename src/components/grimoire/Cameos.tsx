"use client";

import { FamiliarSprite } from "@/components/sprites/FamiliarSprite";
import type { DateKey } from "@/lib/dates";
import { phaseOfDay } from "@/lib/prompts";
import type { Grimoire } from "@/lib/types";

/*
 * Small visits from the familiar on other pages. Each is quiet and stays out
 * of the way, and all of them can be switched off on the familiar's page.
 */

const visiting = (g: Grimoire) => (g.familiar?.cameos ? g.familiar : null);

/** Under the potions: cheers each time a dose is checked off. */
export function PotionCheer({ g, date, today }: { g: Grimoire; date: DateKey; today: DateKey }) {
  const f = visiting(g);
  if (!f) return null;
  const taken = g.days[date]?.potionLogs.length ?? 0;
  return (
    <div className="flex items-end justify-end gap-2 pr-2" aria-hidden>
      <FamiliarSprite familiar={f} mood={phaseOfDay(g, date, today) === "dark" ? "waning" : "waxing"} size={56} reactKey={taken} />
    </div>
  );
}

/** Asleep in the corner of the Book & Quill while you write. */
export function JournalNap({ g }: { g: Grimoire }) {
  const f = visiting(g);
  if (!f) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute -right-2 -bottom-4 opacity-90">
      <FamiliarSprite familiar={f} mood="dark" size={64} />
    </span>
  );
}

/** Peeking over the top of the cabinet's shelf. */
export function ShelfPeek({ g, today }: { g: Grimoire; today: DateKey }) {
  const f = visiting(g);
  if (!f) return null;
  const mood = phaseOfDay(g, today, today);
  return (
    <div aria-hidden className="-mb-3 flex h-9 justify-end overflow-hidden pr-6">
      <span className="self-start">
        <FamiliarSprite familiar={f} mood={mood === "dark" ? "waning" : mood} size={60} still />
      </span>
    </div>
  );
}
