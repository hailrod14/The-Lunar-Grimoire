import type { Metadata } from "next";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { ElementSprite, type Element } from "@/components/sprites/ElementSprite";
import { LIQUID_COLORS, VESSELS, VESSEL_NAMES, VesselSprite, type LiquidColor } from "@/components/sprites/VesselSprite";
import { BloodDropGlyph, SparkleGlyph, StarGlyph } from "@/components/sprites/Glyphs";
import { FamiliarSprite } from "@/components/sprites/FamiliarSprite";
import { ACCESSORIES, SPECIES, SPECIES_INFO } from "@/lib/familiars";
import { JournalDemo, PotionDemo } from "./Demos";

export const metadata: Metadata = { title: "Design Altar · The Lunar Grimoire" };

const TIDE_PHASES = [
  { name: "Dark Moon", phase: 0, meaning: "Menstrual", color: "bg-tide-dark" },
  { name: "Waxing", phase: 0.25, meaning: "Follicular", color: "bg-tide-waxing" },
  { name: "Full Moon", phase: 0.5, meaning: "Ovulatory", color: "bg-tide-full" },
  { name: "Waning", phase: 0.75, meaning: "Luteal", color: "bg-tide-waning" },
];

const SKY_PHASES = [
  "New", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full", "Waning Gibbous", "Last Quarter", "Waning Crescent",
];

const ELEMENTS: { id: Element; name: string; light: string; shadow: string; color: string }[] = [
  { id: "fire", name: "Fire", light: "Passionate", shadow: "Irritable", color: "text-fire" },
  { id: "water", name: "Water", light: "Intuitive", shadow: "Emotional", color: "text-water" },
  { id: "earth", name: "Earth", light: "Grounded", shadow: "Tired", color: "text-earth" },
  { id: "air", name: "Air", light: "Creative", shadow: "Anxious", color: "text-air" },
];

const SWATCHES = [
  ["void", "midnight-900", "midnight-700", "violet-700", "violet-500", "violet-300"],
  ["gold-900", "gold-700", "gold-500", "gold-300", "gold-100"],
  ["silver-700", "silver-500", "silver-300", "silver-100"],
  ["ink", "parchment-700", "parchment-500", "parchment-300", "parchment-100"],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="pixel-title flex items-center gap-2 text-xl">
        <StarGlyph /> {title}
      </h2>
      {children}
    </section>
  );
}

