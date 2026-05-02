import { notFound } from "next/navigation";
import { getFilmBySlug, getFilms } from "@/lib/films";
import FilmPageClient from "./FilmPageClient";

export default async function FilmPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [film, allFilms] = await Promise.all([
    getFilmBySlug(slug),
    getFilms(),
  ]);
  if (!film) notFound();
  return <FilmPageClient film={film} allFilms={allFilms} />;
}
