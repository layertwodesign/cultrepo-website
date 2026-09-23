"use client";

import Image from "next/image";
import { useState, type ComponentPropsWithRef } from "react";

type Props = Omit<ComponentPropsWithRef<"video">, "src" | "poster"> & {
  src: string;
  poster?: string | null;
  title: string;
};

/** Keep missing or unavailable clips from becoming broken media players. */
export default function FilmPreview({ src, poster, title, className, ref, onError, ...props }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [failedPoster, setFailedPoster] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <video
        {...props}
        ref={ref}
        src={src}
        poster={poster || undefined}
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
