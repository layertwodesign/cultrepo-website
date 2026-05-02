/**
 * Films data adapter.
 *
 * Reads from Hygraph when configured (HYGRAPH_API_URL env var set), otherwise
 * falls back to the local hardcoded data in `films-data.ts`. This lets the
 * site keep building during local dev / before the CMS is provisioned, and
 * gives a clean cutover the moment env vars are added in Vercel.
 */

import { hygraphFetch, isHygraphConfigured } from "./hygraph/client";
import {
  ALL_FILMS_QUERY,
  FILM_BY_SLUG_QUERY,
} from "./hygraph/queries";
import { films as localFilms, type Film, type FilmStatus } from "./films-data";

export type { Film, FilmStatus };

// Tag used for on-demand revalidation when Hygraph fires its webhook.
export const FILMS_CACHE_TAG = "films";

type HygraphAsset = { url: string; width?: number; height?: number };

type HygraphFilm = {
  title: string;
  slug: string;
  productionStatus: string;
  description: string;
  synopsis: string;
  year: string | null;
  duration: string | null;
  director: string | null;
  youtubeId: string | null;
  poster: HygraphAsset | null;
  videoClip: HygraphAsset | null;
  stills: HygraphAsset[];
  cast: { name: string; role: string }[];
  crew: { name: string; role: string }[];
  technologies: string[];
  sponsors: { name: string; slug: string }[];
  extras: { title: string; youtubeId: string }[];
  timeline: { label: string; done: boolean }[];
  fundraisingGoal: number | null;
  fundraisingRaised: number | null;
};

const STATUS_MAP: Record<string, FilmStatus> = {
  Released: "Released",
  PostProduction: "Post-Production",
  InProduction: "In Production",
  Filming: "Filming",
  PreProduction: "Pre-Production",
  ComingSoon: "Coming Soon",
  Fundraising: "Fundraising",
};

function fromHygraph(f: HygraphFilm): Film {
  return {
    title: f.title,
    slug: f.slug,
    status: STATUS_MAP[f.productionStatus] ?? "Released",
    description: f.description,
    synopsis: f.synopsis,
    year: f.year ?? "",
    duration: f.duration ?? "",
    director: f.director ?? "",
    youtubeId: f.youtubeId ?? null,
    poster: f.poster?.url ?? null,
    video: f.videoClip?.url ?? "",
    stills: f.stills.map((a) => a.url),
    cast: f.cast,
    crew: f.crew,
    technologies: f.technologies,
    sponsors: f.sponsors.map((s) => ({ name: s.name })),
    extras: f.extras,
    timeline: f.timeline,
    fundraising:
      f.fundraisingGoal != null && f.fundraisingRaised != null
        ? { goal: f.fundraisingGoal, raised: f.fundraisingRaised }
        : null,
  };
}

export async function getFilms(): Promise<Film[]> {
  if (!isHygraphConfigured) return localFilms;

  const data = await hygraphFetch<{ films: HygraphFilm[] }>(
    ALL_FILMS_QUERY,
    undefined,
    { tag: FILMS_CACHE_TAG }
  );
  if (!data?.films?.length) return localFilms;
  return data.films.map(fromHygraph);
}

export async function getFilmBySlug(slug: string): Promise<Film | undefined> {
  if (!isHygraphConfigured) return localFilms.find((f) => f.slug === slug);

  const data = await hygraphFetch<{ film: HygraphFilm | null }>(
    FILM_BY_SLUG_QUERY,
    { slug },
    { tag: `${FILMS_CACHE_TAG}:${slug}` }
  );
  if (!data?.film) return localFilms.find((f) => f.slug === slug);
  return fromHygraph(data.film);
}

export async function getRelatedFilms(
  slug: string,
  count = 3
): Promise<Film[]> {
  const all = await getFilms();
  const film = all.find((f) => f.slug === slug);
  if (!film) return all.slice(0, count);
  const others = all.filter((f) => f.slug !== slug);
  const scored = others.map((f) => ({
    film: f,
    score: f.technologies.filter((t) => film.technologies.includes(t)).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.film);
}
