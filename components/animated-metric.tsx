"use client";

import { useEffect, useRef, useState } from "react";

const formatter = (digits: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Animates the numeric value, not the DOM layout or the official result itself. */
export function AnimatedMetric({ value, decimals = 0 }: { value: number | null | undefined; decimals?: number }) {
  const current = typeof value === "number" && Number.isFinite(value) ? value : null;
  const [shown, setShown] = useState<number | null>(current === null ? null : 0);
  const shownRef = useRef(current === null ? null : 0);
  useEffect(() => {
    if (current === null) { shownRef.current = null; setShown(null); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = current; setShown(current); return;
    }
    let frame = 0;
    const from = shownRef.current ?? 0;
    const gap = current - from;
    if (Math.abs(gap) < (decimals ? .005 : .5)) {
      shownRef.current = current; setShown(current); return;
    }
    const beginning = performance.now();
    const duration = 820;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - beginning) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const next = progress === 1 ? current : from + gap * ease;
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [current, decimals]);
  return <span className="animated-metric" aria-label={current === null ? "Dado indisponível" : formatter(decimals).format(current)}>{shown === null ? "—" : formatter(decimals).format(shown)}</span>;
}
