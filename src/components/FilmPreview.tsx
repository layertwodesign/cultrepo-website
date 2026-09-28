"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentPropsWithRef } from "react";
import { hygraphImage } from "@/lib/image";

type Props = Omit<ComponentPropsWithRef<"video">, "src" | "poster"> & {
  src: string;
  poster?: string | null;
  title: string;
  /** Width requested for the poster frame; Hygraph posters are served resized as WebP. */
  posterWidth?: number;
  /** Load and play only while the preview is on (or near) the screen. */
  lazy?: boolean;
};

/** Keep missing or unavailable clips from becoming broken media players. */
export default function FilmPreview({ src, poster, title, className, ref, onError, posterWidth = 1280, lazy = false, autoPlay, preload, ...props }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [failedPoster, setFailedPoster] = useState<string | null>(null);
  const [near, setNear] = useState(!lazy);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!lazy || !video) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => {
        setNear(true);
        if (autoPlay) video.play().catch(() => {});
      });
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setNear(entry.isIntersecting);
        if (!autoPlay) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [lazy, autoPlay, src, failedSrc]);

  if (src && failedSrc !== src) {
    return (
      <video
        {...props}
        ref={(el) => {
          videoRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        src={src}
        poster={hygraphImage(poster, posterWidth)}
        autoPlay={lazy ? undefined : autoPlay}
        preload={near ? preload : "none"}
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
