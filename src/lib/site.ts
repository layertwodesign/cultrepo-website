/**
 * Site-wide identity shared by metadata, robots, sitemap and structured data.
 */

// Canonical production origin.
export const SITE_URL = "https://www.cultrepo.com";

// Local sharing images and posters are served from the production domain.
export const ASSET_ORIGIN = SITE_URL;

export const SITE_NAME = "CultRepo";
export const SITE_TITLE =
  "CultRepo | Documenting the People Building World-Shaping Tech";
export const SITE_DESCRIPTION =
  "CultRepo documents the people building world-shaping tech. Long-form films about the people behind open source, infrastructure, and emerging systems.";

// Staging copies set SITE_NOINDEX=1 so review links stay out of search results.
export const isSiteNoIndex = process.env.SITE_NOINDEX === "1";

/** Absolute canonical URL for a site path, e.g. "/films" -> https://www.cultrepo.com/films */
export function canonicalUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** Absolute URL for an asset: remote URLs pass through, local paths use ASSET_ORIGIN. */
export function assetUrl(src: string): string {
  return new URL(src, ASSET_ORIGIN).toString();
}

/** Serialise JSON-LD for a <script> tag without letting content close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
