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
import { sitePath } from "@/lib/site-path";

type TransitionState = "idle" | "exiting" | "entering";

type FilmTransitionRect = { left: number; top: number; width: number; height: number } | null;

const TransitionContext = createContext<{
  navigateTo: (href: string, opts?: { skipOverlay?: boolean }) => void;
  setFilmRect: (rect: FilmTransitionRect) => void;
  consumeFilmRect: () => FilmTransitionRect;
  /** Whether a carousel handoff is waiting for the film page (without consuming it). */
  hasFilmRect: () => boolean;
  /** A film deliberately opened through the site's navigation, not a cold visit. */
  shouldAutoplayFilm: (slug: string) => boolean;
  clearFilmAutoplay: (slug: string) => void;
}>({
  navigateTo: () => {},
  setFilmRect: () => {},
  consumeFilmRect: () => null,
  hasFilmRect: () => false,
  shouldAutoplayFilm: () => false,
  clearFilmAutoplay: () => {},
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
  const pathname = sitePath(usePathname());
  const [state, setState] = useState<TransitionState>("idle");
  const [showOverlay, setShowOverlay] = useState(true);
  const prevPathname = useRef(pathname);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const filmRectRef = useRef<FilmTransitionRect>(null);
  const filmNavigationRef = useRef<string | null>(null);
  const shouldAutoplayFilm = useCallback(
    (slug: string) => filmNavigationRef.current === `/films/${slug}`,
    []
  );
  const clearFilmAutoplay = useCallback((slug: string) => {
    if (filmNavigationRef.current === `/films/${slug}`) filmNavigationRef.current = null;
  }, []);

  const setFilmRect = useCallback((rect: FilmTransitionRect) => {
    filmRectRef.current = rect;
  }, []);

  const consumeFilmRect = useCallback(() => {
    const rect = filmRectRef.current;
    filmRectRef.current = null;
    return rect;
  }, []);

  const hasFilmRect = useCallback(() => filmRectRef.current !== null, []);

  const navigateTo = useCallback(
    (href: string, opts?: { skipOverlay?: boolean }) => {
      if (href === pathname || stateRef.current !== "idle") return;
      filmNavigationRef.current = href.startsWith("/films/") ? href : null;

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
    // Keep the intent until the film mounts: its server component can still
    // be streaming after the layout has already changed pathname.
    if (filmNavigationRef.current !== pathname) filmNavigationRef.current = null;
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
    <TransitionContext.Provider value={{ navigateTo, setFilmRect, consumeFilmRect, hasFilmRect, shouldAutoplayFilm, clearFilmAutoplay }}>
      {children}

      {showOverlay && (
        <div className={`page-transition ${state}`} aria-hidden="true">
          <Image width={144} height={144} src="/ghost.png" alt="" className="page-transition-ghost" />
        </div>
      )}
    </TransitionContext.Provider>
  );
}
