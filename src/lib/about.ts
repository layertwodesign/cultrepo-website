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
  backstageImage: string | null;
  stats: AboutStat[];
  trustedBySponsors: { name: string; slug: string; logo: string | null }[];
};

export const ABOUT_CACHE_TAG = "about";

const localAbout: AboutPageData = {
  heroTitle: "Films about the humans behind the systems we use every day.",
  heroSubtitle:
    "Independent. Long-form. Made with the people who built the things, not about them.",
  story: `Founded in 2018 as Honeypot, Cult.Repo is an independent media platform telling the human stories behind technology — with a particular focus on the people who build and maintain open source.

What started as a single YouTube channel has grown into a small studio of filmmakers chasing the stories that don't fit into a blog post or a release note.`,
  backstageImage: "/about/backstage-1.jpg",
  stats: [
    { value: 250, suffix: "K", decimals: 0, label: "YouTube Subscribers", channel: "YouTube" },
    { value: 15, suffix: "M", decimals: 0, label: "YouTube Views", channel: "YouTube" },
    { value: 5, suffix: "K", decimals: 0, label: "Instagram Followers", channel: "Instagram" },
    { value: 12.5, suffix: "K", decimals: 1, label: "X Followers", channel: "X" },
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
