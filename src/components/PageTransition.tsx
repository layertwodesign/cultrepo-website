"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

type TransitionState = "idle" | "exiting" | "entering";

type FilmTransitionRect = { left: number; top: number; width: number; height: number } | null;

const TransitionContext = createContext<{
  navigateTo: (href: string, opts?: { skipOverlay?: boolean }) => void;
  setFilmRect: (rect: FilmTransitionRect) => void;
  consumeFilmRect: () => FilmTransitionRect;
}>({
  navigateTo: () => {},
  setFilmRect: () => {},
  consumeFilmRect: () => null,
});

export function useTransition() {
  return useContext(TransitionContext);
}

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<TransitionState>("idle");
  const [showOverlay, setShowOverlay] = useState(true);
  const prevPathname = useRef(pathname);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const filmRectRef = useRef<FilmTransitionRect>(null);

  const setFilmRect = useCallback((rect: FilmTransitionRect) => {
    filmRectRef.current = rect;
  }, []);

  const consumeFilmRect = useCallback(() => {
    const rect = filmRectRef.current;
    filmRectRef.current = null;
    return rect;
  }, []);

  const navigateTo = useCallback(
    (href: string, opts?: { skipOverlay?: boolean }) => {
      if (href === pathname || stateRef.current !== "idle") return;

      if (opts?.skipOverlay) {
        setShowOverlay(false);
        router.push(href);
      } else {
        setShowOverlay(true);
        stateRef.current = "exiting";
        setState("exiting");
        setTimeout(() => {
          router.push(href);
        }, 500);
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;
    window.scrollTo(0, 0);

    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      if (showOverlay) {
        setState("entering");
        settleTimer = setTimeout(() => setState("idle"), 500);
      } else {
        setState("idle");
        setShowOverlay(true);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
    };
  }, [pathname, showOverlay]);

  return (
    <TransitionContext.Provider value={{ navigateTo, setFilmRect, consumeFilmRect }}>
      {children}

      {showOverlay && (
        <div className={`page-transition ${state}`} aria-hidden="true">
          <Image width={144} height={144} src="/ghost.png" alt="" className="page-transition-ghost" />
        </div>
      )}
    </TransitionContext.Provider>
  );
}
