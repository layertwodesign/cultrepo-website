import type { Film } from "./films-data";

/**
 * Homepage carousel order. Films arrive pre-sorted by their `order` field
 * (same as the films grid); only the featured film is pinned to the front.
 * Shared so the server can preload the first card's poster.
 */
export function carouselOrder<T extends Pick<Film, "slug">>(films: T[], featuredSlug?: string | null): T[] {
  const ordered = [...films];
  if (featuredSlug) {
    const idx = ordered.findIndex((f) => f.slug === featuredSlug);
    if (idx > 0) {
      const [featured] = ordered.splice(idx, 1);
      ordered.unshift(featured);
    }
  }
  return ordered;
}

/** Poster width requested for carousel cards (the centred card is ~1000 CSS px wide at most). */
export const CAROUSEL_POSTER_WIDTH = 960;