export default function Altar() {
  return (
    <main className="mx-auto max-w-3xl space-y-12 px-4 py-10 pb-24">
      <header className="space-y-2 text-center">
        <p className="font-journal text-xl text-violet-300">Step 1 · Design system preview</p>
        <h1 className="pixel-title text-4xl">The Design Altar</h1>
        <p className="font-journal text-2xl text-silver-300">Every sprite, color and frame the Grimoire is built from.</p>
      </header>

      <Section title="Your Tide (gold)">
        <div className="pixel-frame pixel-frame--gold grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
          {TIDE_PHASES.map((p) => (
            <figure key={p.name} className="flex flex-col items-center gap-2 text-center">
              <PixelMoon phase={p.phase} variant="tide" size={80} resolution={22} title={`${p.name} tide moon`} />
              <figcaption>
                <span className="block text-gold-300">{p.name}</span>
                <span className="font-journal block text-lg text-silver-500">{p.meaning}</span>
                <span className={`mx-auto mt-1 block h-2 w-10 ${p.color}`} />
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Sky Moon (silver)">
        <div className="pixel-frame pixel-frame--silver grid grid-cols-4 gap-4 p-5 sm:grid-cols-8">
          {SKY_PHASES.map((name, i) => (
            <figure key={name} className="flex flex-col items-center gap-1 text-center">
              <PixelMoon phase={i / 8} variant="sky" size={40} resolution={14} title={`${name} sky moon`} />
              <figcaption className="font-journal text-base leading-tight text-silver-300">{name}</figcaption>
            </figure>
          ))}
        </div>
        <p className="font-journal text-xl text-silver-500">
          On the dashboard the Sky Moon is a small silver badge with a 🔭 label. Your Tide is the big gold moon. They never share a frame.
        </p>
      </Section>

      <Section title="Mood Elements">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ELEMENTS.map((e) => (
            <div key={e.id} className="pixel-frame flex flex-col items-center gap-2 p-4 text-center">
              <ElementSprite element={e.id} size={48} title={e.name} />
              <span className={`text-lg ${e.color}`}>{e.name}</span>
              <span className="font-journal text-lg leading-tight text-silver-300">
                ☀ {e.light}
                <br />☾ {e.shadow}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Potion Vessels">
        <div className="pixel-frame grid grid-cols-3 gap-4 p-5 sm:grid-cols-6">
          {VESSELS.map((v, i) => (
            <figure key={v} className="flex flex-col items-center gap-2 text-center">
              <VesselSprite vessel={v} color={Object.keys(LIQUID_COLORS)[i % Object.keys(LIQUID_COLORS).length] as LiquidColor} size={48} title={VESSEL_NAMES[v]} />
              <figcaption className="font-journal text-lg leading-tight text-silver-300">{VESSEL_NAMES[v]}</figcaption>
            </figure>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(LIQUID_COLORS) as LiquidColor[]).map((c) => (
            <span key={c} className="flex items-center gap-1 font-journal text-lg text-silver-300">
              <VesselSprite vessel="flask" color={c} size={24} /> {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Familiars, by mood">
        <div className="pixel-frame overflow-x-auto p-4">
          <table className="font-journal text-lg text-silver-300">
            <thead>
              <tr>
                <th />
                {(["dark", "waxing", "full", "waning"] as const).map((m) => (
                  <th key={m} className="px-2 font-normal">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPECIES.map((s, i) => (
                <tr key={s}>
                  <th className="pr-2 text-left font-normal">{SPECIES_INFO[s].name}</th>
                  {(["dark", "waxing", "full", "waning"] as const).map((m, j) => {
                    const heads = ACCESSORIES.filter((a) => a.slot === "head");
                    const necks = ACCESSORIES.filter((a) => a.slot === "neck");
                    return (
                      <td key={m} className="p-1">
                        <FamiliarSprite
                          familiar={{ species: s, coat: (i + j) % 4, head: j === 0 ? undefined : heads[(i * 3 + j) % heads.length].id, neck: j === 2 ? necks[i % necks.length].id : undefined }}
                          mood={m}
                          size={96}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Check-off sparkle (tap one)">
        <div className="grid gap-3 sm:grid-cols-2">
          <PotionDemo name="Magnesium Elixir" dose="200 mg · 8:00 pm" vessel="flask" color="violet" />
          <PotionDemo name="Iron Tincture" dose="1 dropper · 9:00 am" vessel="dropper" color="rose" />
        </div>
      </Section>

      <Section title="Book & Quill">
        <JournalDemo />
      </Section>

      <Section title="Buttons & Glyphs">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="pixel-button pixel-button--gold">My tide has begun</button>
          <button type="button" className="pixel-button">Log elements</button>
          <button type="button" className="pixel-button pixel-button--ghost">
            <Download size={16} /> Export Grimoire
          </button>
          <button type="button" className="pixel-button pixel-button--ghost">
            <Upload size={16} /> Import
          </button>
        </div>
        <div className="flex items-center gap-4">
          <BloodDropGlyph size={21} title="Bleeding day" />
          <SparkleGlyph size={21} />
          <StarGlyph size={15} />
        </div>
      </Section>

      <Section title="Palette">
        <div className="space-y-2">
          {SWATCHES.map((row) => (
            <div key={row[0]} className="flex flex-wrap gap-2">
              {row.map((token) => (
                <div key={token} className="flex items-center gap-2">
                  <span className="size-8" style={{ background: `var(--color-${token})`, boxShadow: "0 0 0 2px #00000066" }} />
                  <span className="font-journal w-28 text-lg text-silver-300">{token}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="font-pixel text-silver-300">Pixelify Sans — headings & labels</p>
        <p className="font-journal text-2xl text-silver-300">VT323 — the journal voice, readable at length.</p>
      </Section>

      <div className="text-center">
        <Link href="/" className="pixel-button pixel-button--ghost">← Back</Link>
      </div>
    </main>
  );
}
