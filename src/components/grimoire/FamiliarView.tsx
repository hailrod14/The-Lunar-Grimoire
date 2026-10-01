"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { FamiliarSprite } from "@/components/sprites/FamiliarSprite";
import { SparkleGlyph } from "@/components/sprites/Glyphs";
import { PHASE_LABEL } from "@/lib/cycle";
import type { DateKey } from "@/lib/dates";
import {
  ACCESSORIES,
  DEFAULT_NAMES,
  SPECIES,
  SPECIES_INFO,
  familiarMood,
  inSeason,
  moodLine,
  newlyInSeason,
  owns,
  type Mood,
  type Slot,
  type Species,
} from "@/lib/familiars";
import { adoptFamiliar, collectAccessories, updateFamiliar } from "@/lib/grimoire";
import { dispatch } from "@/lib/store";
import type { Familiar, Grimoire } from "@/lib/types";
import { Section } from "./Section";

const MOOD_TITLE: Record<Mood, string> = {
  dark: "Sleepy",
  waxing: "Curious",
  full: "Radiant",
  waning: "Cozy",
};

/** The small greeting on the calendar page. */
export function FamiliarCard({ g, today, onOpen }: { g: Grimoire; today: DateKey; onOpen: () => void }) {
  const f = g.familiar;
  if (!f) {
    return (
      <button type="button" onClick={onOpen} className="pixel-frame flex w-[calc(100%-8px)] items-center gap-3 p-3 text-left hover:brightness-110">
        <span className="animate-float">
          <SparkleGlyph size={28} />
        </span>
        <span className="font-journal text-lg leading-snug text-silver-100">
          <span className="text-gold-300">A familiar is waiting to find you.</span> Tap to meet them.
        </span>
      </button>
    );
  }
  const mood = familiarMood(g, today);
  const fresh = newlyInSeason(f, today, g.settings.hemisphere);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${f.name}, your familiar: ${MOOD_TITLE[mood]}. Open their page.`}
      className="pixel-frame flex w-[calc(100%-8px)] items-center gap-3 p-2 pr-3 text-left hover:brightness-110"
    >
      <FamiliarSprite familiar={f} mood={mood} size={64} />
      <span className="min-w-0 font-journal text-lg leading-snug text-silver-100">
        <span className="block text-gold-300">
          {f.name} · {MOOD_TITLE[mood]}
        </span>
        <span className="block text-silver-300">{moodLine(f, mood)}</span>
        {fresh.length > 0 && <span className="block text-gold-300">✨ New in the wardrobe: {fresh.map((a) => a.name).join(", ")}</span>}
      </span>
    </button>
  );
}

export function FamiliarView({ g, today }: { g: Grimoire; today: DateKey }) {
  const f = g.familiar;
  const hemisphere = g.settings.hemisphere;

  // Seasonal pieces join the wardrobe once their season comes around.
  const freshIds = f ? newlyInSeason(f, today, hemisphere).map((a) => a.id).join(",") : "";
  useEffect(() => {
    if (freshIds) dispatch((x) => collectAccessories(x, freshIds.split(",")));
  }, [freshIds]);

  if (!f) return <Adopt today={today} />;

  const mood = familiarMood(g, today);
  return (
    <div className="space-y-4">
      <div className="pixel-frame pixel-frame--gold flex flex-col items-center gap-2 p-4 text-center">
        <h2 className="pixel-title text-2xl">{f.name}</h2>
        <div className="pt-4">
          <FamiliarSprite familiar={f} mood={mood} size={176} interactive title={f.name} />
        </div>
        <p className="font-journal text-xl leading-snug text-silver-100">{moodLine(f, mood)}</p>
        <p className="font-journal text-base text-silver-500">
          {MOOD_TITLE[mood]} for {g.settings.cycleTracking ? `your ${PHASE_LABEL[mood]}` : `the sky's ${PHASE_LABEL[mood]}`} · tap{" "}
          {f.name} to give them a pet
        </p>
      </div>

      <Wardrobe f={f} today={today} g={g} mood={mood} />
      <Appearance f={f} />
    </div>
  );
}

