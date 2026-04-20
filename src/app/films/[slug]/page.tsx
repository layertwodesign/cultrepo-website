import { notFound } from "next/navigation";
import Link from "next/link";
import { films, getFilmBySlug } from "@/lib/films";
import type { Metadata } from "next";

export function generateStaticParams() {
  return films.map((film) => ({ slug: film.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) return { title: "Film Not Found | CultRepo" };
  return {
    title: `${film.title} | CultRepo`,
    description: film.description,
  };
}

export default async function FilmPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) notFound();

  const currentIndex = films.findIndex((f) => f.slug === slug);
  const nextFilm = films[(currentIndex + 1) % films.length];
  const prevFilm = films[(currentIndex - 1 + films.length) % films.length];

  return (
    <div className="page-container">
      <div className="film-detail">
        {/* Video hero */}
        <div className="film-detail-video-wrap">
          <video
            src={film.video}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            className="film-detail-video"
          />
        </div>

        {/* Info */}
        <div className="film-detail-info">
          <div className="film-detail-header">
            <div>
              <span className="film-detail-status">{film.status}</span>
              <h1 className="film-detail-title">{film.title}</h1>
            </div>
            <span className="film-detail-year">{film.year}</span>
          </div>

          <p className="film-detail-desc">{film.description}</p>

          {/* Nav */}
          <div className="film-detail-nav">
            <Link href={`/films/${prevFilm.slug}`} className="film-detail-nav-link">
              <span className="film-detail-nav-arrow">&larr;</span>
              <span>{prevFilm.title}</span>
            </Link>
            <Link href="/films" className="film-detail-nav-link film-detail-nav-back">
              All Films
            </Link>
            <Link href={`/films/${nextFilm.slug}`} className="film-detail-nav-link">
              <span>{nextFilm.title}</span>
              <span className="film-detail-nav-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
