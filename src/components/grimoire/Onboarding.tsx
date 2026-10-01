"use client";

import { useRef, useState } from "react";
import { Cloud, Plus, Trash2, Upload } from "lucide-react";
import { usePageTurn } from "@/components/pixel/usePageTurn";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { MAX_TIDE_DAYS } from "@/lib/cycle";
import { SYNC_AVAILABLE } from "@/lib/firebase-config";
import { addDaysKey, type DateKey } from "@/lib/dates";
import { describeSchedule } from "@/lib/potions";
import { completeOnboarding } from "@/lib/grimoire";
import { parseGrimoireFile } from "@/lib/storage";
import { dispatch, replaceGrimoire } from "@/lib/store";
import { Choice, Stepper } from "./Controls";
import { BLANK_POTION, PotionForm, type PotionDraft } from "./PotionForm";
import { Section } from "./Section";
import { SyncPanel } from "./SyncSettings";

const PAGES = ["Welcome", "Your last tide", "Your rhythm", "Your cabinet"] as const;

const dateInput =
  "pixel-frame block w-[calc(100%-8px)] bg-midnight-950 px-3 py-2 font-journal text-xl text-silver-100 focus:outline-none";

export function Onboarding({ today }: { today: DateKey }) {
  const [page, setPage] = useState(0);
  const [tracking, setTracking] = useState<boolean | null>(null);
  const [start, setStart] = useState<DateKey>("");
  const [unknownStart, setUnknownStart] = useState(false);
  const [flowing, setFlowing] = useState<boolean | null>(null);
  const [end, setEnd] = useState<DateKey>("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [potions, setPotions] = useState<PotionDraft[]>([]);
  const [brewing, setBrewing] = useState(false);
  const { pageRef, overlay, turn } = usePageTurn();

  const latestEnd = start ? [today, addDaysKey(start, MAX_TIDE_DAYS - 1)].sort()[0] : today;
  const tideAnswered =
    tracking === false ||
    (tracking === true &&
      (unknownStart || (start !== "" && start <= today && (flowing === true || (flowing === false && end >= start && end <= latestEnd)))));

  const canContinue = page === 1 ? tideAnswered : true;

  const go = (to: number) => turn(to > page ? "forward" : "backward", () => setPage(to));
  // The rhythm page only matters when tracking a cycle.
  const next = () => go(page === 1 && !tracking ? 3 : page + 1);
  const back = () => go(page === 3 && !tracking ? 1 : page - 1);

  const finish = () =>
    dispatch((g) =>
      completeOnboarding(g, {
        cycleTracking: tracking === true,
        lastTideStart: tracking && !unknownStart ? start : undefined,
        lastTideEnd: tracking && !unknownStart && flowing === false ? end : undefined,
        cycleLength,
        periodLength,
        potions,
      }),
    );

  if (brewing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="pixel-frame pixel-frame--gold p-4">
          <PotionForm
            initial={BLANK_POTION}
            saveLabel="Add to cabinet"
            onCancel={() => setBrewing(false)}
            onSave={(p) => {
              setPotions((list) => [...list, p]);
              setBrewing(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-6">
      <div className="pixel-frame pixel-frame--gold">
        <div ref={pageRef} className="flex min-h-[70dvh] flex-col gap-5 p-5">
          <p className="text-center text-xs uppercase tracking-widest text-gold-700">
            {page === 0 ? "The first-run ritual" : `Page ${page} of 3 · ${PAGES[page]}`}
          </p>

          {page === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
              <div className="animate-float">
                <PixelMoon phase={0.12} variant="tide" size={112} resolution={24} title="A golden crescent moon" />
              </div>
              <h1 className="pixel-title text-3xl">The Lunar Grimoire</h1>
              <p className="font-journal text-2xl text-silver-300">
                A private book for your tides, your moods, and your potions.
              </p>
              <ul className="space-y-2 text-left font-journal text-xl text-silver-300">
                <li>🔒 Private by design. Everything stays on this device unless you choose to sync, and then it&apos;s encrypted first.</li>
                <li>🌙 Your cycle becomes a personal Lunar Tide.</li>
                <li>⚗️ Your medicines and supplements live in a potion cabinet.</li>
              </ul>
              <p className="font-journal text-base text-silver-500">
                A reflection tool, not a medical device. Predictions are estimates, never for contraception.
              </p>
              <RestoreBackup />
              {SYNC_AVAILABLE && <SyncFromAnotherDevice />}
            </div>
          )}

          {page === 1 && (
            <div className="space-y-4">
              <h2 className="pixel-title text-center text-2xl">Your last tide</h2>
              <Section title="Do you track a menstrual cycle?">
                <Choice selected={tracking === true} onClick={() => setTracking(true)}>
                  Yes, track my tide
                </Choice>
                <Choice selected={tracking === false} onClick={() => setTracking(false)}>
                  No, just moods and potions
                </Choice>
                {tracking === false && (
                  <p className="font-journal text-lg text-silver-500">You can turn cycle tracking on later in Settings.</p>
                )}
              </Section>

              {tracking && (
                <Section title="When did your last tide begin?">
                  {!unknownStart && (
                    <input
                      type="date"
                      aria-label="Last tide start date"
                      className={dateInput}
                      value={start}
                      max={today}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  )}
                  <Choice selected={unknownStart} onClick={() => setUnknownStart((u) => !u)}>
                    I don&apos;t remember; I&apos;ll log my next one
                  </Choice>
                </Section>
              )}

              {tracking && !unknownStart && start && (
                <Section title="Is it still flowing?">
                  <Choice selected={flowing === true} onClick={() => setFlowing(true)}>
                    Yes, still flowing
                  </Choice>
                  <Choice selected={flowing === false} onClick={() => setFlowing(false)}>
                    No, it ended on…
                  </Choice>
                  {flowing === false && (
                    <input
                      type="date"
                      aria-label="Last tide end date"
                      className={dateInput}
                      value={end}
                      min={start}
                      max={latestEnd}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  )}
                </Section>
              )}
            </div>
          )}

          {page === 2 && (
            <div className="space-y-4">
              <h2 className="pixel-title text-center text-2xl">Your rhythm</h2>
              <p className="text-center font-journal text-xl text-silver-300">
                Your best guess is fine. After three cycles the Grimoire learns your real rhythm.
              </p>
              <Section title="How long is your cycle, usually?">
                <p className="font-journal text-lg text-silver-500">From the first day of one tide to the first day of the next.</p>
                <Stepper label="Cycle length" value={cycleLength} min={21} max={45} unit="days" onChange={setCycleLength} />
                <button type="button" onClick={() => setCycleLength(28)} className="font-journal text-lg text-violet-300 underline">
                  Not sure? Use 28
                </button>
              </Section>
              <Section title="How long does your tide last?">
                <Stepper label="Tide length" value={periodLength} min={2} max={10} unit="days" onChange={setPeriodLength} />
              </Section>
            </div>
          )}

          {page === 3 && (
            <div className="space-y-4">
              <h2 className="pixel-title text-center text-2xl">Stock your cabinet</h2>
              <p className="text-center font-journal text-xl text-silver-300">
                Add the medicines and supplements you take. You can skip this and add them any time.
              </p>
              {potions.length > 0 && (
                <ul className="space-y-2">
                  {potions.map((p, i) => (
                    <li key={i} className="pixel-frame flex items-center gap-3 p-2">
                      <VesselSprite vessel={p.vessel} color={p.color} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-silver-100">{p.name}</p>
                        <p className="font-journal text-lg leading-tight text-silver-500">
                          {p.dose && `${p.dose} · `}
                          {describeSchedule(p)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setPotions((list) => list.filter((_, j) => j !== i))}
                        className="p-2 text-silver-500 hover:text-blood"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => setBrewing(true)} className="pixel-button w-full">
                <Plus size={16} strokeWidth={3} /> Add a potion
              </button>
            </div>
          )}

          <div className="mt-auto space-y-3 pt-2">
            <div className="flex justify-center gap-2" aria-hidden>
              {PAGES.map((_, i) => (
                <span key={i} className={`size-2 ${i === page ? "bg-gold-300" : "bg-midnight-600"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {page > 0 && (
                <button type="button" onClick={back} className="pixel-button pixel-button--ghost flex-1">
                  Back
                </button>
              )}
              {page < 3 ? (
                <button type="button" onClick={next} disabled={!canContinue} className="pixel-button pixel-button--gold flex-1 disabled:opacity-40">
                  {page === 0 ? "Begin the ritual" : "Next"}
                </button>
              ) : (
                <button type="button" onClick={finish} className="pixel-button pixel-button--gold flex-1">
                  ✨ Seal the Grimoire
                </button>
              )}
            </div>
          </div>
        </div>
        {overlay}
      </div>
    </main>
  );
}

/** For a second device: sign in and open the synced Grimoire instead of starting fresh. */
function SyncFromAnotherDevice() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="pixel-button pixel-button--ghost">
        <Cloud size={16} /> Sync from my other device
      </button>
    );
  }
  return (
    <div className="pixel-frame w-full space-y-3 p-3 text-left">
      <SyncPanel adopt />
      <button type="button" onClick={() => setOpen(false)} className="pixel-button pixel-button--ghost">
        Cancel
      </button>
    </div>
  );
}

/** For a new device or the installed app: skip the ritual by restoring an exported Grimoire. */
function RestoreBackup() {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const restore = async (file: File) => {
    const parsed = parseGrimoireFile(await file.text());
    if (!parsed.ok) return setError(parsed.error);
    replaceGrimoire({ ...parsed.grimoire, settings: { ...parsed.grimoire.settings, onboarded: true } });
  };

  return (
    <div className="space-y-1">
      <button type="button" onClick={() => input.current?.click()} className="pixel-button pixel-button--ghost">
        <Upload size={16} /> Restore from a backup
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Choose a Grimoire backup file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) restore(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="font-journal text-lg text-fire">
          {error}
        </p>
      )}
    </div>
  );
}
