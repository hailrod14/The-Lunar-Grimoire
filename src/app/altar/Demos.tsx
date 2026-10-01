"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SparkleBurst } from "@/components/pixel/SparkleBurst";
import { VesselSprite, type LiquidColor, type Vessel } from "@/components/sprites/VesselSprite";
import { Cover } from "@/components/grimoire/Cover";
import type { Sticker } from "@/lib/types";

export function PotionDemo({ name, dose, vessel, color }: { name: string; dose: string; vessel: Vessel; color: LiquidColor }) {
  const [taken, setTaken] = useState(false);
  const [burst, setBurst] = useState(0);

  const toggle = () => {
    if (!taken) setBurst((b) => b + 1);
    setTaken((t) => !t);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={taken}
      className={`pixel-frame ${taken ? "pixel-frame--gold" : ""} flex w-full items-center gap-3 p-3 text-left`}
    >
      <span key={burst} className={`relative ${burst ? "glow-pulse" : ""}`}>
        <VesselSprite vessel={vessel} color={color} size={40} dim={!taken} />
        <SparkleBurst burstKey={burst} />
      </span>
      <span className="flex-1">
        <span className={`block text-lg ${taken ? "text-gold-300" : "text-silver-100"}`}>{name}</span>
        <span className="font-journal block text-xl text-silver-500">{dose}</span>
      </span>
      <span
        aria-hidden
        className={`grid size-7 place-items-center text-lg ${taken ? "bg-gold-500 text-midnight-950" : "bg-midnight-950 text-transparent"}`}
        style={{ boxShadow: "0 0 0 4px var(--color-midnight-600)" }}
      >
        ✓
      </span>
    </button>
  );
}

const PAGES = [
  "Woke under a waxing sky. The coffee tasted like possibility. Air was loud this morning - ideas everywhere, a little too many.",
  "By afternoon things settled. Walked to the market, bought rosemary and a candle that smells like rain. Earth, steady.",
  "Night: tired but kind to myself. Wrote this by lamplight. Tomorrow I will rest.",
];

export function JournalDemo() {
  const [page, setPage] = useState(0);
  return (
    <div className="pixel-frame pixel-frame--parchment p-5">
      <p className="font-journal min-h-32 text-2xl leading-snug">{PAGES[page]}</p>
      <div className="mt-4 flex items-center justify-between font-pixel text-sm text-parchment-700">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="p-1 disabled:opacity-30"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
        <span>
          Page {page + 1} of {PAGES.length}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page === PAGES.length - 1}
          onClick={() => setPage((p) => p + 1)}
          className="p-1 disabled:opacity-30"
        >
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

const SAMPLE_STICKERS: Sticker[] = [
  { id: "season:pumpkin", kind: "season", label: "Pumpkin hat", date: "2026-10-01", mood: "waxing", wearing: "pumpkin", look: { species: "cat", coat: 1, head: "pumpkin" }, x: 17, y: 14, rot: -8, onCover: true, isNew: false },
  { id: "sabbat:2026-09-22", kind: "sabbat", label: "Mabon", date: "2026-09-22", mood: "full", look: { species: "cat", coat: 1, head: "witch-hat" }, x: 83, y: 14, rot: 9, onCover: true, isNew: false },
  { id: "cycle:2026-09-10", kind: "cycle", label: "A new cycle", date: "2026-09-10", mood: "dark", look: { species: "cat", coat: 1 }, x: 16, y: 36, rot: 5, onCover: true, isNew: false },
  { id: "streak:2026-09-14", kind: "streak", label: "14 days of potions", date: "2026-09-14", mood: "full", look: { species: "cat", coat: 1, neck: "bell" }, x: 85, y: 34, rot: -11, onCover: true, isNew: false },
  { id: "season:leaf-scarf", kind: "season", label: "Autumn leaf scarf", date: "2026-10-01", mood: "waxing", wearing: "leaf-scarf", look: { species: "cat", coat: 1, neck: "leaf-scarf" }, x: 85, y: 56, rot: 4, onCover: true, isNew: false },
];

/** The closed book with a familiar and a few stickers, as a design reference. */
export function CoverDemo() {
  return (
    <div className="pixel-frame pixel-frame--gold max-w-md">
      <Cover
        tide={null}
        tracking={false}
        today="2026-10-01"
        familiar={{ species: "cat", name: "Salem", coat: 1, head: "pumpkin", collected: ["pumpkin"], adoptedOn: "2026-09-01", stickers: SAMPLE_STICKERS, cameos: true }}
        mood="waxing"
        onOpen={() => {}}
      />
    </div>
  );
}
