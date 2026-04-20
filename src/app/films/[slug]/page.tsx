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
    <div className="film-page">
      {/* Full-screen video hero */}
      <section className="film-hero">
        {film.youtubeId ? (
          <iframe
            className="film-hero-iframe"
            src={`https://www.youtube.com/embed/${film.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={film.title}
          />
        ) : (
          <video
            src={film.video}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            className="film-hero-video"
          />
        )}
        {/* Gradient fade at bottom */}
        <div className="film-hero-fade" />
        {/* Title overlay */}
        <div className="film-hero-overlay">
          <span className="film-hero-status">{film.status}</span>
          <h1 className="film-hero-title">{film.title}</h1>
          <p className="film-hero-tagline">{film.description}</p>
          <div className="film-hero-scroll-hint">
            <span>Scroll to explore</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Scrollable content below */}
      <section className="film-content">
        {/* Synopsis */}
        <div className="film-section">
          <div className="film-section-grid">
            <div className="film-section-sidebar">
              <h2 className="film-section-label">Synopsis</h2>
              <div className="film-meta">
                <div className="film-meta-item">
                  <span className="film-meta-key">Year</span>
                  <span className="film-meta-val">{film.year}</span>
                </div>
                <div className="film-meta-item">
                  <span className="film-meta-key">Runtime</span>
                  <span className="film-meta-val">{film.duration}</span>
                </div>
                <div className="film-meta-item">
                  <span className="film-meta-key">Director</span>
                  <span className="film-meta-val">{film.director}</span>
                </div>
              </div>
            </div>
            <div className="film-section-body">
              <p className="film-synopsis">{film.synopsis}</p>
            </div>
          </div>
        </div>

        {/* Stills */}
        <div className="film-section">
          <h2 className="film-section-label">Stills</h2>
          <div className="film-stills">
            <div className="film-still">
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" className="film-still-media" />
            </div>
            <div className="film-still">
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" className="film-still-media" style={{ objectPosition: "center 30%" }} />
            </div>
            <div className="film-still">
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" className="film-still-media" style={{ objectPosition: "center 70%" }} />
            </div>
          </div>
        </div>

        {/* Cast */}
        <div className="film-section">
          <h2 className="film-section-label">Featuring</h2>
          <div className="film-cast">
            {film.cast.map((name) => (
              <div key={name} className="film-cast-member">
                <div className="film-cast-avatar">
                  {name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="film-cast-name">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div className="film-section film-bottom-nav">
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
      </section>
    </div>
  );
}
