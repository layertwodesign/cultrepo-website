import type { Metadata } from "next";
import defaultSharingImage from "@/app/opengraph-image.png";
import { ASSET_ORIGIN, SITE_NAME, assetUrl } from "./site";

// The custom domain still serves the legacy site. Keep the new artwork on
// this project's public production domain until the custom domain is migrated.
const defaultSharingImageUrl = new URL(
  defaultSharingImage.src,
  ASSET_ORIGIN,
).toString();

export type SeoFields = {
  title: string | null;
  description: string | null;
  noIndex: boolean | null;
  ogImage: { url: string; width: number | null; height: number | null } | null;
};

export type HygraphSeo = SeoFields | null;

type SharingImage = { url: string; width?: number; height?: number };

type Defaults = {
  title: string;
  description: string;
  ogImage?: string | null;
  /**
   * The defaults come from the page's own content (a film's title, synopsis
   * and poster), so they beat the site-wide fallback SEO. Otherwise every film
   * without its own SEO entry would share the site default title.
   */
  fromContent?: boolean;
};

/** Mirrors the robots decision in buildMetadata, for the sitemap. */
export function isNoIndex(page: HygraphSeo | undefined, fallback: HygraphSeo | undefined): boolean {
  return page?.noIndex ?? fallback?.noIndex ?? false;
}

export function buildMetadata(
  page: HygraphSeo | undefined,
  fallback: HygraphSeo | undefined,
  defaults: Defaults,
  canonical: string,
): Metadata {
  const own = defaults.fromContent;
  const title =
    page?.title || (own ? defaults.title : fallback?.title) || defaults.title;
  const description =
    page?.description ||
    (own ? defaults.description : fallback?.description) ||
    fallback?.description ||
    defaults.description;
  const cmsImage = (seo: HygraphSeo | undefined): SharingImage | null =>
    seo?.ogImage?.url
      ? { url: seo.ogImage.url, width: seo.ogImage.width ?? undefined, height: seo.ogImage.height ?? undefined }
      : null;
  // Content images (film posters) have their own proportions: leave the size
  // undeclared rather than claim 1200x630.
  const ownImage: SharingImage | null = defaults.ogImage ? { url: assetUrl(defaults.ogImage) } : null;
  const image =
    cmsImage(page) ??
    (own ? ownImage ?? cmsImage(fallback) : cmsImage(fallback) ?? ownImage) ??
    // Page metadata replaces the root image metadata, so always supply a fallback.
    // The static import gives the artwork a new URL whenever the file changes.
    { url: defaultSharingImageUrl, width: 1200, height: 630 };
  const noIndex = isNoIndex(page, fallback);

  const images = [{ ...image, alt: title }];

  return {
    // Titles that already carry the brand skip the root "%s | CultRepo"
    // template, so they don't render as "CultRepo | … | CultRepo".
    title: /cultrepo/i.test(title) ? { absolute: title } : title,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : undefined,
    // openGraph and twitter replace the root objects wholesale (shallow merge),
    // so repeat the site-level fields here.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: "summary_large_image",
      site: "@cultrepo",
      creator: "@cultrepo",
      title,
      description,
      images,
    },
  };
}
