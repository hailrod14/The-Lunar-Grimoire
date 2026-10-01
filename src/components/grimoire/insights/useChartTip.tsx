"use client";

import { useRef, useState } from "react";

type Tip = { x: number; y: number; value: string; label: string };

/**
 * One tooltip per chart. Every mark that calls `bind(value, label)` shows it
 * on hover, keyboard focus, and tap; the value leads and the label follows.
 * Values are also printed on the chart, so the tooltip only adds detail.
 */
export function useChartTip() {
  const container = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const show = (el: HTMLElement, value: string, label: string) => {
    const box = container.current?.getBoundingClientRect();
    if (!box) return;
    const r = el.getBoundingClientRect();
    const half = Math.min(90, box.width / 2);
    const x = Math.min(box.width - half, Math.max(half, r.left + r.width / 2 - box.left));
    setTip({ x, y: r.top - box.top, value, label });
  };
  const hide = () => setTip(null);

  const bind = (value: string, label: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => show(e.currentTarget, value, label),
    onFocus: (e: React.FocusEvent<HTMLElement>) => show(e.currentTarget, value, label),
    onClick: (e: React.MouseEvent<HTMLElement>) => show(e.currentTarget, value, label),
    onMouseLeave: hide,
    onBlur: hide,
  });

  const node = tip ? (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 w-max max-w-[180px] -translate-x-1/2 -translate-y-full bg-midnight-950 px-2 py-1 shadow-[0_0_0_2px_var(--color-gold-700)]"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      <span className="block font-journal text-xl leading-tight text-silver-100">{tip.value}</span>
      <span className="block font-journal text-base leading-tight text-silver-500">{tip.label}</span>
    </div>
  ) : null;

  return { container, bind, node };
}
