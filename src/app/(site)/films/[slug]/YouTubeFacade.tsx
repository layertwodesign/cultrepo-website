"use client";

import Image from "next/image";
import { useState } from "react";

// Width of the player frame at each layout (see .fp-layout / .fp-sidebar).
const PLAYER_SIZES =
  "(max-width: 640px) calc(100vw - 24px), (max-width: 1024px) calc(100vw - 376px), calc(100vw - 466px)";

/**
 * Stand-in for the YouTube embed on direct visits: the film's thumbnail and a
 * play control in the same 16:9 frame. The player (~1 MB of third-party
 * script, plus its own layout shifts) loads only when the visitor presses Play.
 */
export default function YouTubeFacade({ youtubeId, title, onPlay }: {
  youtubeId: string;
  title: string;
  onPlay: () => void;
}) {
  // maxresdefault doesn't exist for every upload; hqdefault always does.
  const [quality, setQuality] = useState<"maxresdefault" | "hqdefault">("maxresdefault");

  return (
    <button type="button" className="fp-yt-facade" onClick={onPlay} aria-label={`Play ${title}`}>
      <Image
        src={`https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`}
        alt=""
        fill
        sizes={PLAYER_SIZES}
        loading="eager"
        fetchPriority="high"
        className="fp-yt-facade-img"
        onError={() => setQuality("hqdefault")}
      />
      <span className="fp-yt-facade-title" aria-hidden="true">{title}</span>
      <span className="fp-yt-facade-play" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10.2-6.5a.5.5 0 0 0 0-.84L8.77 5.08A.5.5 0 0 0 8 5.5z" />
        </svg>
      </span>
    </button>
  );
}
