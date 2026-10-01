"use client";

import { useEffect, useRef } from "react";
import { curlFrame, type Pt, type TurnDirection } from "@/lib/curl";

/** What the back of the turning page looks like. */
export type PageBack = "paper" | "parchment" | "leather";

const BACKS: Record<PageBack, [string, string]> = {
  paper: ["#4d45a8", "#141137"], // the back of a midnight page
  parchment: ["#fffaf0", "#b8955a"],
  leather: ["#7a52c0", "#1b0e2b"], // the cover's violet endpaper
};

const DURATION_MS = 680;
/** The curl moves in visible steps, like a sprite animation. */
const STEPS = 17;
/** Snap fold corners to the 4px UI pixel. */
const snap = (n: number) => Math.round(n / 4) * 4;
const polygon = (pts: Pt[]) =>
  pts.length < 3 ? "polygon(0 0, 0 0, 0 0)" : `polygon(${pts.map((p) => `${snap(p.x)}px ${snap(p.y)}px`).join(", ")})`;

type Props = {
  html: string;
  className: string;
  /** Height of the old page, so the curl matches it rather than the new page. */
  height: number;
  dir: TurnDirection;
  back: PageBack;
  onDone: () => void;
};

/** Peels a snapshot of the old page away by its corner, revealing the new page beneath. */
export function PageCurl({ html, className, height: pageHeight, dir, back, onDone }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    // Curl only what can be seen: the old page's height, cut off at the bottom of the screen.
    const box = wrap.current!.parentElement!.getBoundingClientRect();
    const width = box.width;
    const height = Math.max(1, Math.min(pageHeight, box.height, window.innerHeight - Math.max(0, box.top)));
    wrap.current!.style.height = `${height}px`;
    const [light, dark] = BACKS[back];
    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const t = Math.ceil(progress * STEPS) / STEPS;
      const frame = curlFrame(width, height, t, dir);
      page.current!.style.clipPath = polygon(frame.page);
      flap.current!.style.clipPath = polygon(frame.flap);
      // Light catches the fold; the lifted tip falls into shadow.
      const angle = (Math.atan2(-frame.normal.x, frame.normal.y) * 180) / Math.PI;
      flap.current!.style.backgroundImage = `linear-gradient(${angle}deg, ${light}, ${dark})`;
      if (progress < 1) raf = requestAnimationFrame(draw);
      else onDone();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [back, dir, onDone, pageHeight]);

  return (
    <div ref={wrap} aria-hidden inert className="pointer-events-none absolute inset-x-0 top-0 z-20 overflow-hidden">
      <div ref={page} className={`${className} page-turn`} dangerouslySetInnerHTML={{ __html: html }} />
      {/* A hard, pixel-style shadow under the curl */}
      <div className="absolute inset-0" style={{ filter: "drop-shadow(-6px 6px 0 rgb(0 0 0 / 0.35))" }}>
        <div ref={flap} className="absolute inset-0" style={{ clipPath: "polygon(0 0, 0 0, 0 0)" }} />
      </div>
    </div>
  );
}
