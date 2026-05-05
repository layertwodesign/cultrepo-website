"use client";

import { useEffect, useRef, useState } from "react";
import TransitionLink from "@/components/TransitionLink";

export default function BottomWordmark() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "-20% 0px 0px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <TransitionLink
        href="/"
        aria-label="Home"
        className={`bottom-wordmark ${visible ? "visible" : ""}`}
      />
    </>
  );
}
