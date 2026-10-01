"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { DateKey } from "@/lib/dates";
import { setJournal } from "@/lib/grimoire";
import { promptsFor } from "@/lib/prompts";
import { dispatch } from "@/lib/store";
import type { Grimoire } from "@/lib/types";

/** A writing prompt for the day, which can be added to the entry or swapped for another. */
export function JournalPrompt({ g, date, today, journal }: { g: Grimoire; date: DateKey; today: DateKey; journal: string }) {
  const [index, setIndex] = useState(0);
  const prompts = promptsFor(g, date, today);
  const prompt = prompts[index % prompts.length];
  const used = journal.includes(prompt);

  return (
    <div className="space-y-2 bg-midnight-950 p-3">
      <p className="font-journal text-lg leading-snug text-silver-100">
        <span className="text-gold-300">✒️ A prompt: </span>
        {prompt}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={used}
          onClick={() => dispatch((x) => setJournal(x, date, `${journal}${journal && !journal.endsWith("\n") ? "\n\n" : ""}${prompt}\n`))}
          className="pixel-button pixel-button--ghost disabled:opacity-40"
        >
          {used ? "Added to your entry" : "Write about this"}
        </button>
        <button type="button" onClick={() => setIndex((i) => i + 1)} className="pixel-button pixel-button--ghost">
          <RefreshCw size={14} /> Another
        </button>
      </div>
    </div>
  );
}
