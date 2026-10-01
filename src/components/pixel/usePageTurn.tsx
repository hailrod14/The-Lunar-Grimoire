"use client";

import { useCallback, useRef, useState } from "react";
import type { TurnDirection } from "@/lib/curl";
import { playPageTurn } from "@/lib/sound";
import { PageCurl, type PageBack } from "./PageCurl";

export type { TurnDirection };

type Turning = { html: string; className: string; height: number; dir: TurnDirection; back: PageBack; id: number };

/**
 * Book-style page turns. Attach `pageRef` to the element holding the page
 * content and render `overlay` as its sibling inside a positioned container.
 *
 * `turn(dir, apply)` snapshots the current page, runs `apply` to swap in the
 * new content, then curls the snapshot away by its corner on top of it:
 * forward turns lift the bottom-right corner, backward turns the bottom-left.
 */
export function usePageTurn(defaultBack: PageBack = "paper") {
  const pageRef = useRef<HTMLDivElement>(null);
  const [turning, setTurning] = useState<Turning | null>(null);

  const turn = useCallback(
    (dir: TurnDirection, apply: () => void, back: PageBack = defaultBack) => {
      const page = pageRef.current;
      if (page) {
        const clone = page.cloneNode(true) as HTMLElement;
        // Form values live in DOM properties, not markup, so copy them over.
        const live = page.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
        clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((field, i) => {
          if (field instanceof HTMLTextAreaElement) field.textContent = live[i].value;
          else field.setAttribute("value", live[i].value);
        });
        clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
        setTurning({ html: clone.innerHTML, className: page.className, height: page.offsetHeight, dir, back, id: Date.now() });
        playPageTurn(back === "leather" ? "cover" : "page");
      }
      apply();
    },
    [defaultBack],
  );

  const done = useCallback(() => setTurning(null), []);

  const overlay = turning ? (
    <PageCurl
      key={turning.id}
      html={turning.html}
      className={turning.className}
      height={turning.height}
      dir={turning.dir}
      back={turning.back}
      onDone={done}
    />
  ) : null;

  return { pageRef, overlay, turn };
}
