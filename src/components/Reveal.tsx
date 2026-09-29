"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  /**
   * Show content on the first screen immediately instead of waiting for an
   * entrance animation or hydration. Lower content still reveals on scroll.
   */
  immediate?: boolean;
};

export default function Reveal({ children, delay = 0, className = "", immediate = false }: Props) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || immediate) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [immediate]);

  if (immediate) {
    return (
      <div
        ref={ref}
        className={`reveal reveal-auto ${className}`}
        style={delay ? { animationDelay: `${delay}ms` } : undefined}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
