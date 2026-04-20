"use client";

import { useParams } from "next/navigation";
import { films, getFilmBySlug } from "@/lib/films";
import TransitionLink from "@/components/TransitionLink";

export default function FilmPage() {
  const { slug } = useParams<{ slug: string }>();
  const film = getFilmBySlug(slug);

  if (!film) {
    return (
      <div className="page-container">
        <p>Film not found.</p>
      </div>
    );
  }

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
            <TransitionLink href={`/films/${prevFilm.slug}`} className="film-detail-nav-link">
              <span className="film-detail-nav-arrow">&larr;</span>
              <span>{prevFilm.title}</span>
            </TransitionLink>
            <TransitionLink href="/films" className="film-detail-nav-link film-detail-nav-back">
              All Films
            </TransitionLink>
            <TransitionLink href={`/films/${nextFilm.slug}`} className="film-detail-nav-link">
              <span>{nextFilm.title}</span>
              <span className="film-detail-nav-arrow">&rarr;</span>
            </TransitionLink>
          </div>
        </div>
      </div>
    </div>
  );
}
