"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

const BASE_SPEED = 60; // px per second at full speed
const HOVER_SPEED = 0.15; // multiplier when hovered
const LERP = 4; // higher = faster speed transition

type Props = {
  items: ReactNode[];
};

export default function MenuMarquee({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const state = {
      pos: 0,
      speed: 1,
      target: 1,
      lastT: 0,
      width: 0,
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
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(measure);
    ro.observe(track);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const hoveredRef = useRef(false);
  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  return (
    <div
      className="menu-marquee"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="menu-marquee-track" ref={trackRef}>
        {items}
      </div>
    </div>
  );
}
