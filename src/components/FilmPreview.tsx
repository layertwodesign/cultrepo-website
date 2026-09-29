"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithRef } from "react";
import { hygraphImage } from "@/lib/image";

type Props = Omit<ComponentPropsWithRef<"video">, "src" | "poster"> & {
  src: string;
  poster?: string | null;
  title: string;
  /** Width requested for the poster frame; Hygraph posters are served resized as WebP. */
  posterWidth?: number;
  /**
   * Attach the clip and poster only once the preview comes near the screen,
   * and play it only while it's on screen. Sources are kept after that, so
   * scrolling back is instant.
   */
  lazy?: boolean;
  /**
   * Parent-controlled alternative to `lazy`, for layouts an observer can't
   * judge (the homepage carousel hides and moves its cards itself). Sources
   * attach once this is true; the parent must never set it back to false.
   */
  active?: boolean;
  /** Attach the poster from the server HTML even while the clip waits: for the first visible cards (LCP). */
  priority?: boolean;
};

/** Keep missing or unavailable clips from becoming broken media players. */
export default function FilmPreview({ src, poster, title, className, ref, onError, posterWidth = 1280, lazy = false, active, priority = false, autoPlay, preload, ...props }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [failedPoster, setFailedPoster] = useState<string | null>(null);
  // Latches true the first time a lazy preview comes near the screen.
  const [seen, setSeen] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const inViewRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loaded = active ?? (!lazy || (seen && pageReady));

  // Let the initial posters, fonts and document finish before autoplay clips
  // compete for bandwidth. Posters are visible while their videos prepare.
  useEffect(() => {
    if (!lazy) return;
    let frame = 0;
    const ready = () => { frame = requestAnimationFrame(() => setPageReady(true)); };
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready, { once: true });
    return () => {
      window.removeEventListener("load", ready);
      cancelAnimationFrame(frame);
    };
  }, [lazy]);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  useEffect(() => {
    const video = videoRef.current;
    if (!lazy || !video) return;
    const sync = (visible: boolean) => {
      inViewRef.current = visible;
      // Before the clip is attached there's nothing to play; the effect
      // below starts it once the source lands.
      if (!autoPlay || !video.hasAttribute("src")) return;
      if (visible) video.play().catch(() => {});
      else video.pause();
    };
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => { setSeen(true); sync(true); });
      return () => cancelAnimationFrame(frame);
    }
    const preloadObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSeen(true); },
      { rootMargin: "300px 0px" }
    );
    const visibleObserver = new IntersectionObserver(
      ([entry]) => sync(entry.isIntersecting),
      { threshold: 0.01 }
    );
    preloadObserver.observe(video);
    visibleObserver.observe(video);
    return () => { preloadObserver.disconnect(); visibleObserver.disconnect(); };
  }, [lazy, autoPlay, src, failedSrc]);

  // A lazy clip just got its source while on screen: start it.
  useEffect(() => {
    const video = videoRef.current;
    if (!lazy || !loaded || !autoPlay || !video || !inViewRef.current) return;
    video.play().catch(() => {});
  }, [lazy, loaded, autoPlay]);

  if (src && failedSrc !== src) {
    // Until it's loaded the element has no src/poster at all: an empty frame
    // over the card background (pending), never the failure placeholder.
    return (
      <video
        {...props}
        ref={setVideoRef}
        src={loaded ? src : undefined}
        poster={loaded || priority || seen ? hygraphImage(poster, posterWidth) : undefined}
        autoPlay={lazy ? undefined : autoPlay}
        preload={loaded ? preload : "none"}
        className={className}
        onError={(event) => {
          setFailedSrc(src);
          onError?.(event);
        }}
      />
    );
  }

  if (poster && failedPoster !== poster) {
    return (
      <Image
        src={poster}
        alt={`${title} poster`}
        width={1280}
        height={720}
        sizes="(max-width: 768px) 100vw, 60vw"
        className={className}
        style={{ objectFit: "contain" }}
        preload={priority}
        onError={() => setFailedPoster(poster)}
      />
    );
  }

  return (
    <div
      className={className}
      role="img"
      aria-label={`${title}: preview unavailable`}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#282C26", color: "#ADB0A0", fontFamily: "var(--font-mono), monospace", textTransform: "uppercase" }}
    >
      <span>{title}</span>
    </div>
  );
}
