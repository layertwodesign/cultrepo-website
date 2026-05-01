"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  speed?: number;
  className?: string;
  startDelay?: number;
};

export default function Typewriter({ text, speed = 14, className = "", startDelay = 0 }: Props) {
  const [revealed, setRevealed] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (startDelay) {
            setTimeout(() => setStarted(true), startDelay);
          } else {
            setStarted(true);
          }
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [startDelay]);

  useEffect(() => {
    if (!started || revealed >= text.length) return;
    const id = setTimeout(() => setRevealed((r) => Math.min(r + 1, text.length)), speed);
    return () => clearTimeout(id);
  }, [started, revealed, text, speed]);

  const visible = text.slice(0, revealed);
  const hidden = text.slice(revealed);
  const complete = revealed >= text.length;

  return (
    <div ref={ref} className={className} style={{ whiteSpace: "pre-line" }}>
      <span>{visible}</span>
      {started && !complete && <span className="typewriter-cursor" />}
      <span style={{ color: "transparent" }}>{hidden}</span>
    </div>
  );
}
