"use client";

import { useSyncExternalStore } from "react";
import { nowTime } from "./dates";

/** The current time as "HH:MM", updated every 20 seconds (null while server rendering). */
export function useNow(): string | null {
  return useSyncExternalStore(
    (onChange) => {
      const timer = setInterval(onChange, 20_000);
      return () => clearInterval(timer);
    },
    () => nowTime(),
    () => null,
  );
}
