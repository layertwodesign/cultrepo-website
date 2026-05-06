/**
 * SiteSettings adapter — Hygraph singleton, with hardcoded fallback.
 * Drives global stuff like which film is featured on the homepage,
 * social URLs, and tagline.
 */

import { hygraphFetch, isHygraphConfigured } from "./hygraph/client";
import { SITE_SETTINGS_QUERY } from "./hygraph/queries";
import type { HygraphSeo } from "./seo";

export const SETTINGS_CACHE_TAG = "settings";

export type TickerEntry = { tech: string; name: string };

export type SiteSettings = {
  tagline: string;
  youtubeUrl: string;
  blueskyUrl: string;
  xUrl: string;
  instagramUrl: string;
  newsletterFormAction: string | null;
  featuredFilmSlug: string | null;
  defaultSeo: HygraphSeo;
  homeSeo: HygraphSeo;
  filmsListingSeo: HygraphSeo;
  homepageTicker: TickerEntry[];
};

const local: SiteSettings = {
  tagline: "Independent documentaries about the people behind open source.",
  youtubeUrl: "https://www.youtube.com/@cultrepo?sub_confirmation=1",
  blueskyUrl: "https://bsky.app/profile/cultrepo.bsky.social",
  xUrl: "https://x.com/cultrepo",
  instagramUrl: "https://www.instagram.com/cult.repo",
  newsletterFormAction: null,
  featuredFilmSlug: null,
  defaultSeo: null,
  homeSeo: null,
  filmsListingSeo: null,
  homepageTicker: [],
};

type HygraphSettings = {
  tagline: string | null;
  youtubeUrl: string | null;
  blueskyUrl: string | null;
  xUrl: string | null;
  instagramUrl: string | null;
  newsletterFormAction: string | null;
  featuredFilm: { slug: string } | null;
  defaultSeo: HygraphSeo;
  homeSeo: HygraphSeo;
  filmsListingSeo: HygraphSeo;
  homepageTicker: { name: string; people: string[] }[] | null;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isHygraphConfigured) return local;
  const data = await hygraphFetch<{ siteSettingsItems: HygraphSettings[] }>(
    SITE_SETTINGS_QUERY,
    undefined,
    { tag: SETTINGS_CACHE_TAG }
  );
  const cms = data?.siteSettingsItems?.[0];
  if (!cms) return local;
  return {
    tagline: cms.tagline ?? local.tagline,
    youtubeUrl: cms.youtubeUrl ?? local.youtubeUrl,
    blueskyUrl: cms.blueskyUrl ?? local.blueskyUrl,
    xUrl: cms.xUrl ?? local.xUrl,
    instagramUrl: cms.instagramUrl ?? local.instagramUrl,
    newsletterFormAction: cms.newsletterFormAction,
    featuredFilmSlug: cms.featuredFilm?.slug ?? null,
    defaultSeo: cms.defaultSeo,
    homeSeo: cms.homeSeo,
    filmsListingSeo: cms.filmsListingSeo,
    homepageTicker: flattenTicker(cms.homepageTicker),
  };
}

// Flatten [{name: "Vue.js", people: ["A", "B"]}] -> [{tech, name}, {tech, name}]
// Round-robin across techs so the same tech doesn't appear consecutively.
function flattenTicker(
  groups: { name: string; people: string[] }[] | null
): TickerEntry[] {
  if (!groups?.length) return [];
  const queues = groups.map((g) => ({ tech: g.name, queue: [...(g.people ?? [])] }));
  const out: TickerEntry[] = [];
  let any = true;
  while (any) {
    any = false;
    for (const q of queues) {
      const person = q.queue.shift();
      if (person) {
        out.push({ tech: q.tech, name: person });
        any = true;
      }
    }
  }
  return out;
}
