import { cycleStats } from "@/lib/cycle";
import type { Grimoire } from "@/lib/types";
import { Section } from "./Section";

/*
 * Sections still being written. Each shows the real data it can already,
 * so the book is usable end to end while the next steps are built.
 */

function StillWriting({ what }: { what: string }) {
  return (
    <p className="pixel-frame pixel-frame--parchment p-4 text-center font-journal text-xl">
      ✒️ {what} is still being written. It arrives in the next step.
      <br />
      <span className="text-parchment-700">(You can try it now in the layout mockup at /mockup.)</span>
    </p>
  );
}

export function SettingsPlaceholder({ g }: { g: Grimoire }) {
  const stats = cycleStats(g.tides, g.settings);
  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Settings</h2>
      {g.settings.cycleTracking && (
        <Section title="Your rhythm">
          <dl className="grid grid-cols-2 gap-2 font-journal text-xl">
            <dt className="text-silver-500">Cycle length</dt>
            <dd className="text-silver-100">
              ~{stats.cycleLength} days {stats.cyclesLearned ? `(learned from ${stats.cyclesLearned})` : "(your estimate)"}
            </dd>
            <dt className="text-silver-500">Tide length</dt>
            <dd className="text-silver-100">
              ~{stats.periodLength} days {stats.periodsLearned ? `(learned from ${stats.periodsLearned})` : "(your estimate)"}
            </dd>
          </dl>
        </Section>
      )}
      <StillWriting what="Backups (Export / Import) and the rest of Settings" />
      <p className="px-2 font-journal text-base text-silver-500">
        The Lunar Grimoire is a reflection tool, not a medical device. Predictions are estimates. Never rely on them for contraception.
      </p>
    </div>
  );
}