function Wardrobe({ f, g, today, mood }: { f: Familiar; g: Grimoire; today: DateKey; mood: Mood }) {
  const [slot, setSlot] = useState<Slot>("head");
  const items = ACCESSORIES.filter((a) => a.slot === slot).sort(
    (a, b) => Number(!owns(f, a)) - Number(!owns(f, b)) || Number(!a.season) - Number(!b.season),
  );
  const worn = f[slot];
  const wear = (id: string | undefined) => dispatch((x) => updateFamiliar(x, { [slot]: id }));

  return (
    <Section title="Wardrobe">
      <div className="grid grid-cols-2 gap-1" role="group" aria-label="Wardrobe drawers">
        {(["head", "neck"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={slot === s}
            onClick={() => setSlot(s)}
            className={`px-3 py-2 ${slot === s ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-300 hover:bg-midnight-700"}`}
          >
            {s === "head" ? "Hats & crowns" : "Neckwear"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1">
        <button
          type="button"
          aria-pressed={!worn}
          onClick={() => wear(undefined)}
          className={`flex flex-col items-center gap-1 p-2 ${!worn ? "bg-midnight-600 outline-2 outline-gold-300" : "bg-midnight-950 hover:bg-midnight-700"}`}
        >
          <FamiliarSprite familiar={{ ...f, [slot]: undefined }} mood={mood === "dark" ? "dark" : "waxing"} size={56} still />
          <span className="font-journal text-base leading-tight text-silver-100">Nothing</span>
        </button>
        {items.map((a) => {
          const owned = owns(f, a);
          const on = worn === a.id;
          const seasonal = a.season && inSeason(a, today, g.settings.hemisphere);
          return (
            <button
              key={a.id}
              type="button"
              disabled={!owned}
              aria-pressed={on}
              onClick={() => wear(a.id)}
              className={`relative flex flex-col items-center gap-1 p-2 ${on ? "bg-midnight-600 outline-2 outline-gold-300" : "bg-midnight-950 hover:bg-midnight-700"} disabled:hover:bg-midnight-950`}
            >
              <span className={owned ? "" : "opacity-25 grayscale"}>
                <FamiliarSprite familiar={{ ...f, [slot]: a.id }} mood={mood === "dark" ? "dark" : "waxing"} size={56} still />
              </span>
              <span className="font-journal text-base leading-tight text-silver-100">{a.name}</span>
              {!owned && a.season && (
                <span className="flex items-center gap-1 font-journal text-sm leading-tight text-silver-500">
                  <Lock size={12} aria-hidden /> Arrives in {a.season.label}
                </span>
              )}
              {owned && seasonal && <span className="font-journal text-sm leading-tight text-gold-300">In season</span>}
            </button>
          );
        })}
      </div>
      <p className="font-journal text-base text-silver-500">Seasonal pieces join the wardrobe when their season arrives, and stay once collected.</p>
    </Section>
  );
}

function CoatPicker({ species, coat, onPick }: { species: Species; coat: number; onPick: (n: number) => void }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1" role="group" aria-label="Colours">
      {SPECIES_INFO[species].coats.map((c, i) => (
        <button
          key={c.name}
          type="button"
          aria-pressed={coat === i}
          onClick={() => onPick(i)}
          className={`flex flex-col items-center gap-1 p-2 ${coat === i ? "bg-midnight-600 outline-2 outline-gold-300" : "bg-midnight-950 hover:bg-midnight-700"}`}
        >
          <FamiliarSprite familiar={{ species, coat: i }} mood="waxing" size={48} still />
          <span className="font-journal text-base leading-tight text-silver-100">{c.name}</span>
        </button>
      ))}
    </div>
  );
}

function SpeciesPicker({ selected, onPick }: { selected?: Species; onPick: (s: Species) => void }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1" role="group" aria-label="Creatures">
      {SPECIES.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={selected === s}
          onClick={() => onPick(s)}
          className={`flex flex-col items-center gap-1 p-2 ${selected === s ? "bg-midnight-600 outline-2 outline-gold-300" : "bg-midnight-950 hover:bg-midnight-700"}`}
        >
          <FamiliarSprite familiar={{ species: s, coat: 0 }} mood="waxing" size={56} still />
          <span className="font-journal text-base leading-tight text-silver-100">{SPECIES_INFO[s].name}</span>
        </button>
      ))}
    </div>
  );
}

function NameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-silver-300">Name</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={40}
        className="block w-full bg-midnight-950 px-3 py-2 font-journal text-lg text-silver-100 outline-2 outline-violet-500 focus:outline-gold-300"
      />
    </label>
  );
}

function Appearance({ f }: { f: Familiar }) {
  const [changing, setChanging] = useState(false);
  const [name, setName] = useState(f.name);
  const set = (patch: Partial<Familiar>) => dispatch((x) => updateFamiliar(x, patch));

  return (
    <Section title="Appearance">
      <NameInput
        value={name}
        onChange={(v) => {
          setName(v);
          if (v.trim()) set({ name: v.trim() });
        }}
      />
      <p className="text-sm text-silver-300">Colour</p>
      <CoatPicker species={f.species} coat={f.coat} onPick={(coat) => set({ coat })} />
      {changing ? (
        <div className="space-y-2">
          <p className="text-sm text-silver-300">Choose a different creature. {f.name} keeps their name and wardrobe.</p>
          <SpeciesPicker
            selected={f.species}
            onPick={(species) => {
              set({ species, coat: 0 });
              setChanging(false);
            }}
          />
          <button type="button" onClick={() => setChanging(false)} className="pixel-button pixel-button--ghost">
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setChanging(true)} className="pixel-button pixel-button--ghost">
          Change creature
        </button>
      )}
    </Section>
  );
}

function Adopt({ today }: { today: DateKey }) {
  const [species, setSpecies] = useState<Species | null>(null);
  const [coat, setCoat] = useState(0);
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="pixel-title text-2xl">Choose your familiar</h2>
        <p className="font-journal text-lg text-silver-300">
          A small companion who follows your tide: sleepy in the Dark Moon, curious as it waxes, radiant at the Full Moon, and cozy as it
          wanes.
        </p>
      </div>
      <Section title="Who found you?">
        <SpeciesPicker
          selected={species ?? undefined}
          onPick={(s) => {
            setSpecies(s);
            setCoat(0);
            setName((n) => (!n || Object.values(DEFAULT_NAMES).includes(n) ? DEFAULT_NAMES[s] : n));
          }}
        />
      </Section>
      {species && (
        <Section title="Make them yours">
          <div className="flex justify-center pt-2">
            <FamiliarSprite familiar={{ species, coat }} mood="waxing" size={128} />
          </div>
          <NameInput value={name} onChange={setName} />
          <p className="text-sm text-silver-300">Colour</p>
          <CoatPicker species={species} coat={coat} onPick={setCoat} />
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() =>
              dispatch((x) => adoptFamiliar(x, { species, coat, name: name.trim(), collected: [], adoptedOn: today }))
            }
            className="pixel-button pixel-button--gold disabled:opacity-40"
          >
            Welcome, {name.trim() || "friend"}!
          </button>
        </Section>
      )}
    </div>
  );
}
