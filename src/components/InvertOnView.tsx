"use client";

import { ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  threshold?: number;
};

export default function InvertOnView({ children, className = "", threshold = 0.25 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.body.classList.add("invert");
        } else {
          document.body.classList.remove("invert");
        }
      },
      { threshold },
    );
    obs.observe(node);
    return () => {
      obs.disconnect();
      document.body.classList.remove("invert");
    };
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
