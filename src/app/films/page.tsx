"use client";

import { films } from "@/lib/films";
import TransitionLink from "@/components/TransitionLink";
import Reveal from "@/components/Reveal";

const STAGGER_MS = 80;
const GRID_COLS = 3;

export default function FilmsPage() {
  return (
    <div className="page-container">
      <div className="films-content">
        <section className="films-header">
          <h1 className="films-title">Films</h1>
        </section>

        <div className="films-grid">
          {films.map((film, i) => {
            const row = Math.floor(i / GRID_COLS);
            const col = i % GRID_COLS;
            const delay = (row + col) * STAGGER_MS;
            return (
              <Reveal key={film.slug} delay={delay}>
                <TransitionLink
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
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
