"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { sortTides, tideLength } from "@/lib/cycle";
import { formatShort, parseKey, type DateKey } from "@/lib/dates";
import { addTide, editTide, removeTide } from "@/lib/grimoire";
import { dispatch } from "@/lib/store";
import type { Grimoire, Tide } from "@/lib/types";
import { Section } from "./Section";

const dateInput = "bg-midnight-950 px-2 py-1 font-journal text-lg text-silver-100 shadow-[0_0_0_4px_var(--color-violet-500)]";
const REJECTED = "Those dates don't fit: they overlap another tide, end before they start, or run longer than 15 days.";

const short = (d: DateKey) => formatShort(parseKey(d));

/** Every logged tide, newest first, with editing and a way to add past ones. */
export function TideHistory({ g, today }: { g: Grimoire; today: DateKey }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const tides = sortTides(g.tides).reverse();

  return (
    <Section title="Tide history">
      <p className="font-journal text-lg text-silver-500">
        Adding a few past tides helps the Grimoire learn your rhythm sooner.
      </p>

      {tides.length === 0 && <p className="font-journal text-lg text-silver-300">No tides logged yet.</p>}

      <ul className="space-y-1">
        {tides.map((t) =>
          editing === t.id ? (
            <li key={t.id}>
              <TideForm
                initial={t}
                today={today}
                allowOpen={!t.end}
                submitLabel="Save"
                onCancel={() => setEditing(null)}
                onSubmit={(start, end) => {
                  const next = editTide(g, t.id, { start, ...(end ? { end } : {}) });
                  if (next === g) return REJECTED;
                  dispatch((x) => editTide(x, t.id, { start, ...(end ? { end } : {}) }));
                  setEditing(null);
                }}
              />
            </li>
          ) : (
            <TideRow key={t.id} tide={t} onEdit={() => setEditing(t.id)} />
          ),
        )}
      </ul>

      {adding ? (
        <TideForm
          today={today}
          submitLabel="Add tide"
          onCancel={() => setAdding(false)}
          onSubmit={(start, end) => {
            if (!end) return "Please choose the last day too.";
            if (addTide(g, start, end) === g) return REJECTED;
            dispatch((x) => addTide(x, start, end));
            setAdding(false);
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="pixel-button pixel-button--ghost">
          <Plus size={16} strokeWidth={3} /> Add a past tide
        </button>
      )}
    </Section>
  );
}

function TideRow({ tide, onEdit }: { tide: Tide; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const length = tideLength(tide);

  return (
    <li className="flex flex-wrap items-center gap-2 bg-midnight-950 p-2">
      <span className="min-w-0 flex-1 font-journal text-xl text-silver-100">
        {short(tide.start)} – {tide.end ? short(tide.end) : "still flowing"}
        {length && <span className="text-silver-500"> · {length} day{length === 1 ? "" : "s"}</span>}
      </span>
      {confirming ? (
        <span className="flex items-center gap-1">
          <button type="button" onClick={() => dispatch((x) => removeTide(x, tide.id))} className="bg-blood px-2 py-1 text-sm text-white">
            Delete
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="bg-midnight-700 px-2 py-1 text-sm text-silver-100">
            Keep
          </button>
        </span>
      ) : (
        <span className="flex items-center">
          <button type="button" aria-label={`Edit tide starting ${short(tide.start)}`} onClick={onEdit} className="p-2 text-silver-500 hover:text-gold-300">
            <Pencil size={16} />
          </button>
          <button
            type="button"
            aria-label={`Delete tide starting ${short(tide.start)}`}
            onClick={() => setConfirming(true)}
            className="p-2 text-silver-500 hover:text-blood"
          >
            <Trash2 size={16} />
          </button>
        </span>
      )}
    </li>
  );
}

type FormProps = {
  initial?: Tide;
  today: DateKey;
  /** Let the end be left blank (a tide still flowing). */
  allowOpen?: boolean;
  submitLabel: string;
  onCancel: () => void;
  /** Returns an error message if the dates were rejected. */
  onSubmit: (start: DateKey, end: DateKey | undefined) => string | void;
};

function TideForm({ initial, today, allowOpen = false, submitLabel, onCancel, onSubmit }: FormProps) {
  const [start, setStart] = useState(initial?.start ?? "");
  const [end, setEnd] = useState(initial?.end ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-2 bg-midnight-950 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!start) return setError("Please choose the first day.");
        setError(onSubmit(start, end || undefined) || null);
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-silver-300">
          First day
          <input type="date" required value={start} max={today} onChange={(e) => setStart(e.target.value)} className={dateInput} />
        </label>
        <label className="flex items-center gap-2 text-sm text-silver-300">
          Last day
          <input
            type="date"
            required={!allowOpen}
            value={end}
            min={start || undefined}
            max={today}
            onChange={(e) => setEnd(e.target.value)}
            className={dateInput}
          />
        </label>
      </div>
      {allowOpen && <p className="font-journal text-base text-silver-500">Leave the last day blank if it&apos;s still flowing.</p>}
      {error && (
        <p role="alert" className="font-journal text-lg text-fire">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="pixel-button pixel-button--gold">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="pixel-button pixel-button--ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
