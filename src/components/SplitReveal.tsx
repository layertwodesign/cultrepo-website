"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  className?: string;
  stagger?: number;
  startDelay?: number;
  /**
   * For text that is always above the fold: run the reveal as a CSS animation
   * from first paint rather than after hydration, so it doesn't hold back LCP.
   */
  immediate?: boolean;
};

export default function SplitReveal({
  text,
  className = "",
  stagger = 40,
  startDelay = 0,
  immediate = false,
}: Props) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || immediate) return;
    const trigger = () =>
      startDelay ? setTimeout(() => setShown(true), startDelay) : setShown(true);
    if (typeof IntersectionObserver === "undefined") {
      trigger();
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trigger();
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [startDelay, immediate]);

  // Split only on ASCII whitespace so NBSP (U+00A0) is preserved inside words —
  // lets callers glue word pairs together to prevent orphans.
  const tokens = text.split(/([ \t\n]+)/);
  let wordIdx = 0;

  return (
    <span
      ref={ref}
      className={`split-reveal ${immediate ? "split-reveal-auto" : shown ? "split-reveal-in" : ""} ${className}`}
    >
      {tokens.map((tok, i) => {
        if (tok === "" || /^\s+$/.test(tok)) {
          return <span key={i}>{tok}</span>;
        }
        const idx = wordIdx++;
        return (
          <span key={i} className="split-reveal-word">
            <span
              className="split-reveal-word-inner"
              style={
                immediate
                  ? { animationDelay: `${startDelay + idx * stagger}ms` }
                  : { transitionDelay: `${idx * stagger}ms` }
              }
            >
              {tok}
            </span>
          </span>
        );
      })}
    </span>
  );
}
