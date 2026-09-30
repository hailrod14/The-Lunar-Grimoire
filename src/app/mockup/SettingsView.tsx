import { Download, Upload } from "lucide-react";
import { Section } from "./DayView";
import { CYCLE_LENGTH, PERIOD_LENGTH } from "./mockData";

export function SettingsView() {
  return (
    <div className="space-y-4">
      <h2 className="pixel-title text-center text-2xl">Settings</h2>
      <Section title="Your rhythm">
        <dl className="grid grid-cols-2 gap-2 font-journal text-xl">
          <dt className="text-silver-500">Cycle length</dt>
          <dd className="text-silver-100">~{CYCLE_LENGTH} days (learned)</dd>
          <dt className="text-silver-500">Tide length</dt>
          <dd className="text-silver-100">~{PERIOD_LENGTH} days (learned)</dd>
        </dl>
      </Section>
      <Section title="Back up your Grimoire">
        <p className="font-journal text-lg text-silver-300">
          Everything lives only in this browser. Export a backup file now and then so you never lose it.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="pixel-button pixel-button--gold">
            <Download size={16} /> Export Grimoire
          </button>
          <button type="button" className="pixel-button pixel-button--ghost">
            <Upload size={16} /> Import
          </button>
        </div>
      </Section>
      <p className="px-2 font-journal text-base text-silver-500">
        The Lunar Grimoire is a reflection tool, not a medical device. Predictions are estimates. Never rely on them for contraception.
      </p>
    </div>
  );
}
