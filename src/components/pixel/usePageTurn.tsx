"use client";

import { useCallback, useRef, useState } from "react";

export type TurnDirection = "forward" | "backward";

type Flip = { html: string; className: string; dir: TurnDirection; id: number };

/**
 * Book-style page turns. Attach `pageRef` to the element holding the page
 * content and render `overlay` as its sibling inside a positioned container.
 *
 * `turn(dir, apply)` snapshots the current page, runs `apply` to swap in the
 * new content, then flips the snapshot away on top of it: forward turns hinge
 * on the left edge, backward turns hinge on the right.
 */
export function usePageTurn() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState<Flip | null>(null);

  const turn = useCallback((dir: TurnDirection, apply: () => void) => {
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
      setFlip({ html: clone.innerHTML, className: page.className, dir, id: Date.now() });
    }
    apply();
  }, []);

  const overlay = flip ? (
    <div
      key={flip.id}
      aria-hidden
      inert
      className={`${flip.className} page-turn page-turn--${flip.dir}`}
      dangerouslySetInnerHTML={{ __html: flip.html }}
      onAnimationEnd={(e) => {
        if (e.animationName.startsWith("page-turn")) setFlip(null);
      }}
    />
  ) : null;

  return { pageRef, overlay, turn };
}
