"use client";

import { useState } from "react";
import { SPECIES_INFO, accessory, familiarPalette, type Mood } from "@/lib/familiars";
import type { Familiar } from "@/lib/types";

/*
 * A familiar, dressed and in its mood, drawn as one crisp SVG on a 24 × 24
 * pixel stage: the creature sits at (4, 7) so hats have room above it.
 *   Dark Moon: asleep on a cushion, with drifting z's.
 *   Waxing: bright-eyed, bobbing, the odd sparkle.
 *   Full Moon: hopping and glowing.
 *   Waning: swaying gently beside a steaming cup.
 * Tap an interactive familiar to pet it.
 */

const STAGE = 24;
const AT_X = 4;
const AT_Y = 7;

function pixels(rows: readonly string[], palette: Record<string, string>, dx: number, dy: number, key: string) {
  const out: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (palette[ch]) out.push(<rect key={`${key}${x},${y}`} x={dx + x} y={dy + y} width={end - x} height={1} fill={palette[ch]} />);
      x = end;
    }
  });
  return out;
}

const CUSHION = [".ppppppppppppp.", "pPPPPPPPPPPPPPp", ".ppppppppppppp."];
const CUP = ["wttw.", "wwwwo", "wwwwo", ".ww.."];
const Z = ["zzzz", "..z.", ".z..", "zzzz"];
const SMALL_Z = ["zzz", "..z", "z..", "zzz"];
const STAR = [".y.", "yYy", ".y."];
const HEART = [".r.r.", "rrrrr", ".rrr.", "..r.."];

type Props = {
  familiar: Pick<Familiar, "species" | "coat" | "head" | "neck">;
  mood: Mood;
  size?: number;
  /** Tapping pets it: hearts, a little squish, and its sound. */
  interactive?: boolean;
  /** Freeze all motion (e.g. small previews). */
  still?: boolean;
  title?: string;
};

export function FamiliarSprite({ familiar, mood, size = 96, interactive = false, still = false, title }: Props) {
  const [pets, setPets] = useState(0);
  const info = SPECIES_INFO[familiar.species];
  const asleep = mood === "dark";
  const palette = familiarPalette(familiar.species, familiar.coat, asleep);
  const hat = accessory(familiar.head);
  const neck = accessory(familiar.neck);

  const place = (rows: string[], [cx, row]: [number, number], anchorBottom: boolean) => {
    const w = rows[0].length;
    return { dx: AT_X + Math.round(cx - (w - 1) / 2), dy: AT_Y + (anchorBottom ? row - rows.length + 1 : row) };
  };

  const motion = still ? "" : { dark: "fam-breathe", waxing: "fam-bob", full: "fam-hop", waning: "fam-sway" }[mood];
  const hatAt = hat && place(hat.rows, info.head, true);
  const neckAt = neck && place(neck.rows, info.neck, false);

  const svg = (
    <svg
      viewBox={`0 0 ${STAGE} ${STAGE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`overflow-visible ${mood === "full" && !still ? "fam-glow" : ""}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {asleep && pixels(CUSHION, { p: "#4a2f8a", P: "#6b44b8" }, AT_X + 1, AT_Y + 13, "cushion")}
      {mood === "waning" && pixels(CUP, { w: "#f6ead0", t: "#9a5a2a", o: "#c9a86a" }, 19, 18, "cup")}
      <g className={motion} key={pets} style={{ transformBox: "fill-box", transformOrigin: "bottom" }}>
        <g className={pets && !still ? "fam-squish" : ""} style={{ transformBox: "fill-box", transformOrigin: "bottom" }}>
          {pixels(info.rows, palette, AT_X, AT_Y + (asleep ? 1 : 0), "body")}
          {neck && neckAt && pixels(neck.rows, neck.colors, neckAt.dx, neckAt.dy + (asleep ? 1 : 0), "neck")}
          {hat && hatAt && pixels(hat.rows, hat.colors, hatAt.dx, hatAt.dy + (asleep ? 1 : 0), "hat")}
        </g>
      </g>
      {!still && asleep && (
        <>
          <g className="fam-float">{pixels(Z, { z: "#c3cfea" }, 16, 6, "z1")}</g>
          <g className="fam-float fam-delay">{pixels(SMALL_Z, { z: "#c3cfea" }, 20, 2, "z2")}</g>
        </>
      )}
      {!still && mood === "waning" && <g className="fam-float">{pixels(["s.", ".s", "s."], { s: "#e6e0f0" }, 20, 15, "steam")}</g>}
      {!still && (mood === "full" || mood === "waxing") && (
        <>
          <g className="animate-twinkle">{pixels(STAR, { y: "#ffd866", Y: "#fff4c2" }, 1, 5, "s1")}</g>
          {mood === "full" && <g className="animate-twinkle fam-delay">{pixels(STAR, { y: "#ffd866", Y: "#fff4c2" }, 20, 9, "s2")}</g>}
        </>
      )}
      {pets > 0 && !still && (
        <g key={`hearts${pets}`}>
          <g className="fam-heart">{pixels(HEART, { r: "#f06a95" }, 5, 5, "h1")}</g>
          <g className="fam-heart fam-delay">{pixels(HEART, { r: "#f06a95" }, 15, 3, "h2")}</g>
        </g>
      )}
    </svg>
  );

  if (!interactive) return svg;
  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setPets((n) => n + 1)} aria-label={`Pet ${title ?? "your familiar"}`} className="block cursor-pointer">
        {svg}
      </button>
      {pets > 0 && (
        <span
          key={pets}
          aria-live="polite"
          className="fam-say pointer-events-none absolute -top-2 left-1/2 whitespace-nowrap bg-midnight-950 px-2 py-0.5 font-journal text-base text-gold-300"
        >
          {info.sound}
        </span>
      )}
    </div>
  );
}
