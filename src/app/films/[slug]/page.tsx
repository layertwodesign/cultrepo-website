"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { films, getFilmBySlug } from "@/lib/films";
import TransitionLink from "@/components/TransitionLink";
import { useNavVisibility } from "@/components/NavVisibility";
import { useTransition } from "@/components/PageTransition";

export default function FilmPage() {
  const { slug } = useParams<{ slug: string }>();
  const film = getFilmBySlug(slug);
  const { setHidden } = useNavVisibility();
  const { navigateTo } = useTransition();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Hide nav on mount, show on scroll past hero
  useEffect(() => {
    setHidden(true);

    const onScroll = () => {
      const threshold = window.innerHeight * 0.7;
      setScrolled(window.scrollY > threshold);
      setHidden(window.scrollY <= threshold);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setHidden(false);
    };
  }, [setHidden]);

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
      {/* Full-screen immersive video */}
      <section className="film-hero film-hero-immersive" ref={heroRef}>
        {film.youtubeId ? (
          <iframe
            className="film-hero-iframe"
            src={`https://www.youtube.com/embed/${film.youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white&iv_load_policy=3`}
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

        {/* X close button — top right */}
        <button
          className={`film-close ${scrolled ? "film-close-hidden" : ""}`}
          onClick={() => navigateTo("/")}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Subtle scroll indicator at very bottom */}
        <div className={`film-scroll-indicator ${scrolled ? "film-scroll-hidden" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M5 11l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* Editorial content below */}
      <section className="film-editorial">
        {/* Title block */}
        <div className="film-ed-title-block">
          <span className="film-ed-status">{film.status}</span>
          <h1 className="film-ed-title">{film.title}</h1>
          <p className="film-ed-tagline">{film.description}</p>
        </div>

        {/* Meta strip */}
        <div className="film-ed-meta-strip">
          <div className="film-ed-meta">
            <span className="film-ed-meta-key">Director</span>
            <span className="film-ed-meta-val">{film.director}</span>
          </div>
          <div className="film-ed-meta">
            <span className="film-ed-meta-key">Year</span>
            <span className="film-ed-meta-val">{film.year}</span>
          </div>
          <div className="film-ed-meta">
            <span className="film-ed-meta-key">Runtime</span>
            <span className="film-ed-meta-val">{film.duration}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="film-ed-divider" />

        {/* Synopsis */}
        <div className="film-ed-synopsis">
          <p>{film.synopsis}</p>
        </div>

        {/* Stills — editorial layout with varied aspect ratios */}
        <div className="film-ed-stills">
          <div className="film-ed-still film-ed-still-wide">
            <video src={film.video} muted loop playsInline autoPlay preload="metadata" />
          </div>
          <div className="film-ed-still-row">
            <div className="film-ed-still film-ed-still-portrait">
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" style={{ objectPosition: "center 20%" }} />
            </div>
            <div className="film-ed-still film-ed-still-square">
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" style={{ objectPosition: "center 80%" }} />
            </div>
          </div>
          <div className="film-ed-still film-ed-still-cinematic">
            <video src={film.video} muted loop playsInline autoPlay preload="metadata" style={{ objectPosition: "center 50%" }} />
          </div>
        </div>

        {/* Divider */}
        <div className="film-ed-divider" />

        {/* Featuring */}
        <div className="film-ed-cast-section">
          <h2 className="film-ed-section-label">Featuring</h2>
          <div className="film-ed-cast">
            {film.cast.map((name) => (
              <div key={name} className="film-ed-cast-member">
                <div className="film-ed-cast-avatar">
                  {name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="film-ed-cast-info">
                  <span className="film-ed-cast-name">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="film-ed-divider" />

        {/* Next / Prev */}
        <div className="film-ed-nav">
          <TransitionLink href={`/films/${prevFilm.slug}`} className="film-ed-nav-link">
            <span className="film-ed-nav-dir">Previous</span>
            <span className="film-ed-nav-title">{prevFilm.title}</span>
          </TransitionLink>
          <TransitionLink href="/films" className="film-ed-nav-center">
            All Films
          </TransitionLink>
          <TransitionLink href={`/films/${nextFilm.slug}`} className="film-ed-nav-link film-ed-nav-right">
            <span className="film-ed-nav-dir">Next</span>
            <span className="film-ed-nav-title">{nextFilm.title}</span>
          </TransitionLink>
        </div>
      </section>
    </div>
  );
}
