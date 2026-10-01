"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { HolidayGlyph, OccasionGlyph } from "@/components/sprites/Glyphs";
import { formatShort, parseKey, type DateKey } from "@/lib/dates";
import { deleteOccasion, saveOccasion, updateSettings } from "@/lib/grimoire";
import { HOLIDAY_REGIONS, OCCASION_KINDS, holidaysOn, nextOccurrence, occasionAge, occasionsOn } from "@/lib/holidays";
import { dispatch } from "@/lib/store";
import type { Grimoire, Occasion } from "@/lib/types";
import { Choice } from "./Controls";
import { Section } from "./Section";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Draft = Omit<Occasion, "id"> & { id?: string };

const draftFor = (date: DateKey): Draft => {
  const d = parseKey(date);
  return { name: "", kind: "birthday", month: d.getMonth() + 1, day: d.getDate(), yearly: true };
};

/** The holidays and personal occasions on a day (mode "list"), or the button to add one (mode "add"). */
export function DayOccasions({ g, date, mode }: { g: Grimoire; date: DateKey; mode: "list" | "add" }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const holidays = holidaysOn(date, g.settings.holidayRegion);
  const occasions = occasionsOn(g, date);

  if (editing) {
    return (
      <Section title={editing.id ? "Edit occasion" : "Add an occasion"}>
        <OccasionForm draft={editing} onDone={() => setEditing(null)} />
      </Section>
    );
  }

  if (mode === "add") {
    return (
      <button type="button" onClick={() => setEditing(draftFor(date))} className="pixel-button pixel-button--ghost">
        <Plus size={16} /> Add a birthday or occasion
      </button>
    );
  }

  return (
    <>
      {(holidays.length > 0 || occasions.length > 0) && (
        <ul className="pixel-frame space-y-2 p-3">
          {occasions.map((o) => {
            const age = occasionAge(o, date);
            return (
              <li key={o.id} className="flex items-center gap-2">
                <OccasionGlyph kind={o.kind} size={18} />
                <span className="flex-1 font-journal text-lg leading-snug text-silver-100">
                  <span className="text-gold-300">{o.name}</span>
                  {age && <span className="text-silver-300"> {age}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Edit ${o.name}`}
                  onClick={() => setEditing(o)}
                  className="p-2 text-silver-300 hover:text-gold-300"
                >
                  <Pencil size={16} />
                </button>
              </li>
            );
          })}
          {holidays.map((h) => (
            <li key={h.name} className="flex items-center gap-2">
              <HolidayGlyph size={16} />
              <span className="font-journal text-lg leading-snug text-silver-100">{h.name}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OccasionForm({ draft: initial, onDone }: { draft: Draft; onDone: () => void }) {
  const [draft, setDraft] = useState(initial);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const daysInMonth = new Date(2024, draft.month, 0).getDate();
  const yearValid = draft.year === undefined ? draft.yearly : draft.year >= 1900 && draft.year <= 2200;
  const valid = draft.name.trim() !== "" && yearValid;

  const save = () => {
    if (!valid) return;
    dispatch((g) => saveOccasion(g, { ...draft, name: draft.name.trim(), day: Math.min(draft.day, daysInMonth) }));
    onDone();
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="block space-y-1">
        <span className="text-sm text-silver-300">Name</span>
        <input
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Mum's birthday"
          maxLength={80}
          className="block w-full bg-midnight-950 px-3 py-2 font-journal text-lg text-silver-100 outline-2 outline-violet-500 placeholder:text-silver-500 focus:outline-gold-300"
        />
      </label>

      <fieldset className="space-y-1">
        <legend className="text-sm text-silver-300">Kind</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-1">
          {OCCASION_KINDS.map((k) => (
            <Choice key={k.id} selected={draft.kind === k.id} onClick={() => set({ kind: k.id })}>
              <span className="flex items-center gap-2">
                <OccasionGlyph kind={k.id} size={14} /> {k.name}
              </span>
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <label className="flex-1 space-y-1">
          <span className="text-sm text-silver-300">Month</span>
          <select
            value={draft.month}
            onChange={(e) => set({ month: Number(e.target.value) })}
            className="block w-full bg-midnight-950 px-2 py-2 font-journal text-lg text-silver-100 outline-2 outline-violet-500 focus:outline-gold-300"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="w-24 space-y-1">
          <span className="text-sm text-silver-300">Day</span>
          <select
            value={Math.min(draft.day, daysInMonth)}
            onChange={(e) => set({ day: Number(e.target.value) })}
            className="block w-full bg-midnight-950 px-2 py-2 font-journal text-lg text-silver-100 outline-2 outline-violet-500 focus:outline-gold-300"
          >
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <Choice selected={draft.yearly} onClick={() => set({ yearly: true })}>
          Every year
        </Choice>
        <Choice selected={!draft.yearly} onClick={() => set({ yearly: false, year: draft.year ?? new Date().getFullYear() })}>
          Just once
        </Choice>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-silver-300">
          {draft.yearly ? (draft.kind === "birthday" ? "Year born (optional, to show their age)" : "Year it began (optional, to count the years)") : "Year"}
        </span>
        <input
          inputMode="numeric"
          value={draft.year ?? ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
            set({ year: digits ? Number(digits) : undefined });
          }}
          placeholder={draft.yearly ? "e.g. 1990" : String(new Date().getFullYear())}
          className="block w-32 bg-midnight-950 px-3 py-2 font-journal text-lg text-silver-100 outline-2 outline-violet-500 placeholder:text-silver-500 focus:outline-gold-300"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!valid} className="pixel-button pixel-button--gold disabled:opacity-40">
          Save
        </button>
        <button type="button" onClick={onDone} className="pixel-button pixel-button--ghost">
          Cancel
        </button>
        {draft.id && (
          <button
            type="button"
            onClick={() => {
              dispatch((g) => deleteOccasion(g, draft.id!));
              onDone();
            }}
            className="pixel-button pixel-button--ghost ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

/** Settings: which public holidays show, and every personal occasion. */
export function OccasionsSettings({ g, today }: { g: Grimoire; today: DateKey }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const upcoming = g.occasions
    .map((o) => ({ o, next: nextOccurrence(o, today) }))
    .sort((a, b) => (a.next ?? "9999").localeCompare(b.next ?? "9999"));

  return (
    <Section title="Holidays & occasions">
      <p className="text-sm text-silver-300">Public holidays to show</p>
      <div className="grid grid-cols-2 gap-1">
        {HOLIDAY_REGIONS.map((r) => (
          <Choice key={r.id} selected={g.settings.holidayRegion === r.id} onClick={() => dispatch((x) => updateSettings(x, { holidayRegion: r.id }))}>
            {r.name}
          </Choice>
        ))}
      </div>

      <p className="pt-1 text-sm text-silver-300">Your birthdays and occasions</p>
      {editing ? (
        <OccasionForm draft={editing} onDone={() => setEditing(null)} />
      ) : (
        <>
          {upcoming.length === 0 ? (
            <p className="font-journal text-lg text-silver-500">None yet. Add birthdays, anniversaries, and days to remember.</p>
          ) : (
            <ul className="space-y-1">
              {upcoming.map(({ o, next }) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(o)}
                    className="flex w-full items-center gap-2 bg-midnight-950 px-3 py-2 text-left hover:bg-midnight-700"
                  >
                    <OccasionGlyph kind={o.kind} size={16} />
                    <span className="flex-1 font-journal text-lg leading-snug text-silver-100">{o.name}</span>
                    <span className="font-journal text-base text-silver-300">
                      {next ? `${formatShort(parseKey(next))}${occasionAge(o, next) ? ` · ${occasionAge(o, next)}` : ""}` : "Passed"}
                    </span>
                    <Pencil size={14} className="text-silver-500" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setEditing(draftFor(today))} className="pixel-button pixel-button--ghost">
            <Plus size={16} /> Add an occasion
          </button>
        </>
      )}
    </Section>
  );
}
