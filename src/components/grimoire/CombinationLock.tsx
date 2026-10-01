"use client";

import { useRef, useState } from "react";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { LOCK_PALETTE, ROW_PX, WHEEL_GAP_PX, WHEEL_PX, strapLock } from "@/lib/lockArt";

/*
 * An antique brass strap lock, like those on lockable journals: a pointed
 * housing with a round push-knob, notched edges, a window of silver number
 * wheels, and a square end plate where the strap feeds in. Roll a wheel by
 * swiping it, or tap the number showing above or below to roll to it; then
 * press the knob. With a keyboard, arrow keys roll, typed digits set a wheel,
 * and Enter presses the knob.
 */

/** How far a finger travels to roll one number. */
const SWIPE_STEP = 14;
/** The widest the lock may be before it's drawn smaller to fit a phone's cover. */
const MAX_WIDTH = 264;

const digitOf = (pos: number) => ((pos % 10) + 10) % 10;

/** The lock's on-screen size, scaled to fit. */
export function lockMetrics(digits: number) {
  const layout = strapLock(digits);
  const scale = Math.min(1, MAX_WIDTH / layout.width);
  return { width: layout.width * scale, height: layout.height * scale, scale, strapTop: layout.strapTop * scale };
}

function Wheel({
  index,
  count,
  pos,
  disabled,
  onRoll,
  onKey,
  wheelRef,
}: {
  index: number;
  count: number;
  pos: number;
  disabled: boolean;
  onRoll: (pos: number) => void;
  onKey: (e: React.KeyboardEvent) => void;
  wheelRef: (el: HTMLDivElement | null) => void;
}) {
  const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null);
  return (
    <div
      ref={wheelRef}
      role="spinbutton"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Wheel ${index + 1} of ${count}`}
      aria-valuemin={0}
      aria-valuemax={9}
      aria-valuenow={digitOf(pos)}
      aria-disabled={disabled}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        if (disabled) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Rolling still works while the finger stays on the wheel.
        }
        drag.current = { y: e.clientY, start: pos, moved: false };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const steps = Math.round((drag.current.y - e.clientY) / SWIPE_STEP);
        if (steps) drag.current.moved = true;
        if (drag.current.start + steps !== pos) onRoll(drag.current.start + steps);
      }}
      onPointerUp={(e) => {
        // A tap (not a swipe) on the number above or below rolls the wheel to it.
        if (drag.current && !drag.current.moved && !disabled) {
          const r = e.currentTarget.getBoundingClientRect();
          const y = (e.clientY - r.top) / r.height;
          if (y < 1 / 3) onRoll(pos - 1);
          else if (y > 2 / 3) onRoll(pos + 1);
        }
        drag.current = null;
      }}
      onPointerCancel={() => (drag.current = null)}
      className="relative shrink-0 cursor-ns-resize touch-none overflow-hidden bg-[#dfe2ea] select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e6d29a]"
      style={{ width: WHEEL_PX, height: ROW_PX * 3 }}
    >
      {[-2, -1, 0, 1, 2].map((k) => (
        <span
          key={pos + k}
          aria-hidden
          className="absolute inset-x-0 grid place-items-center font-display text-lg leading-none text-[#1a1433] transition-transform duration-150 ease-out"
          style={{ height: ROW_PX, transform: `translateY(${(k + 1) * ROW_PX}px)` }}
        >
          {digitOf(pos + k)}
        </span>
      ))}
      {/* A silver drum, curving away above and below */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(26 20 51 / 0.85), rgb(26 20 51 / 0.25) 30%, transparent 36%, transparent 64%, rgb(26 20 51 / 0.25) 70%, rgb(26 20 51 / 0.85)), linear-gradient(to right, rgb(255 255 255 / 0.35), transparent 40%, rgb(0 0 0 / 0.15))",
        }}
      />
    </div>
  );
}

type Props = {
  digits: number;
  disabled: boolean;
  /** Resolves true if the lock opened. */
  onTry: (code: string) => Promise<boolean>;
};

export function CombinationLock({ digits, disabled, onTry }: Props) {
  const [positions, setPositions] = useState<number[]>(() => Array(digits).fill(0));
  const [state, setState] = useState<"shut" | "rattle" | "open">("shut");
  const wheels = useRef<(HTMLDivElement | null)[]>([]);

  const layout = strapLock(digits);
  const { scale } = lockMetrics(digits);

  const pos = Array.from({ length: digits }, (_, i) => positions[i] ?? 0);
  const roll = (i: number, p: number) => setPositions(pos.map((x, j) => (j === i ? p : x)));
  const code = pos.map(digitOf).join("");

  const tryOpen = async () => {
    if (disabled || state === "open") return;
    const opened = await onTry(code);
    setState(opened ? "open" : "rattle");
    if (!opened) setTimeout(() => setState("shut"), 450);
  };

  const onKey = (i: number) => (e: React.KeyboardEvent) => {
    if (disabled) return;
    const go = (j: number) => wheels.current[Math.max(0, Math.min(digits - 1, j))]?.focus();
    if (e.key === "ArrowUp") roll(i, pos[i] + 1);
    else if (e.key === "ArrowDown") roll(i, pos[i] - 1);
    else if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft" || e.key === "Backspace") go(i - 1);
    else if (e.key === "Enter") void tryOpen();
    else if (/^\d$/.test(e.key)) {
      // Roll the short way round to the typed number, then move on.
      const diff = ((Number(e.key) - digitOf(pos[i]) + 15) % 10) - 5;
      roll(i, pos[i] + diff);
      go(i + 1);
    } else return;
    e.preventDefault();
  };

  const shut = disabled || state === "open";

  return (
    <div style={{ width: layout.width * scale, height: layout.height * scale }}>
      <div
        className={`relative origin-top-left ${state === "rattle" ? "lock-rattle" : ""} ${state === "open" ? "lock-fall" : ""}`}
        style={{ width: layout.width, height: layout.height, transform: scale < 1 ? `scale(${scale})` : undefined }}
      >
        <span aria-hidden className="absolute inset-0" style={{ filter: "drop-shadow(0 4px 0 rgb(0 0 0 / 0.4))" }}>
          <PixelSprite rows={layout.rows} palette={LOCK_PALETTE} size={layout.width} />
        </span>

        {/* The number wheels, behind their window */}
        <div
          className="absolute flex items-center justify-center"
          style={{ ...layout.window, gap: WHEEL_GAP_PX }}
          role="group"
          aria-label={`Combination lock, ${digits} wheels`}
        >
          {pos.map((p, i) => (
            <Wheel
              key={i}
              index={i}
              count={digits}
              pos={p}
              disabled={shut}
              onRoll={(next) => roll(i, next)}
              onKey={onKey(i)}
              wheelRef={(el) => {
                wheels.current[i] = el;
              }}
            />
          ))}
        </div>

        {/* The round knob: press it to open */}
        <button
          type="button"
          onClick={() => void tryOpen()}
          disabled={shut}
          aria-label="Press the knob to open the lock"
          title="Press to open"
          className="absolute rounded-full hover:bg-[#fff4c2]/25 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e6d29a] active:translate-x-px active:translate-y-px disabled:cursor-default"
          style={{ left: layout.knob.left, top: layout.knob.top, width: layout.knob.size, height: layout.knob.size }}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {state === "open" ? "Unlocked." : ""}
      </p>
    </div>
  );
}
