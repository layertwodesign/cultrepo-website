/**
 * schema.org JSON-LD built only from data the pages already show. Anything
 * the CMS doesn't hold (upload dates, ratings, logos) is left out rather than
 * guessed.
 */

import type { Film } from "./films-data";
import type { SiteSettings } from "./site-settings";
import { filmCredits } from "./film-credits";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  assetUrl,
  canonicalUrl,
} from "./site";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const organizationRef = { "@id": ORGANIZATION_ID };

function profileUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // e.g. the YouTube link carries ?sub_confirmation=1 for the subscribe prompt.
    parsed.search = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Organization + WebSite, for the homepage. */
export function siteJsonLd(settings: Pick<SiteSettings, "youtubeUrl" | "xUrl" | "instagramUrl" | "blueskyUrl">) {
  const sameAs = [settings.youtubeUrl, settings.xUrl, settings.instagramUrl, settings.blueskyUrl]
    .map((url) => (url ? profileUrl(url) : null))
    .filter((url): url is string => Boolean(url));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: "en",
        publisher: organizationRef,
      },
    ],
  };
}

/** "45 min" / "1h 20m" -> ISO 8601 duration; anything else (e.g. "TBA") -> undefined. */
function isoDuration(text: string): string | undefined {
  const hours = Number(text.match(/(\d+)\s*h/i)?.[1] ?? 0);
  const minutes = Number(text.match(/(\d+)\s*m/i)?.[1] ?? 0);
  if (!hours && !minutes) return undefined;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}`;
}

function filmType(film: Film): string {
  // Features, mini-docs and shorts are films; essays and series are not movies.
  if (film.filmType === "Series") return "CreativeWorkSeries";
  if (film.filmType === "Video Essay") return "CreativeWork";
  return "Movie";
}

/** The film itself plus its breadcrumb trail, for /films/[slug]. */
export function filmJsonLd(film: Film) {
  const url = canonicalUrl(`/films/${film.slug}`);
  const released = film.status === "Released";
  const { director, producer } = filmCredits(film);
  const work: Record<string, unknown> = {
    "@type": filmType(film),
    "@id": `${url}#film`,
    name: film.title,
    url,
    genre: "Documentary",
    inLanguage: "en",
    productionCompany: { ...organizationRef, "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
  if (film.description) work.description = film.description;
  if (film.poster) work.image = assetUrl(film.poster);
  if (director) work.director = { "@type": "Person", name: director };
  if (producer) work.producer = { "@type": "Person", name: producer };
  // Unreleased films show a target year and an estimated runtime; only
  // released ones get dates and durations.
  if (released && /^\d{4}$/.test(film.year)) work.datePublished = film.year;
  const duration = released ? isoDuration(film.duration) : undefined;
  if (duration) work.duration = duration;
  if (film.technologies.length) {
    work.about = film.technologies.map((name) => ({ "@type": "Thing", name }));
  }
  if (film.sponsors.length) {
    work.sponsor = film.sponsors.map((s) => ({ "@type": "Organization", name: s.name }));
  }
  if (film.youtubeId) work.sameAs = `https://www.youtube.com/watch?v=${film.youtubeId}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      work,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
          { "@type": "ListItem", position: 2, name: "Films", item: canonicalUrl("/films") },
          { "@type": "ListItem", position: 3, name: film.title, item: url },
        ],
      },
    ],
  };
}

/** Summary list pointing at each film page, for /films. */
export function filmsListJsonLd(films: Pick<Film, "slug" | "title">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: films.map((film, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: canonicalUrl(`/films/${film.slug}`),
      name: film.title,
    })),
  };
}
