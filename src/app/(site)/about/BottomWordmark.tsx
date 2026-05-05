"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/components/TransitionLink";

export default function BottomWordmark() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      setVisible(atBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <TransitionLink
      href="/"
      aria-label="Home"
      className={`bottom-wordmark ${visible ? "visible" : ""}`}
    />
  );
}
