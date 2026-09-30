"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SparkleBurst } from "@/components/pixel/SparkleBurst";
import { VesselSprite, type LiquidColor, type Vessel } from "@/components/sprites/VesselSprite";

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
