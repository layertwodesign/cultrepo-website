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
  const prevPathname = useRef(pathname);

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

  // Film-expand transition: capture element rect, expand to fullscreen, then navigate
  const navigateToFilm = useCallback(
    (href: string, el: HTMLElement, videoSrc: string) => {
      if (href === pathname || state !== "idle") return;
      const rect = el.getBoundingClientRect();
      setFilmData({ rect, videoSrc });
      setType("film-expand");
      setState("exiting");

      // Navigate after expand animation
      setTimeout(() => {
        router.push(href);
      }, 700);
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
        setType("fade");
      }, 500);
    }
  }, [pathname]);

  // Compute film-expand inline styles
  const filmStyle: React.CSSProperties | undefined =
    filmData && state === "exiting"
      ? {
          position: "fixed",
          left: filmData.rect.left,
          top: filmData.rect.top,
          width: filmData.rect.width,
          height: filmData.rect.height,
          borderRadius: "40px",
        }
      : filmData && state === "entering"
        ? {
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            borderRadius: "0px",
          }
        : undefined;

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
      {type === "film-expand" && filmData && (
        <div
          className={`film-transition ${state}`}
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
