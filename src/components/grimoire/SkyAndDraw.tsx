"use client";

import { useState } from "react";
import { StarGlyph } from "@/components/sprites/Glyphs";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import type { DateKey } from "@/lib/dates";
import { ELDER_FUTHARK, MAJOR_ARCANA, drawFrom, type Deck, type Draw } from "@/lib/divination";
import { setDraw } from "@/lib/grimoire";
import { RITUALS } from "@/lib/prompts";
import { dispatch } from "@/lib/store";
import type { Hemisphere } from "@/lib/theme";
import type { DayEntry } from "@/lib/types";
import { skyDay } from "@/lib/wheel";
import { Section } from "./Section";

/** A sabbat or a new/full moon on this day, if there is one. */
export function SkyCard({ date, hemisphere }: { date: DateKey; hemisphere: Hemisphere }) {
  const { sabbat, moon } = skyDay(date, hemisphere);
  if (!sabbat && !moon) return null;
  return (
    <div className="pixel-frame pixel-frame--gold space-y-2 p-3">
      {sabbat && (
        <div className="flex items-start gap-2">
          <span className="mt-1 shrink-0">
            <StarGlyph size={15} />
          </span>
          <p className="font-journal text-lg leading-snug text-silver-100">
            <span className="text-gold-300">{sabbat.name}</span>, {sabbat.note}. <span className="text-silver-300">{sabbat.meaning}</span>
          </p>
        </div>
      )}
      {moon && (
        <div className="flex items-center gap-2">
          <PixelMoon phase={moon.kind === "full" ? 0.5 : 0} variant="sky" size={22} resolution={12} />
          <p className="font-journal text-lg leading-snug text-silver-100">
            {moon.kind === "full" ? (
              <>
                The <span className="text-gold-300">{moon.name}</span> is full at {moon.time}
                {moon.note ? `: ${moon.note}` : ""}.
              </>
            ) : (
              <>The moon is new at {moon.time}. A time for quiet beginnings.</>
            )}
          </p>
        </div>
      )}
      {moon && (
        <p className="font-journal text-lg leading-snug text-silver-300">
          <span className="text-gold-300">🕯️ A small ritual: </span>
          {RITUALS[moon.kind]}
        </p>
      )}
    </div>
  );
}

/** An Elder Futhark rune drawn from its strokes. */
export function RuneGlyph({ index, size = 64 }: { index: number; size?: number }) {
  const rune = ELDER_FUTHARK[index];
  return (
    <svg viewBox="-2 -1 10 12" width={size * 0.8} height={size} role="img" aria-label={`The rune ${rune.name}`}>
      {rune.strokes.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={1.1} strokeLinecap="square" />
      ))}
    </svg>
  );
}

function DrawnCard({ draw, fresh }: { draw: Draw; fresh: boolean }) {
  if (draw.deck === "tarot") {
    const card = MAJOR_ARCANA[draw.card];
    return (
      <div className={`flex gap-3 ${fresh ? "card-reveal" : ""}`}>
        <div className="pixel-frame pixel-frame--parchment grid h-28 w-20 shrink-0 place-items-center text-center">
          <div className={draw.reversed ? "rotate-180" : ""}>
            <p className="font-journal text-2xl text-ink">{card.numeral}</p>
            <StarGlyph size={15} />
          </div>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-gold-300">{card.name}</p>
          {draw.reversed && <p className="font-journal text-base leading-none text-silver-500">reversed</p>}
          <p className="font-journal text-lg leading-snug text-silver-300">{draw.reversed ? card.reversed : card.upright}</p>
        </div>
      </div>
    );
  }
  const rune = ELDER_FUTHARK[draw.card];
  return (
    <div className={`flex gap-3 ${fresh ? "card-reveal" : ""}`}>
      <div className="pixel-frame grid h-28 w-20 shrink-0 place-items-center bg-midnight-950 text-gold-300">
        <RuneGlyph index={draw.card} size={56} />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-gold-300">
          {rune.name} <span className="font-journal text-lg text-silver-500">· “{rune.sound}”</span>
        </p>
        <p className="font-journal text-lg leading-snug text-silver-300">{rune.meaning}</p>
      </div>
    </div>
  );
}

/** Today: draw a card or cast a rune. Past days show what was drawn, if anything. */
export function DrawSection({ date, today, day }: { date: DateKey; today: DateKey; day: DayEntry }) {
  const [fresh, setFresh] = useState(false);
  if (!day.draw && date !== today) return null;

  const draw = (deck: Deck) => {
    setFresh(true);
    dispatch((x) => setDraw(x, date, drawFrom(deck)));
  };

  return (
    <Section title="The day's draw">
      {day.draw ? (
        <>
          <DrawnCard draw={day.draw} fresh={fresh} />
          {date === today && (
            <button type="button" onClick={() => dispatch((x) => setDraw(x, date, undefined))} className="font-journal text-lg text-violet-300 underline">
              Return it to the deck
            </button>
          )}
        </>
      ) : (
        <>
          <p className="font-journal text-lg text-silver-500">Ask a question of the day, or simply see what comes.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => draw("tarot")} className="pixel-button pixel-button--gold m-0">
              🃏 Draw a card
            </button>
            <button type="button" onClick={() => draw("runes")} className="pixel-button m-0">
              ᚱ Cast a rune
            </button>
          </div>
        </>
      )}
    </Section>
  );
}
