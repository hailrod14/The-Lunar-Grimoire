import { VesselSprite } from "@/components/sprites/VesselSprite";
import { PHASE_MEANING, cycleStats, tideDay } from "@/lib/cycle";
import { formatHHMM, type DateKey } from "@/lib/dates";
import { activePotions } from "@/lib/grimoire";
import type { Grimoire } from "@/lib/types";
import { SkyBadge, TideBadge } from "./Badges";
import { DateNav } from "./DateNav";
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

export function DayPlaceholder({ g, date, today, onNavigate }: { g: Grimoire; date: DateKey; today: DateKey; onNavigate: (d: DateKey) => void }) {
  const tide = tideDay(date, g.tides, g.settings, today);
  return (
    <div className="space-y-4">
      <DateNav date={date} today={today} onNavigate={onNavigate} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        {g.settings.cycleTracking && (
          <TideBadge
            tide={tide}
            size={48}
            lines={tide ? [`${tide.predicted ? "Predicted · " : ""}Day ${tide.cycleDay}`, PHASE_MEANING[tide.phase]] : ["No tide logged yet"]}
          />
        )}
        <SkyBadge date={date} />
      </div>
      <StillWriting what="The daily page (tide, elements, potions, and journal)" />
    </div>
  );
}

export function JournalPlaceholder() {
  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">The Book &amp; Quill</h2>
      <StillWriting what="The Book & Quill" />
    </div>
  );
}

export function CabinetPlaceholder({ g }: { g: Grimoire }) {
  const potions = activePotions(g);
  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Potion &amp; Elixir Cabinet</h2>
      {potions.length === 0 ? (
        <p className="text-center font-journal text-xl text-silver-300">Your cabinet is empty.</p>
      ) : (
        <ul className="space-y-2">
          {potions.map((p) => (
            <li key={p.id} className="pixel-frame flex items-center gap-3 p-3">
              <VesselSprite vessel={p.vessel} color={p.color} size={40} />
              <div>
                <p className="text-silver-100">{p.name}</p>
                <p className="font-journal text-lg leading-tight text-silver-500">
                  {p.dose && `${p.dose} · `}
                  {p.schedule === "daily" ? `daily at ${formatHHMM(p.time)}` : "as needed"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <StillWriting what="Brewing and editing potions" />
    </div>
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
