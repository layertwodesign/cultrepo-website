import { getFilms } from "@/lib/films";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
  const films = await getFilms();
  return <HomePageClient films={films} />;
}
