"use client";

import { ReactNode, useEffect, useRef } from "react";

const BASE_SPEED = 60; // px per second at full speed
const HOVER_SPEED = 0.15; // multiplier when hovered
const LERP = 4; // higher = faster speed transition
const FADE_OUT_MS = 600; // the menu overlay's closing fade, plus a little

type Props = {
  items: ReactNode[];
  /** Stop the animation loop while the strip can't be seen (menu closed). */
  paused?: boolean;
};

export default function MenuMarquee({ items, paused = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const pausedRef = useRef(paused);
  const resumeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const state = {
      pos: 0,
      speed: 1,
      target: 1,
      lastT: 0,
      width: 0,
      stopAt: 0,
    };

    const measure = () => {
      // scrollWidth includes both halves; one cycle = half
      state.width = track.scrollWidth / 2;
    };
    measure();

    let raf = 0;
    const tick = (t: number) => {
      if (!state.lastT) state.lastT = t;
      const dt = Math.min(0.1, (t - state.lastT) / 1000);
      state.lastT = t;

      state.target = hoveredRef.current ? HOVER_SPEED : 1;
      state.speed += (state.target - state.speed) * Math.min(1, dt * LERP);

      state.pos -= BASE_SPEED * state.speed * dt;
      if (state.width > 0) {
        if (state.pos <= -state.width) state.pos += state.width;
      }

      track.style.transform = `translate3d(${state.pos}px, 0, 0)`;

      // Menu closed: keep moving through its fade-out, then idle until reopened.
      if (pausedRef.current) {
        if (!state.stopAt) state.stopAt = t + FADE_OUT_MS;
        if (t >= state.stopAt) {
          raf = 0;
          return;
        }
      } else {
        state.stopAt = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    resumeRef.current = () => {
      if (raf) return;
      state.lastT = 0;
      state.stopAt = 0;
      raf = requestAnimationFrame(tick);
    };
    if (!pausedRef.current) resumeRef.current();

    const ro = new ResizeObserver(measure);
    ro.observe(track);

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      resumeRef.current = () => {};
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) resumeRef.current();
  }, [paused]);

  return (
    <div
      className="menu-marquee"
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
    >
      <div className="menu-marquee-track" ref={trackRef}>
        {items}
      </div>
    </div>
  );
}
