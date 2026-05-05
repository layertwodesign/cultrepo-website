import type { Metadata } from "next";
import { getFilms } from "@/lib/films";
import { getSiteSettings } from "@/lib/site-settings";
import { buildMetadata } from "@/lib/seo";
import HomePageClient from "./HomePageClient";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata(
    settings.homeSeo,
    settings.defaultSeo,
    {
      title: "CultRepo | Documenting the People Building World-Shaping Tech",
      description:
        "CultRepo documents the people building world-shaping tech. Long-form films about the people behind open source, infrastructure, and emerging systems.",
    },
    "/"
  );
}

export default async function HomePage() {
  const [films, settings] = await Promise.all([getFilms(), getSiteSettings()]);
  return <HomePageClient films={films} featuredSlug={settings.featuredFilmSlug} />;
}
