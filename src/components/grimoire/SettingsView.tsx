"use client";

import { useState } from "react";
import { cycleStats, MIN_CYCLES_TO_LEARN } from "@/lib/cycle";
import type { DateKey } from "@/lib/dates";
import { Play } from "lucide-react";
import { updateSettings } from "@/lib/grimoire";
import { playPageTurn } from "@/lib/sound";
import { THEMES } from "@/lib/theme";
import { isAppleMobile, isInstalled, promptInstall, useCanInstall } from "@/lib/pwa";
import { dispatch, eraseEverything } from "@/lib/store";
import type { Grimoire } from "@/lib/types";
import { Backups } from "./Backups";
import { Choice, Stepper } from "./Controls";
import { PinSettings } from "./PinSettings";
import { RemindersSettings } from "./RemindersSettings";
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
      <RemindersSettings g={g} today={today} />
      <Backups g={g} today={today} />
      <PinSettings g={g} />
      <ThemePicker g={g} />
      <SoundAndMusic g={g} />
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

function ThemePicker({ g }: { g: Grimoire }) {
  const set = (patch: Parameters<typeof updateSettings>[1]) => dispatch((x) => updateSettings(x, patch));
  return (
    <Section title="Theme">
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => {
          const on = g.settings.theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => set({ theme: t.id })}
              className={`space-y-1 p-2 text-left ${on ? "bg-midnight-600 outline-2 outline-gold-300" : "bg-midnight-950 hover:bg-midnight-700"}`}
            >
              <span aria-hidden className="flex h-5">
                {t.swatch.map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className="block text-sm leading-tight text-silver-100">{t.name}</span>
              <span className="block font-journal text-base leading-tight text-silver-500">{t.note}</span>
            </button>
          );
        })}
      </div>
      <p className="pt-1 text-sm text-silver-300">Hemisphere (for the seasons and the Wheel of the Year)</p>
      <div className="grid grid-cols-2 gap-1">
        {(["north", "south"] as const).map((h) => (
          <Choice key={h} selected={g.settings.hemisphere === h} onClick={() => set({ hemisphere: h })}>
            {h === "north" ? "Northern" : "Southern"}
          </Choice>
        ))}
      </div>
    </Section>
  );
}

function SoundAndMusic({ g }: { g: Grimoire }) {
  const set = (patch: Parameters<typeof updateSettings>[1]) => dispatch((x) => updateSettings(x, patch));
  const { soundEnabled, musicEnabled, musicVolume } = g.settings;

  return (
    <Section title="Sound & music">
      <p className="text-sm text-silver-300">Page turns</p>
      <Choice selected={soundEnabled} onClick={() => set({ soundEnabled: true })}>
        🍃 A gentle turn of the page
      </Choice>
      <Choice selected={!soundEnabled} onClick={() => set({ soundEnabled: false })}>
        🔇 Silent pages
      </Choice>
      <button type="button" onClick={() => playPageTurn("page", true)} className="pixel-button pixel-button--ghost">
        <Play size={14} /> Hear a page turn
      </button>

      <p className="pt-2 text-sm text-silver-300">Forest music</p>
      <Choice selected={musicEnabled} onClick={() => set({ musicEnabled: true })}>
        🌲 Play cozy forest music
      </Choice>
      <Choice selected={!musicEnabled} onClick={() => set({ musicEnabled: false })}>
        Quiet
      </Choice>
      <label className="flex items-center gap-3 text-sm text-silver-300">
        Volume
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(musicVolume * 100)}
          onChange={(e) => set({ musicVolume: Number(e.target.value) / 100 })}
          className="flex-1 accent-gold-500"
          aria-valuetext={`${Math.round(musicVolume * 100)} percent`}
        />
        <span className="w-10 text-right font-journal text-lg text-gold-300">{Math.round(musicVolume * 100)}</span>
      </label>
      <p className="font-journal text-lg text-silver-500">
        Played live in the browser: soft pads, a music box, wind, crickets, a crackling hearth, and the occasional owl. It never
        repeats, and pauses when you leave the Grimoire. You can also tap the ♪ charm under the ribbons.
      </p>
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
            This permanently erases every tide, potion, and page in this browser, and removes any PIN. It can&apos;t be undone. Export a backup first if you
            might want it back.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void eraseEverything()} className="bg-blood px-3 py-2 text-white">
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
