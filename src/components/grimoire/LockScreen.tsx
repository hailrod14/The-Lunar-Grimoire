"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { readCoverSnapshot } from "@/lib/coverSnapshot";
import { dateKey } from "@/lib/dates";
import { eraseEverything, prepareUnlock, useGrimoireState } from "@/lib/store";
import { CombinationLock, lockMetrics } from "./CombinationLock";
import { LockedCover } from "./Cover";

/** After this many wrong tries, wait before the next one. */
const FREE_TRIES = 5;
const COOLDOWN_SECONDS = 30;
/** Time for the shackle to spring and the lock to drop away before the book appears. */
const OPEN_DELAY_MS = 950;
const MIN_DIGITS = 4;
const MAX_DIGITS = 8;

/**
 * Shown in place of the Grimoire while it's sealed with a PIN: the closed
 * book with its familiar and stickers, strapped shut with a crescent-moon lock.
 */
export function LockScreen() {
  const state = useGrimoireState();
  const known = state?.status === "locked" ? state.sealed.digits : undefined;
  const [chosen, setChosen] = useState(MIN_DIGITS);
  const digits = known ?? chosen;
  const [cover] = useState(readCoverSnapshot);
  const [today] = useState(() => dateKey(new Date()));

  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [forgot, setForgot] = useState<"no" | "asking" | "confirming">("no");

  const waiting = Math.max(0, Math.ceil((waitUntil - now) / 1000));
  useEffect(() => {
    if (!waitUntil) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [waitUntil]);

  const tryCode = async (code: string) => {
    if (busy || waiting) return false;
    setBusy(true);
    const open = await prepareUnlock(code);
    setBusy(false);
    if (open) {
      setOpening(true);
      setTimeout(open, OPEN_DELAY_MS);
      return true;
    }
    const tries = wrong + 1;
    setWrong(tries);
    if (tries >= FREE_TRIES) setWaitUntil(Date.now() + COOLDOWN_SECONDS * 1000);
    return false;
  };

  const status = busy ? "Turning the lock…" : waiting > 0 ? `The lock is stiff. Try again in ${waiting} s.` : wrong > 0 ? "The lock holds fast." : "";

  const notes = (
    <div className={`flex flex-col items-end gap-1 text-right ${opening ? "opacity-0 transition-opacity" : ""}`}>
      {known === undefined && (
        <div className="flex items-center gap-1 bg-black/40 px-2" role="group" aria-label="How many digits is your code?">
          <span className="font-journal text-base text-gold-100">Digits</span>
          <button
            type="button"
            aria-label="One fewer wheel"
            disabled={chosen <= MIN_DIGITS}
            onClick={() => setChosen((n) => n - 1)}
            className="grid size-7 place-items-center text-gold-300 disabled:opacity-40"
          >
            <Minus size={14} strokeWidth={3} />
          </button>
          <span className="font-journal text-lg text-gold-300">{chosen}</span>
          <button
            type="button"
            aria-label="One more wheel"
            disabled={chosen >= MAX_DIGITS}
            onClick={() => setChosen((n) => n + 1)}
            className="grid size-7 place-items-center text-gold-300 disabled:opacity-40"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      )}
      <p role="status" className={`font-journal text-base leading-tight text-gold-100 ${status ? "bg-black/40 px-2" : ""}`}>
        {status}
      </p>
      {forgot === "no" && (
        <button type="button" onClick={() => setForgot("asking")} className="font-journal text-base text-gold-300 underline">
          Forgot your code?
        </button>
      )}
    </div>
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="sr-only">The Lunar Grimoire is locked</h1>
      <div className="pixel-frame pixel-frame--gold">
        <LockedCover
          today={today}
          familiar={cover?.familiar}
          stickers={cover?.stickers ?? []}
          opening={opening}
          lockWidth={lockMetrics(digits).width}
          shackleHeight={lockMetrics(digits).shackleHeight}
          lock={<CombinationLock key={digits} digits={digits} disabled={busy || waiting > 0} onTry={tryCode} />}
          notes={notes}
        />
      </div>

      {forgot !== "no" && (
        <div className="pixel-frame pixel-frame--parchment mt-4 space-y-2 p-3 font-journal text-lg">
          <p>
            Without the code this Grimoire can&apos;t be opened. That&apos;s what keeps it private. You can erase it and start fresh, then
            restore a backup file or your synced copy if you have one.
          </p>
          {forgot === "asking" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForgot("confirming")} className="pixel-button pixel-button--ghost">
                Erase and start fresh…
              </button>
              <button type="button" onClick={() => setForgot("no")} className="pixel-button pixel-button--ghost">
                Never mind
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void eraseEverything()} className="bg-blood px-3 py-2 text-white">
                Yes, erase everything
              </button>
              <button type="button" onClick={() => setForgot("no")} className="pixel-button pixel-button--ghost">
                Keep trying
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
