"use client";

import dynamic from "next/dynamic";
import { RefObject, useEffect, useRef } from "react";

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

    const onMove = (e: MouseEvent) => dispatch(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
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
};

export default function UnicornBackground({ className = "unicorn-bg" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useForwardPointer(ref);

  return (
    <div ref={ref} className={className} aria-hidden>
      <UnicornScene
        projectId="5jTAQ6ZayBHOM08TLJnb"
        sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.11/dist/unicornStudio.umd.js"
        width="100%"
        height="100%"
        production
      />
    </div>
  );
}
