"use client";

import { films } from "@/lib/films";
import TransitionLink from "@/components/TransitionLink";

export default function FilmsPage() {
  return (
    <div className="page-container">
      <div className="films-content">
        <section className="films-header">
          <p className="about-label">Films</p>
          <h1 className="films-title">The Archive</h1>
        </section>

        <div className="films-grid">
          {films.map((film) => (
            <TransitionLink
              key={film.slug}
              href={`/films/${film.slug}`}
              className="film-card"
            >
              <div className="film-card-video-wrap">
                <video
                  src={film.video}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="film-card-video"
                />
                <div className="film-card-overlay" />
              </div>
              <div className="film-card-info">
                <span className="film-card-title">{film.title}</span>
                <span className="film-card-status">{film.status}</span>
              </div>
            </TransitionLink>
          ))}
        </div>
      </div>
    </div>
  );
}
