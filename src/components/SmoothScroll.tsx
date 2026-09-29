"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    });

    // The open menu locks the page; Lenis would otherwise keep scrolling it.
    const onMenu = (event: Event) => {
      if ((event as CustomEvent<{ open: boolean }>).detail?.open) lenis.stop();
      else lenis.start();
    };
    window.addEventListener("cultrepo:menu", onMenu);
    if (document.documentElement.classList.contains("menu-open")) lenis.stop();

    let id = 0;
    function raf(time: number) {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    }
    id = requestAnimationFrame(raf);

    return () => {
      window.removeEventListener("cultrepo:menu", onMenu);
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
