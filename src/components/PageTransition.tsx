"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
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
  stateRef.current = state;
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
        setState("exiting");
        setTimeout(() => {
          router.push(href);
        }, 500);
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      if (showOverlay) {
        setState("entering");
        window.scrollTo(0, 0);
        setTimeout(() => {
          setState("idle");
        }, 500);
      } else {
        window.scrollTo(0, 0);
        setState("idle");
        setShowOverlay(true);
      }
    }
  }, [pathname, showOverlay]);

  return (
    <TransitionContext.Provider value={{ navigateTo, setFilmRect, consumeFilmRect }}>
      {children}

      {showOverlay && (
        <div className={`page-transition ${state}`} aria-hidden="true">
          <img src="/ghost.png" alt="" className="page-transition-ghost" />
        </div>
      )}
    </TransitionContext.Provider>
  );
}
