/**
 * AboutPage adapter — Hygraph singleton, with hardcoded fallback.
 */

import { hygraphFetch, isHygraphConfigured } from "./hygraph/client";
import { ABOUT_PAGE_QUERY } from "./hygraph/queries";

export type AboutStat = {
  value: number;
  suffix: string;
  decimals: number;
  label: string;
  channel: "YouTube" | "Instagram" | "X" | "Bluesky";
};

export type AboutPageData = {
  heroTitle: string;
  heroSubtitle: string;
  story: string;
  ctaTitle: string;
  ctaSubtitle: string;
  backstageImage: string | null;
  stats: AboutStat[];
  trustedBySponsors: { name: string; slug: string; logo: string | null }[];
};

export const ABOUT_CACHE_TAG = "about";

const localAbout: AboutPageData = {
  heroTitle: "Films about the people behind the systems we use every day.",
  heroSubtitle:
    "Feature-length documentaries, shorts, and video essays. A repository of the canonical stories of technology.",
  story: `Founded in 2018, Cult.Repo is an independent media company making cinematic documentaries about the people who build technology, with a special focus on open source software.

What started as a single YouTube channel has grown into a small studio of filmmakers committed to the idea that technology has a human story worth telling.`,
  ctaTitle: "Sponsor a film.",
  ctaSubtitle: "Reach builders, engineers, and technical leaders.",
  backstageImage: "/about/backstage-1.jpg",
  stats: [
    { value: 370, suffix: "K", decimals: 0, label: "YouTube Subscribers", channel: "YouTube" },
    { value: 20, suffix: "M", decimals: 0, label: "YouTube Views", channel: "YouTube" },
  ],
  trustedBySponsors: [
    { name: "IBM", slug: "ibm", logo: null },
    { name: "Red Hat", slug: "red-hat", logo: null },
    { name: "Google", slug: "google", logo: null },
    { name: "JetBrains", slug: "jetbrains", logo: null },
    { name: "Shopify", slug: "shopify", logo: null },
  ],
};

type HygraphAboutPage = {
  heroTitle: string | null;
  heroSubtitle: string | null;
  story: string | null;
  ctaTitle: string | null;
  ctaSubtitle: string | null;
  backstageImage: { url: string } | null;
  stats: AboutStat[];
  trustedBySponsors: {
    name: string;
    slug: string;
    logo: { url: string } | null;
  }[];
};

export async function getAboutPage(): Promise<AboutPageData> {
  if (!isHygraphConfigured) return localAbout;

  const data = await hygraphFetch<{ aboutPages: HygraphAboutPage[] }>(
    ABOUT_PAGE_QUERY,
    undefined,
    { tag: ABOUT_CACHE_TAG }
  );
  const cms = data?.aboutPages?.[0];
  if (!cms) return localAbout;

  return {
    heroTitle: cms.heroTitle ?? localAbout.heroTitle,
    heroSubtitle: cms.heroSubtitle ?? localAbout.heroSubtitle,
    story: cms.story ?? localAbout.story,
    ctaTitle: cms.ctaTitle ?? localAbout.ctaTitle,
    ctaSubtitle: cms.ctaSubtitle ?? localAbout.ctaSubtitle,
    backstageImage: cms.backstageImage?.url ?? localAbout.backstageImage,
    stats: cms.stats?.length ? cms.stats : localAbout.stats,
    trustedBySponsors: cms.trustedBySponsors?.length
      ? cms.trustedBySponsors.map((s) => ({
          name: s.name,
          slug: s.slug,
          logo: s.logo?.url ?? null,
        }))
      : localAbout.trustedBySponsors,
  };
}
