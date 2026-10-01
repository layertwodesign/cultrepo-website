"use client";

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithRef } from "react";
import { previewThumbnail, videoPoster } from "@/lib/image";
import blackRanges from "@/lib/preview-black-ranges.json";

type Props = Omit<ComponentPropsWithRef<"video">, "src" | "poster"> & {
  src: string;
  poster?: string | null;
  title: string;
  posterWidth?: number;
  /** Prepare nearby clips; only play videos actually on screen. */
  lazy?: boolean;
  /** Carousel-controlled source attachment, latched by the parent. */
  active?: boolean;
  priority?: boolean;
};

/** An image remains in front until the browser has presented a video frame. */
export default function FilmPreview({ src, poster, title, className, ref, onError, posterWidth = 1280, lazy = false, active, priority = false, autoPlay, preload, ...props }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [failedPoster, setFailedPoster] = useState<string | null>(null);
  const [readyPoster, setReadyPoster] = useState<string | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [seen, setSeen] = useState(false);
  const inViewRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const loaded = active ?? (!lazy || seen);
  const imageSrc = videoPoster(poster, posterWidth);
  const thumbnail = previewThumbnail(poster);
  const attachPoster = priority || loaded || seen;
  const failed = !src || failedSrc === src;

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  // Observe independently from the video: loading must start BEFORE visibility.
  useEffect(() => {
    const video = videoRef.current;
    if (!lazy || !video) return;
    const sync = (visible: boolean) => {
      inViewRef.current = visible;
      if (!autoPlay || !video.hasAttribute("src")) return;
      if (visible) video.play().catch(() => {});
      else video.pause();
    };
    const preloadObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSeen(true); },
      { rootMargin: "900px 0px" }
    );
    const visibleObserver = new IntersectionObserver(
      ([entry]) => sync(entry.isIntersecting), { threshold: 0.01 }
    );
    preloadObserver.observe(video);
    visibleObserver.observe(video);
    return () => { preloadObserver.disconnect(); visibleObserver.disconnect(); };
  }, [lazy, autoPlay, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!lazy || !loaded || !autoPlay || !video || !inViewRef.current) return;
    video.play().catch(() => {});
  }, [lazy, loaded, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const cancelFrame = () => {
      if (frameRef.current !== null) video.cancelVideoFrameCallback?.(frameRef.current);
      frameRef.current = null;
    };
    const ranges = (blackRanges as Record<string, number[][]>)[src] ?? [];
    const start = ranges.find(([from]) => from === 0)?.[1];
    const safeStart = start === undefined ? 0 : start + 0.12;
    const skipBlack = () => {
      const range = ranges.find(([from, to]) => video.currentTime >= from && video.currentTime < to + 0.08);
      if (range && video.readyState >= 1) video.currentTime = range[1] + 0.12;
    };
    const reset = () => { cancelFrame(); setFrameReady(false); };
    const metadata = () => {
      // Several source clips contain seconds of encoded black at the start.
      // Seek while the poster still covers the player, including on HD swaps.
      if (safeStart && video.currentTime < safeStart) video.currentTime = safeStart;
    };
    const presented = () => {
      cancelFrame();
      if (video.requestVideoFrameCallback) {
        const checkFrame: VideoFrameRequestCallback = (_now, frame) => {
          const black = ranges.some(([from, to]) => frame.mediaTime >= from && frame.mediaTime < to + 0.08);
          setFrameReady(video.readyState >= 2 && !black);
          if (black) skipBlack();
          // Keep guarding loops and source edits with encoded black ranges.
          if (ranges.length) frameRef.current = video.requestVideoFrameCallback(checkFrame);
          else frameRef.current = null;
        };
        frameRef.current = video.requestVideoFrameCallback(checkFrame);
      } else if (video.readyState >= 2 && video.currentTime > 0) {
        skipBlack();
        setFrameReady(video.currentTime >= safeStart);
      }
    };
    // Also catches the carousel's in-place 720p -> HD source swap.
    video.addEventListener("loadedmetadata", metadata);
    video.addEventListener("emptied", reset);
    video.addEventListener("loadstart", reset);
    video.addEventListener("playing", presented);
    const timeUpdate = () => {
      // Restart before the native loop can show the black opening again.
      if (safeStart && props.loop && video.duration - video.currentTime < 0.25) video.currentTime = safeStart;
      if (!video.requestVideoFrameCallback && video.readyState >= 2 && video.currentTime > 0) {
        const black = ranges.some(([from, to]) => video.currentTime >= from && video.currentTime < to + 0.08);
        setFrameReady(!black);
        if (black) skipBlack();
      }
    };
    video.addEventListener("timeupdate", timeUpdate);
    if (video.readyState >= 1) metadata();
    if (!video.paused && video.readyState >= 2) presented();
    return () => {
      cancelFrame();
      video.removeEventListener("loadedmetadata", metadata);
      video.removeEventListener("emptied", reset);
      video.removeEventListener("loadstart", reset);
      video.removeEventListener("playing", presented);
      video.removeEventListener("timeupdate", timeUpdate);
    };
  }, [src, props.loop]);

  return (
    <div className={`film-preview ${className ?? ""}`} data-frame-ready={frameReady && !failed} data-preview-loaded={loaded}>
      <video
        {...props}
        ref={setVideoRef}
        src={loaded && !failed ? src : undefined}
        poster={thumbnail ?? imageSrc}
        autoPlay={lazy ? undefined : autoPlay}
        preload={loaded ? (preload ?? "auto") : "none"}
        className="film-preview-video"
        aria-label={`${title} preview`}
        onError={(event) => { setFailedSrc(src); setFrameReady(false); onError?.(event); }}
      />
      <div className="film-preview-cover" aria-hidden="true">
        {thumbnail ? <div className="film-preview-blur" style={{ backgroundImage: `url("${thumbnail}")` }} /> : <span className="film-preview-title">{title}</span>}
        {imageSrc && attachPoster && failedPoster !== imageSrc && (
          // Native image deliberately shares the server-preloaded URL. The
          // embedded thumbnail below it needs no network or image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="" className="film-preview-poster" loading="eager" decoding="async" fetchPriority={priority ? "high" : "auto"}
            ref={(image) => { if (image?.complete && image.naturalWidth > 0) setReadyPoster(imageSrc); }}
            style={{ opacity: readyPoster === imageSrc ? 1 : 0 }}
            onLoad={() => setReadyPoster(imageSrc)} onError={() => setFailedPoster(imageSrc)} />
        )}
        {loaded && !failed && !frameReady && <span className="film-preview-spinner" />}
      </div>
    </div>
  );
}
