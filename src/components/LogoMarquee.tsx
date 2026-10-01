"use client";

import { ReactNode, useEffect, useRef } from "react";

// Same speed and hover feel as MenuMarquee.
const BASE_SPEED = 60; // px per second at full speed
const HOVER_SPEED = 0.15; // multiplier when hovered
const LERP = 4; // higher = faster speed transition
// Copies of the list in the track. The loop wraps after one copy, so the
// remaining copies must cover the widest viewport.
const COPIES = 3;

type Props = {
  items: ReactNode[];
  label?: string;
};

export default function LogoMarquee({ items, label }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return;

    const state = { pos: 0, speed: 1, lastT: 0, width: 0 };
    // Each copy carries its own trailing gap, so one copy is exactly one cycle.
    const measure = () => {
      state.width = first.getBoundingClientRect().width;
    };
    measure();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let raf = 0;

    const tick = (t: number) => {
      if (!state.lastT) state.lastT = t;
      const dt = Math.min(0.1, (t - state.lastT) / 1000);
      state.lastT = t;

      const target = hoveredRef.current ? HOVER_SPEED : 1;
      state.speed += (target - state.speed) * Math.min(1, dt * LERP);

      state.pos -= BASE_SPEED * state.speed * dt;
      if (state.width > 0 && state.pos <= -state.width) state.pos += state.width;

      track.style.transform = `translate3d(${state.pos}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const sync = () => {
      const run = visible && !reduce.matches;
      if (run && !raf) {
        state.lastT = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (reduce.matches) track.style.transform = "";
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(root);
    const ro = new ResizeObserver(measure);
    ro.observe(first);
    reduce.addEventListener("change", sync);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
      ro.disconnect();
      reduce.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="logo-marquee"
      role="group"
      aria-label={label}
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
    >
      <div className="logo-marquee-track" ref={trackRef}>
        {Array.from({ length: COPIES }, (_, copy) => (
          <div
            key={copy}
            className="logo-marquee-group"
            aria-hidden={copy > 0 ? true : undefined}
          >
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
