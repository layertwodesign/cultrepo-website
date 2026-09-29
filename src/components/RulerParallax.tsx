"use client";

import { useEffect } from "react";

// Sets `--ruler-y` on the two camera-ruler strips; their bg-position-y reads it
// to drift the marks against scroll. Scoped to the strips (not <html>) and
// skipped when unchanged: a custom property on the root restyles the whole
// page, and the homepage carousel calls this every animation frame.
export function setRulerY(y: number) {
  const value = `${y}px`;
  document.querySelectorAll<HTMLElement>(".camera-ruler").forEach((el) => {
    if (el.style.getPropertyValue("--ruler-y") !== value) el.style.setProperty("--ruler-y", value);
  });
}

// Drives the ruler drift from the page scroll position.
export default function RulerParallax() {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setRulerY(window.scrollY);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
