"use client";

import { useEffect } from "react";

// Drives a CSS custom property `--ruler-y` on <html> based on scroll position.
// The camera-ruler bg-position-y reads this to drift the marks against scroll.
export default function RulerParallax() {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      document.documentElement.style.setProperty("--ruler-y", `${window.scrollY}px`);
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
