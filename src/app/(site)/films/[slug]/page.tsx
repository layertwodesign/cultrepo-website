import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFilmBySlug, getFilms } from "@/lib/films";
import { getSiteSettings } from "@/lib/site-settings";
import { buildMetadata } from "@/lib/seo";
import { getVideoStats } from "@/lib/youtube";
import FilmPageClient from "./FilmPageClient";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const [film, settings] = await Promise.all([
    getFilmBySlug(slug),
    getSiteSettings(),
  ]);
  if (!film) return {};
  return buildMetadata(
    film.seo ?? null,
    settings.defaultSeo,
    {
      title: film.title,
      description: film.description,
      ogImage: film.poster ?? null,
    },
    `/films/${film.slug}`
  );
}

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
  const stats = await getVideoStats(film.youtubeId);
  return <FilmPageClient film={film} allFilms={allFilms} liveViews={stats?.viewCount ?? null} />;
}
