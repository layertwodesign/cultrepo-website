"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { films, getFilmBySlug, getRelatedFilms } from "@/lib/films";
import TransitionLink from "@/components/TransitionLink";
import { useTransition } from "@/components/PageTransition";

export default function FilmPage() {
  const { slug } = useParams<{ slug: string }>();
  const film = getFilmBySlug(slug);
  const { navigateTo } = useTransition();
  const [activeSection, setActiveSection] = useState("film");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxRect, setLightboxRect] = useState<DOMRect | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const parallaxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Scroll-based: border-radius animation + active section tracking + parallax + pause/play
  useEffect(() => {
    let videoPaused = false;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // Pause YouTube when video scrolls out of view, resume when back
      const videoEl = document.getElementById("section-film");
      if (videoEl) {
        const rect = videoEl.getBoundingClientRect();
        const outOfView = rect.bottom < 0;
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          if (outOfView && !videoPaused) {
            iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
            videoPaused = true;
          } else if (!outOfView && videoPaused) {
            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
            videoPaused = false;
          }
        }
      }

      // Animate border-radius — all sections share the same value, driven by page scroll
      // Reaches 50px by the time the user has scrolled ~300px
      const radiusProgress = Math.max(0, Math.min(1, scrollY / 300));
      const radius = 12 + radiusProgress * 38; // 12px → 50px
      document.querySelectorAll<HTMLElement>(".fp-section").forEach((el) => {
        el.style.borderRadius = `${radius}px`;
      });

      // Track active section for sidebar
      const ids = ["film", "about", "humans", "sponsors"];
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${ids[i]}`);
        if (el && el.getBoundingClientRect().top < vh * 0.4) {
          setActiveSection(ids[i]);
          break;
        }
      }

      // Parallax images
      parallaxRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = ((center / vh) - 0.5) * -30; // -30px to +30px
        const img = el.querySelector<HTMLElement>(".fp-parallax-img");
        if (img) img.style.transform = `translate(-50%, -50%) translateY(${offset}px)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lightbox
  const openLightbox = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const img = e.currentTarget;
    const src = img.dataset.src || img.querySelector("video")?.src || "";
    setLightboxRect(img.getBoundingClientRect());
    setLightboxSrc(src);
    requestAnimationFrame(() => requestAnimationFrame(() => setLightboxOpen(true)));
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setTimeout(() => { setLightboxSrc(null); setLightboxRect(null); }, 400);
  }, []);

  if (!film) return <div className="page-container"><p>Film not found.</p></div>;

  const related = getRelatedFilms(slug, 3);
  const isFundraising = film.status === "Fundraising";

  const scrollTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fp" ref={pageRef}>
      {/* X close button */}
      <button className="fp-close" onClick={() => navigateTo("/")} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div className="fp-layout">
        {/* ===== MAIN CONTENT (LEFT) ===== */}
        <div className="fp-main">

          {/* YouTube embed */}
          <section className="fp-video" id="section-film">
            {film.youtubeId ? (
              <iframe
                ref={iframeRef}
                className="fp-video-iframe"
                src={`https://www.youtube.com/embed/${film.youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white&iv_load_policy=3&enablejsapi=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={film.title}
              />
            ) : (
              <video src={film.video} controls playsInline preload="auto" className="fp-video-fallback" />
            )}
          </section>

          {/* About */}
          <section className="fp-section" id="section-about">
            <span className="fp-label">About</span>
            <p className="fp-about-text">{film.synopsis}</p>
          </section>

          {/* Parallax images */}
          <div className="fp-images-row">
            <div className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[0] = el; }}>
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" className="fp-parallax-img" data-src={film.video} onClick={openLightbox} />
            </div>
            <div className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[1] = el; }}>
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" className="fp-parallax-img" style={{ objectPosition: "center 30%" }} data-src={film.video} onClick={openLightbox} />
            </div>
          </div>

          {/* The Humans */}
          <section className="fp-section" id="section-humans">
            <span className="fp-label">The Humans</span>
            <div className="fp-humans">
              {film.cast.map((person) => (
                <div key={person.name} className="fp-human">
                  <div className="fp-human-photo">
                    <span className="fp-human-initials">{person.name.split(" ").map((n) => n[0]).join("")}</span>
                  </div>
                  <div className="fp-human-info">
                    <span className="fp-human-name">{person.name}</span>
                    <span className="fp-human-role">{person.role}</span>
                  </div>
                </div>
              ))}
              {film.crew.map((person) => (
                <div key={person.name + person.role} className="fp-human">
                  <div className="fp-human-photo fp-human-photo-crew">
                    <span className="fp-human-initials">{person.name.split(" ").map((n) => n[0]).join("")}</span>
                  </div>
                  <div className="fp-human-info">
                    <span className="fp-human-name">{person.name}</span>
                    <span className="fp-human-role">{person.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* More parallax images */}
          <div className="fp-image-frame fp-image-full fp-section" ref={(el) => { parallaxRefs.current[2] = el; }}>
            <video src={film.video} muted loop playsInline autoPlay preload="metadata" className="fp-parallax-img" style={{ objectPosition: "center 70%" }} data-src={film.video} onClick={openLightbox} />
          </div>

          {/* Sponsors */}
          {film.sponsors.length > 0 && (
            <section className="fp-section" id="section-sponsors">
              <span className="fp-label">Sponsors</span>
              <div className="fp-sponsors">
                {film.sponsors.map((s) => (
                  <div key={s.name} className="fp-sponsor">{s.name}</div>
                ))}
              </div>
              <p className="fp-sponsor-note">Want to sponsor the next film?</p>
              <TransitionLink href="/about" className="fp-sponsor-link">Partner with CultRepo &rarr;</TransitionLink>
            </section>
          )}

          {/* Tech tags */}
          <section className="fp-section">
            <span className="fp-label">Technologies</span>
            <div className="fp-techs">
              {film.technologies.map((t) => (
                <span key={t} className="fp-tech">{t}</span>
              ))}
            </div>
          </section>

          {/* Related films */}
          <section className="fp-section">
            <span className="fp-label">More Films</span>
            <div className="fp-related">
              {related.map((r) => (
                <TransitionLink key={r.slug} href={`/films/${r.slug}`} className="fp-related-card">
                  <div className="fp-related-thumb">
                    <video src={r.video} muted loop playsInline autoPlay preload="metadata" />
                  </div>
                  <div className="fp-related-info">
                    <span className="fp-related-title">{r.title}</span>
                    <span className="fp-related-status">{r.status}</span>
                  </div>
                </TransitionLink>
              ))}
            </div>
          </section>

          {/* Footer CTAs */}
          <div className="fp-footer-cta">
            <TransitionLink href="/about" className="fp-footer-link">Partner with CultRepo &rarr;</TransitionLink>
            <TransitionLink href="/films" className="fp-footer-link">View All Films &rarr;</TransitionLink>
          </div>

        </div>

        {/* ===== SIDEBAR (RIGHT, STICKY) ===== */}
        <aside className="fp-sidebar">
          {/* The Film card */}
          <div className="fp-sb-card fp-sb-film">
            <span className="fp-sb-label">The Film</span>
            <div className="fp-sb-film-row">
              <div className="fp-sb-film-info">
                <span className="fp-sb-film-title">{film.title}</span>
                <span className="fp-sb-film-desc">{film.description}</span>
              </div>
              {film.poster ? (
                <img
                  src={film.poster}
                  alt={`${film.title} poster`}
                  className="fp-sb-poster-img"
                  data-src={film.poster}
                  onClick={openLightbox}
                />
              ) : (
                <div className="fp-sb-poster" data-src={film.video} onClick={openLightbox}>
                  <video src={film.video} muted loop playsInline autoPlay preload="metadata" />
                </div>
              )}
            </div>
            <div className="fp-sb-divider" />
            <div className="fp-sb-meta-grid">
              <div className="fp-sb-meta">
                <span className="fp-sb-meta-key">Director</span>
                <span className="fp-sb-meta-val">{film.director}</span>
              </div>
              <div className="fp-sb-meta">
                <span className="fp-sb-meta-key">Year</span>
                <span className="fp-sb-meta-val">{film.year}</span>
              </div>
              <div className="fp-sb-meta">
                <span className="fp-sb-meta-key">Run Time</span>
                <span className="fp-sb-meta-val">{film.duration}</span>
              </div>
              <div className="fp-sb-meta">
                <span className="fp-sb-meta-key">Views</span>
                <span className="fp-sb-meta-val">—</span>
              </div>
            </div>
          </div>

          {/* Anchor links */}
          <button className={`fp-sb-link ${activeSection === "about" ? "active" : ""}`} onClick={() => scrollTo("about")}>
            About
          </button>
          <button className={`fp-sb-link ${activeSection === "humans" ? "active" : ""}`} onClick={() => scrollTo("humans")}>
            The Humans
          </button>
          {film.sponsors.length > 0 && (
            <button className={`fp-sb-link ${activeSection === "sponsors" ? "active" : ""}`} onClick={() => scrollTo("sponsors")}>
              Sponsors
            </button>
          )}

          {/* Watch on YouTube */}
          {film.youtubeId && (
            <a href={`https://www.youtube.com/watch?v=${film.youtubeId}`} target="_blank" rel="noopener noreferrer" className="fp-sb-yt">
              <span>Watch On Youtube</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          )}
        </aside>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div className={`fp-lightbox ${lightboxOpen ? "open" : ""}`} onClick={closeLightbox}>
          <video src={lightboxSrc} muted loop playsInline autoPlay className="fp-lightbox-media" />
        </div>
      )}
    </div>
  );
}
