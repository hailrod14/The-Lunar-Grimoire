"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { dateKey, diffKeys, type DateKey } from "@/lib/dates";
import { updateSettings } from "@/lib/grimoire";
import { exportGrimoire, parseGrimoireFile } from "@/lib/storage";
import { dispatch, replaceGrimoire } from "@/lib/store";
import type { Grimoire } from "@/lib/types";
import { Section } from "./Section";

/** Nudge toward a fresh backup after this many days. */
const BACKUP_NUDGE_DAYS = 30;

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function summarize(g: Grimoire) {
  const written = Object.values(g.days).filter((d) => d.journal.trim()).length;
  const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
  return `${n(g.tides.length, "tide")}, ${n(g.potions.length, "potion")}, ${n(Object.keys(g.days).length, "logged day")}, ${n(written, "journal entry", "journal entries")}`;
}

type Pending = { grimoire: Grimoire; exportedAt?: string };

export function Backups({ g, today }: { g: Grimoire; today: DateKey }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);

  const lastBackup = g.settings.lastBackupAt;
  const daysSince = lastBackup ? diffKeys(today, dateKey(new Date(lastBackup))) : null;
  const hasData = g.tides.length > 0 || Object.keys(g.days).length > 0;
  const nudge = hasData && (daysSince === null || daysSince >= BACKUP_NUDGE_DAYS);

  const exportNow = () => {
    const now = new Date();
    const blob = new Blob([exportGrimoire(g, now)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lunar-grimoire-${dateKey(now)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dispatch((x) => updateSettings(x, { lastBackupAt: now.toISOString() }));
    setMessage({ tone: "good", text: `Saved ${a.download}. Keep it somewhere safe, like your files or cloud storage.` });
  };

  const readFile = async (file: File) => {
    setMessage(null);
    const text = await file.text();
    const parsed = parseGrimoireFile(text);
    if (!parsed.ok) {
      setPending(null);
      setMessage({ tone: "bad", text: parsed.error });
      return;
    }
    let exportedAt: string | undefined;
    try {
      const raw = JSON.parse(text);
      if (typeof raw.exportedAt === "string" && !Number.isNaN(Date.parse(raw.exportedAt))) exportedAt = raw.exportedAt;
    } catch {
      // Already validated above; the date is only a nicety.
    }
    setPending({ grimoire: parsed.grimoire, exportedAt });
  };

  return (
    <Section title="Back up your Grimoire">
      <p className="font-journal text-lg text-silver-300">
        Everything lives only in this browser. A backup file keeps it safe and lets you move it to another device.
      </p>
      <p className={`font-journal text-lg ${nudge ? "text-gold-300" : "text-silver-500"}`}>
        Last backup: {lastBackup ? `${longDate(lastBackup)}${daysSince ? ` (${daysSince} day${daysSince === 1 ? "" : "s"} ago)` : " (today)"}` : "never"}
        {nudge && " · a fresh one would be wise"}
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportNow} className="pixel-button pixel-button--gold">
          <Download size={16} /> Export Grimoire
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className="pixel-button pixel-button--ghost">
          <Upload size={16} /> Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose a Grimoire backup file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {message && (
        <p role="status" className={`font-journal text-lg ${message.tone === "good" ? "text-earth" : "text-fire"}`}>
          {message.text}
        </p>
      )}

      {pending && (
        <div role="alertdialog" aria-label="Confirm import" className="space-y-2 bg-midnight-950 p-3">
          <p className="font-journal text-lg text-silver-100">
            This backup{pending.exportedAt ? ` from ${longDate(pending.exportedAt)}` : ""} holds {summarize(pending.grimoire)}.
          </p>
          <p className="font-journal text-lg text-gold-300">
            Importing replaces everything in this Grimoire right now ({summarize(g)}). Export first if you want to keep it.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                replaceGrimoire({ ...pending.grimoire, settings: { ...pending.grimoire.settings, onboarded: true } });
                setPending(null);
                setMessage({ tone: "good", text: "Backup restored. Welcome back." });
              }}
              className="pixel-button pixel-button--gold"
            >
              Replace my Grimoire
            </button>
            <button type="button" onClick={() => setPending(null)} className="pixel-button pixel-button--ghost">
              Cancel
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}
