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

type TransitionType = "fade" | "film-expand";
type TransitionState = "idle" | "exiting" | "entering";
type FilmPhase = "placed" | "expanding" | "done";

type FilmExpandData = {
  rect: DOMRect;
  videoSrc: string;
};

const TransitionContext = createContext<{
  navigateTo: (href: string) => void;
  navigateToFilm: (href: string, el: HTMLElement, videoSrc: string) => void;
}>({
  navigateTo: () => {},
  navigateToFilm: () => {},
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
  const [type, setType] = useState<TransitionType>("fade");
  const [filmData, setFilmData] = useState<FilmExpandData | null>(null);
  const [filmPhase, setFilmPhase] = useState<FilmPhase>("placed");
  const prevPathname = useRef(pathname);
  const filmRef = useRef<HTMLDivElement>(null);

  // Default fade transition
  const navigateTo = useCallback(
    (href: string) => {
      if (href === pathname || state !== "idle") return;
      setType("fade");
      setState("exiting");
      setTimeout(() => {
        router.push(href);
      }, 500);
    },
    [pathname, router, state]
  );

  // Film-expand transition
  const navigateToFilm = useCallback(
    (href: string, el: HTMLElement, videoSrc: string) => {
      if (href === pathname || state !== "idle") return;
      const rect = el.getBoundingClientRect();
      setFilmData({ rect, videoSrc });
      setType("film-expand");
      setFilmPhase("placed");
      setState("exiting");

      // Phase 1: element is placed at the card's position (set above)
      // Phase 2: on next frame, trigger the expansion
      // We need a small delay so the browser paints the initial position first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFilmPhase("expanding");
        });
      });

      // Navigate after expand animation completes
      setTimeout(() => {
        router.push(href);
      }, 750);
    },
    [pathname, router, state]
  );

  // On route change → enter animation
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setState("entering");
      window.scrollTo(0, 0);
      setTimeout(() => {
        setState("idle");
        setFilmData(null);
        setFilmPhase("placed");
        setType("fade");
      }, 500);
    }
  }, [pathname]);

  // Compute film styles based on phase
  let filmStyle: React.CSSProperties = {};
  if (filmData) {
    if (filmPhase === "placed") {
      // Start at the card's exact position
      filmStyle = {
        left: filmData.rect.left,
        top: filmData.rect.top,
        width: filmData.rect.width,
        height: filmData.rect.height,
        borderRadius: 40,
        opacity: 1,
      };
    } else if (filmPhase === "expanding") {
      // Animate to fullscreen
      filmStyle = {
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        opacity: 1,
      };
    }
  }

  const isFilmVisible = type === "film-expand" && filmData && state !== "idle";

  return (
    <TransitionContext.Provider value={{ navigateTo, navigateToFilm }}>
      {children}

      {/* Default fade overlay */}
      {type === "fade" && (
        <div className={`page-transition ${state}`} aria-hidden="true">
          <img src="/ghost.png" alt="" className="page-transition-ghost" />
        </div>
      )}

      {/* Film-expand overlay */}
      {isFilmVisible && (
        <div
          ref={filmRef}
          className={`film-transition ${state === "entering" ? "fade-out" : ""}`}
          aria-hidden="true"
          style={filmStyle}
        >
          <video
            src={filmData.videoSrc}
            muted
            loop
            playsInline
            autoPlay
            className="film-transition-video"
          />
        </div>
      )}
    </TransitionContext.Provider>
  );
}
