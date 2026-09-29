"use client";

import dynamic from "next/dynamic";
import { RefObject, useEffect, useRef, useState } from "react";

const UnicornScene = dynamic(() => import("unicornstudio-react/next"), {
  ssr: false,
});

// The wrapper has pointer-events: none so clicks pass through to UI.
// Forward window mousemove + touchmove events to the canvas + container so
// the scene still tracks cursor position no matter what the cursor is over.
export function useForwardPointer(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const dispatch = (clientX: number, clientY: number) => {
      const targets: EventTarget[] = [container];
      const canvas = container.querySelector("canvas");
      if (canvas) targets.push(canvas);
      for (const t of targets) {
        t.dispatchEvent(
          new MouseEvent("mousemove", { clientX, clientY, bubbles: true })
        );
      }
    };

    // Ignore our own synthetic events to prevent infinite re-dispatch loops
    // (synthetic events with bubbles:true bubble back up to the window listener).
    const onMove = (e: MouseEvent) => {
      if (!e.isTrusted) return;
      dispatch(e.clientX, e.clientY);
    };
    const onTouch = (e: TouchEvent) => {
      if (!e.isTrusted) return;
      const touch = e.touches[0];
      if (touch) dispatch(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [ref]);
}

type Props = {
  className?: string;
  paused?: boolean;
};

export default function UnicornBackground({ className = "unicorn-bg", paused = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(className === "menu-unicorn");
  useForwardPointer(ref);

  // The scene reacts to the pointer. Initialise on the first interaction,
  // keeping decorative GPU work and its SDK off the initial content path.
  // Menu scenes mount on explicit intent and are ready immediately.
  useEffect(() => {
    if (ready) return;
    const start = () => setReady(true);
    const events = ["pointermove", "pointerdown", "keydown", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, start, { once: true, passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, start));
  }, [ready]);

  return (
    <div ref={ref} className={className} aria-hidden>
      {ready && <UnicornScene
        projectId="5jTAQ6ZayBHOM08TLJnb"
        sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.11/dist/unicornStudio.umd.js"
        width="100%"
        height="100%"
        production
        paused={paused}
      />}
    </div>
  );
}
