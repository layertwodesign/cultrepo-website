import type { Metadata } from "next";
import { preconnect, preload } from "react-dom";
import { getFilms } from "@/lib/films";
import { CAROUSEL_POSTER_WIDTH, carouselOrder } from "@/lib/carousel";
import { videoPoster } from "@/lib/image";
import { getSiteSettings } from "@/lib/site-settings";
import { buildMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import { siteJsonLd } from "@/lib/structured-data";
import JsonLd from "@/components/JsonLd";
import HomePageClient from "./HomePageClient";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata(
    settings.homeSeo,
    settings.defaultSeo,
    {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    "/"
  );
}

export default async function HomePage() {
  const [films, settings] = await Promise.all([getFilms(), getSiteSettings()]);
  // The intro waits on the first carousel clips, which live on the CMS asset
  // host: open that connection while the HTML is still streaming.
  const clipOrigin = films.find((f) => /^https:\/\//.test(f.video))?.video;
  if (clipOrigin) preconnect(new URL(clipOrigin).origin);
  // The landing card's poster is the page's LCP: fetch it from <head> at high
  // priority. Same URL as the card's <video poster>, so it's one request.
  const first = carouselOrder(films, settings.featuredFilmSlug)[0];
  const firstPoster = first?.video ? videoPoster(first.poster, CAROUSEL_POSTER_WIDTH) : undefined;
  if (firstPoster) preload(firstPoster, { as: "image", fetchPriority: "high" });
  return (
    <>
      <JsonLd data={siteJsonLd(settings)} />
      <HomePageClient
        films={films}
        featuredSlug={settings.featuredFilmSlug}
        ticker={settings.homepageTicker}
      />
    </>
  );
}
