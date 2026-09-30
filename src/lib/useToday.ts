"use client";

import { useSyncExternalStore } from "react";
import { dateKey, type DateKey } from "./dates";

/*
 * Today's date key, kept current: it rolls over just after midnight and is
 * re-checked whenever the app comes back to the foreground (a phone left on
 * the Grimoire overnight shows the new day when reopened).
 */

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const scheduleMidnight = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    timer = setTimeout(() => {
      onChange();
      scheduleMidnight();
    }, next.getTime() - now.getTime());
  };
  scheduleMidnight();
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

const getToday = () => dateKey(new Date());

/** Null during server rendering, where "today" isn't known. */
export function useToday(): DateKey | null {
  return useSyncExternalStore(subscribe, getToday, () => null);
}
