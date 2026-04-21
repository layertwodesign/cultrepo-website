"use client";

import { useEffect, useRef, useCallback } from "react";

type Props = {
  direction: "in" | "out"; // in = dots cover, out = dots reveal
  running: boolean;
  duration?: number;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

type Dot = { x: number; y: number; delay: number };

function generateDots(count: number): Dot[] {
  const dots: Dot[] = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      x: Math.random(),
      y: Math.random(),
      delay: Math.random(),
    });
  }
  return dots;
}

export default function StippleOverlay({
  direction,
  running,
  duration = 350,
  onComplete,
  className,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>(generateDots(2500));
  const animRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const draw = useCallback(
    (startTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // direction: "in" = dots grow to cover, "out" = dots shrink to reveal
      const p = direction === "in" ? progress : 1 - progress;

      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      const maxR = 14 * dpr;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a0a0a";

      // Batch all dots into one path for performance
      ctx.beginPath();
      const dots = dotsRef.current;
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        // Stagger: each dot appears at a slightly different time
        const dotP = Math.max(0, Math.min(1, (p - dot.delay * 0.25) / 0.75));
        // Ease in quad for snappy feel
        const eased = dotP * dotP;
        const r = eased * maxR;
        if (r > 0.3) {
          const x = dot.x * w;
          const y = dot.y * h;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();

      if (progress < 1) {
        animRef.current = requestAnimationFrame(() => draw(startTime));
      } else {
        onCompleteRef.current?.();
      }
    },
    [direction, duration]
  );

  // Size canvas and run animation when running changes
  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const startTime = Date.now();
    animRef.current = requestAnimationFrame(() => draw(startTime));

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [running, draw]);

  // Initial state: if direction is "out" and not running yet, fill solid
  useEffect(() => {
    if (running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    if (direction === "out") {
      // Start fully covered
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [running, direction]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
