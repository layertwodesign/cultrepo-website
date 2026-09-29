import type { MetadataRoute } from "next";
import { getFilms } from "@/lib/films";
import { getSiteSettings } from "@/lib/site-settings";
import { getAboutPage } from "@/lib/about";
import { getSponsorshipPage } from "@/lib/sponsorship";
import { isNoIndex } from "@/lib/seo";
import { assetUrl, canonicalUrl, isSiteNoIndex } from "@/lib/site";

// Lists canonical URLs only, and skips anything the page itself marks noindex.
// No lastModified: the CMS data here carries no trustworthy edit dates.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isSiteNoIndex) return [];

  const [films, settings, about, sponsorship] = await Promise.all([
    getFilms(),
    getSiteSettings(),
    getAboutPage(),
    getSponsorshipPage(),
  ]);
  const fallback = settings.defaultSeo;

  const pages: { path: string; noIndex: boolean }[] = [
    { path: "/", noIndex: isNoIndex(settings.homeSeo, fallback) },
    { path: "/films", noIndex: isNoIndex(settings.filmsListingSeo, fallback) },
    { path: "/about", noIndex: isNoIndex(about.seo, fallback) },
    { path: "/sponsorship", noIndex: isNoIndex(sponsorship.seo, fallback) },
  ];

  const entries: MetadataRoute.Sitemap = pages
    .filter((page) => !page.noIndex)
    .map((page) => ({ url: canonicalUrl(page.path) }));

  for (const film of films) {
    if (isNoIndex(film.seo, fallback)) continue;
    entries.push({
      url: canonicalUrl(`/films/${film.slug}`),
      ...(film.poster ? { images: [assetUrl(film.poster)] } : {}),
    });
  }

  return entries;
}
