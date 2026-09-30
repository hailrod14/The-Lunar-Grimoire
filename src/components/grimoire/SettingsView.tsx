"use client";

import { useState } from "react";
import { cycleStats, MIN_CYCLES_TO_LEARN } from "@/lib/cycle";
import type { DateKey } from "@/lib/dates";
import { updateSettings } from "@/lib/grimoire";
import { isAppleMobile, isInstalled, promptInstall, useCanInstall } from "@/lib/pwa";
import { dispatch, replaceGrimoire } from "@/lib/store";
import { newGrimoire, type Grimoire } from "@/lib/types";
import { Backups } from "./Backups";
import { Choice, Stepper } from "./Controls";
import { Section } from "./Section";
import { TideHistory } from "./TideHistory";

export function SettingsView({ g, today }: { g: Grimoire; today: DateKey }) {
  const tracking = g.settings.cycleTracking;

  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Settings</h2>

      <Section title="Cycle tracking">
        <Choice selected={tracking} onClick={() => dispatch((x) => updateSettings(x, { cycleTracking: true }))}>
          Track my tide
        </Choice>
        <Choice selected={!tracking} onClick={() => dispatch((x) => updateSettings(x, { cycleTracking: false }))}>
          Moods and potions only
        </Choice>
        {!tracking && g.tides.length > 0 && (
          <p className="font-journal text-lg text-silver-500">Your tide history is kept safely and returns if you turn tracking back on.</p>
        )}
      </Section>

      {tracking && <Rhythm g={g} />}
      {tracking && <TideHistory g={g} today={today} />}
      <Backups g={g} today={today} />
      <Install />

      <Section title="About">
        <p className="font-journal text-lg text-silver-300">
          🔒 The Lunar Grimoire has no accounts, servers, or tracking. Everything you write stays in this browser on this device.
        </p>
        <p className="font-journal text-lg text-silver-500">
          It&apos;s a reflection tool, not a medical device. Predictions are estimates. Never rely on them for contraception. For health
          concerns, talk with a healthcare provider.
        </p>
        <a
          href="https://github.com/hailrod14/The-Lunar-Grimoire"
          target="_blank"
          rel="noreferrer"
          className="inline-block font-journal text-lg text-violet-300 underline"
        >
          Source code on GitHub
        </a>
      </Section>

      <StartOver />
    </div>
  );
}

function Rhythm({ g }: { g: Grimoire }) {
  const stats = cycleStats(g.tides, g.settings);
  const set = (patch: Parameters<typeof updateSettings>[1]) => dispatch((x) => updateSettings(x, patch));

  return (
    <Section title="Your rhythm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-journal text-xl">
        <dt className="text-silver-500">Cycle</dt>
        <dd className="text-silver-100">
          ~{stats.cycleLength} days {stats.cyclesLearned ? `· learned from ${stats.cyclesLearned} cycles` : "· your estimate"}
        </dd>
        <dt className="text-silver-500">Tide</dt>
        <dd className="text-silver-100">
          ~{stats.periodLength} days {stats.periodsLearned ? `· learned from ${stats.periodsLearned} tides` : "· your estimate"}
        </dd>
      </dl>
      <p className="font-journal text-lg text-silver-500">
        Your estimates are used until {MIN_CYCLES_TO_LEARN} cycles are logged. After that the Grimoire follows your real rhythm.
      </p>
      <div className="space-y-2">
        <p className="text-sm text-silver-300">Estimated cycle length</p>
        <Stepper label="Estimated cycle length" value={g.settings.defaultCycleLength} min={21} max={45} unit="days" onChange={(n) => set({ defaultCycleLength: n })} />
        <p className="text-sm text-silver-300">Estimated tide length</p>
        <Stepper label="Estimated tide length" value={g.settings.defaultPeriodLength} min={2} max={10} unit="days" onChange={(n) => set({ defaultPeriodLength: n })} />
      </div>
    </Section>
  );
}

function Install() {
  const canInstall = useCanInstall();
  const [installed] = useState(isInstalled);
  const apple = isAppleMobile();

  return (
    <Section title="Keep it on your home screen">
      {installed ? (
        <p className="font-journal text-lg text-silver-300">✓ You&apos;re using the installed Grimoire. It works offline, too.</p>
      ) : (
        <>
          <p className="font-journal text-lg text-silver-300">
            Install the Grimoire to open it like an app, full screen and offline.
          </p>
          {canInstall ? (
            <button type="button" onClick={promptInstall} className="pixel-button pixel-button--gold">
              Install the Grimoire
            </button>
          ) : apple ? (
            <p className="font-journal text-lg text-silver-300">In Safari, tap the Share button, then “Add to Home Screen.”</p>
          ) : (
            <p className="font-journal text-lg text-silver-300">
              Use your browser&apos;s menu and choose “Install app” or “Add to Home Screen.”
            </p>
          )}
          {apple && (
            <p className="font-journal text-lg text-gold-300">
              On iPhone and iPad, the home-screen Grimoire keeps its own separate pages from Safari. Export here first, then Import in
              the installed app to bring everything with you.
            </p>
          )}
        </>
      )}
    </Section>
  );
}

function StartOver() {
  const [confirming, setConfirming] = useState(false);
  return (
    <Section title="Start over">
      {confirming ? (
        <>
          <p className="font-journal text-lg text-gold-300">
            This permanently erases every tide, potion, and page in this browser. It can&apos;t be undone. Export a backup first if you
            might want it back.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => replaceGrimoire(newGrimoire())} className="bg-blood px-3 py-2 text-white">
              Yes, erase everything
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="pixel-button pixel-button--ghost">
              Keep my Grimoire
            </button>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="pixel-button pixel-button--ghost">
          Erase this Grimoire…
        </button>
      )}
    </Section>
  );
}
