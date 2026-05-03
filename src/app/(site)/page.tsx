import { getFilms } from "@/lib/films";
import { getSiteSettings } from "@/lib/site-settings";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
  const [films, settings] = await Promise.all([getFilms(), getSiteSettings()]);
  return <HomePageClient films={films} featuredSlug={settings.featuredFilmSlug} />;
}
