import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getFilmBySlug, getFilms } from "@/lib/films";
import { getSiteSettings } from "@/lib/site-settings";
import { buildMetadata } from "@/lib/seo";
import { getVideoStats } from "@/lib/youtube";
import FilmPageClient from "./FilmPageClient";

// Cache only the stats: YouTube HTML can exceed Next's 2 MB cache limit.
const getCachedVideoStats = unstable_cache(
  async (youtubeId: string) => {
    const stats = await getVideoStats(youtubeId);
    // Failed refreshes must not replace a previously valid count with null.
    if (!stats) throw new Error("YouTube statistics temporarily unavailable");
    return stats;
  },
  ["youtube-video-stats"],
  { revalidate: 60 * 60, tags: ["youtube-stats"] }
);

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
  const stats = film.youtubeId
    ? await getCachedVideoStats(film.youtubeId).catch(() => null)
    : null;
  return <FilmPageClient film={film} allFilms={allFilms} liveViews={stats?.viewCount ?? null} />;
}
