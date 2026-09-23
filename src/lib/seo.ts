import type { Metadata } from "next";
import defaultSharingImage from "@/app/opengraph-image.png";

export type SeoFields = {
  title: string | null;
  description: string | null;
  noIndex: boolean | null;
  ogImage: { url: string; width: number | null; height: number | null } | null;
};

export type HygraphSeo = SeoFields | null;

type Defaults = {
  title: string;
  description: string;
  ogImage?: string | null;
};

export function buildMetadata(
  page: HygraphSeo | undefined,
  fallback: HygraphSeo | undefined,
  defaults: Defaults,
  canonical: string,
): Metadata {
  const title = page?.title ?? fallback?.title ?? defaults.title;
  const description =
    page?.description ?? fallback?.description ?? defaults.description;
  const ogUrl =
    page?.ogImage?.url ?? fallback?.ogImage?.url ?? defaults.ogImage ?? defaultSharingImage.src;
  const noIndex = page?.noIndex ?? fallback?.noIndex ?? false;

  // Page metadata replaces the root image metadata, so always supply a fallback.
  // The static import gives the artwork a new URL whenever the file changes.
  const images = [{ url: ogUrl, width: 1200, height: 630, alt: title }];

  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
