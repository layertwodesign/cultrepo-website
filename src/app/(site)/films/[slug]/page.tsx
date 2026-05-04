import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFilmBySlug, getFilms } from "@/lib/films";
import { getVideoStats } from "@/lib/youtube";
import FilmPageClient from "./FilmPageClient";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const film = await getFilmBySlug(slug);
  if (!film) return {};
  const description = film.description;
  const ogImage = film.poster
    ? [{ url: film.poster, width: 1200, height: 630, alt: film.title }]
    : undefined;
  return {
    title: film.title,
    description,
    alternates: { canonical: `/films/${film.slug}` },
    openGraph: {
      type: "video.movie",
      title: `${film.title} — CultRepo`,
      description,
      url: `/films/${film.slug}`,
      ...(ogImage ? { images: ogImage } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${film.title} — CultRepo`,
      description,
      ...(ogImage ? { images: ogImage } : {}),
    },
  };
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
