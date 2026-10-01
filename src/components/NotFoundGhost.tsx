"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import TransitionLink from "./TransitionLink";

// How far (px) and how much (deg) the ghost leans toward the pointer.
const MAX_SHIFT = 18;
const MAX_TILT = 8;

export default function NotFoundGhost() {
  const ghostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;

    const reset = () => {
      ghost.style.setProperty("--ghost-x", "0px");
      ghost.style.setProperty("--ghost-y", "0px");
      ghost.style.setProperty("--ghost-tilt", "0deg");
    };

    const onMove = (e: PointerEvent) => {
      if (reduce.matches || !fine.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = ghost.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
        const x = Math.max(-1, Math.min(1, dx));
        const y = Math.max(-1, Math.min(1, dy));
        ghost.style.setProperty("--ghost-x", `${(x * MAX_SHIFT).toFixed(1)}px`);
        ghost.style.setProperty("--ghost-y", `${(y * MAX_SHIFT * 0.6).toFixed(1)}px`);
        ghost.style.setProperty("--ghost-tilt", `${(x * MAX_TILT).toFixed(1)}deg`);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    reduce.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
      reduce.removeEventListener("change", reset);
    };
  }, []);

  return (
    <section className="not-found-page">
      <p className="not-found-label">Error 404 / Page not found</p>
      <h1 className="not-found-code" aria-label="404">
        <span aria-hidden="true">4</span>
        <span className="not-found-ghost" ref={ghostRef} aria-hidden="true">
          {/* 2x raster of ghost.svg: the vector is 5 MB of stipple paths */}
          <Image width={386} height={387} src="/ghost-about.webp" alt="" unoptimized priority />
        </span>
        <span aria-hidden="true">4</span>
      </h1>
      <p className="not-found-text">Looks like this page has ghosted you.</p>
      <TransitionLink href="/" className="about-cta-button not-found-home">
        Back to home
      </TransitionLink>
    </section>
  );
}
