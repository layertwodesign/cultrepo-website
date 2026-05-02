"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Film } from "@/lib/films";
import TransitionLink from "@/components/TransitionLink";
import { useTransition } from "@/components/PageTransition";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/SplitReveal";

const STAGGER_MS = 80;
const GRID_COLS = 3;

type Props = {
  film: Film;
  allFilms: Film[];
};

export default function FilmPageClient({ film, allFilms }: Props) {
  const slug = film.slug;
  const { navigateTo, consumeFilmRect } = useTransition();
  const [entered, setEntered] = useState(false);
  const [activeSection, setActiveSection] = useState("film");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxRect, setLightboxRect] = useState<DOMRect | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const parallaxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoSectionRef = useRef<HTMLElement>(null);

  // Seamless handoff: if coming from carousel, position video at the card's final rect
  // then animate to its natural position
  useEffect(() => {
    const rect = consumeFilmRect();
    const el = videoSectionRef.current;
    if (!rect || !el) {
      setEntered(true);
      return;
    }

    // Get the video's natural position
    const natural = el.getBoundingClientRect();

    // Start at the card's final position
    el.style.position = "fixed";
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    el.style.zIndex = "999";
    el.style.transition = "none";

    // Next frame: animate to natural position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.left = `${natural.left}px`;
        el.style.top = `${natural.top}px`;
        el.style.width = `${natural.width}px`;
        el.style.height = `${natural.height}px`;

        // After settle, clear inline styles and show rest of content
        setTimeout(() => {
          el.style.cssText = "";
          setEntered(true);
        }, 520);
      });
    });
  }, [consumeFilmRect]);

  const scrollPausedRef = useRef(false);

  // Scroll-based: border-radius animation + active section tracking + parallax + auto-pause
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // Pause YouTube when the video scrolls out of view. We do NOT auto-resume
      // when the user scrolls back — once the video is paused (whether by us or
      // by the user), the user controls when it plays again via the YouTube
      // play button. This avoids the user-paused-then-it-restarted-itself
      // surprise that detecting state changes through cross-origin postMessage
      // can't catch reliably.
      const videoEl = document.getElementById("section-film");
      if (videoEl) {
        const rect = videoEl.getBoundingClientRect();
        const outOfView = rect.bottom < 0;
        const iframe = iframeRef.current;
        if (iframe?.contentWindow && outOfView && !scrollPausedRef.current) {
          scrollPausedRef.current = true;
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
        } else if (!outOfView && scrollPausedRef.current) {
          scrollPausedRef.current = false;
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

  const isFundraising = film.status === "Fundraising";

  const scrollTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fp" ref={pageRef}>
      <div className="fp-layout">
        {/* ===== MAIN CONTENT (LEFT) ===== */}
        <div className={`fp-main ${entered ? "fp-entered" : ""}`}>

          {/* YouTube embed */}
          <section className="fp-video fp-section" id="section-film" ref={videoSectionRef}>
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

          {/* Status — only when film not yet released */}
          {film.status !== "Released" && (
            <section className="fp-section fp-status-section">
              <Reveal>
                <span className="fp-label">{isFundraising ? "Fundraising" : "Coming Soon"}</span>
              </Reveal>
              <Reveal delay={120}>
                <p className="fp-status-headline">
                  {isFundraising
                    ? `In production — targeting ${film.year}`
                    : `${film.status} — targeting ${film.year}`}
                </p>
              </Reveal>
              {film.timeline.length > 0 && (
                <div className="fp-status-timeline">
                  {film.timeline.map((step, i) => (
                    <Reveal key={step.label} delay={240 + i * 60}>
                      <div className={`fp-status-step ${step.done ? "done" : ""}`}>
                        <span className="fp-status-dot" />
                        <span>{step.label}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
              {film.fundraising && (
                <Reveal delay={300}>
                  <div className="fp-fundraising">
                    <div className="fp-fundraising-bar">
                      <div
                        className="fp-fundraising-fill"
                        style={{ width: `${Math.min(100, (film.fundraising.raised / film.fundraising.goal) * 100)}%` }}
                      />
                    </div>
                    <div className="fp-fundraising-meta">
                      <span>${film.fundraising.raised.toLocaleString()} raised</span>
                      <span>${film.fundraising.goal.toLocaleString()} goal</span>
                    </div>
                  </div>
                </Reveal>
              )}
            </section>
          )}

          {/* About */}
          <section className="fp-section" id="section-about">
            <Reveal>
              <span className="fp-label">About</span>
            </Reveal>
            <p className="fp-about-text">
              <SplitReveal text={film.synopsis} stagger={18} startDelay={150} />
            </p>
          </section>

          {/* Parallax images */}
          {film.stills.length >= 2 && (
            <div className="fp-images-row">
              <div className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[0] = el; }}>
                <img src={film.stills[0]} alt="" className="fp-parallax-img" data-src={film.stills[0]} onClick={openLightbox} />
              </div>
              <div className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[1] = el; }}>
                <img src={film.stills[1]} alt="" className="fp-parallax-img" data-src={film.stills[1]} onClick={openLightbox} />
              </div>
            </div>
          )}

          {/* The Humans */}
          <section className="fp-section" id="section-humans">
            <Reveal>
              <span className="fp-label">The Humans</span>
            </Reveal>

            {/* Featuring — large portrait cards */}
            <Reveal delay={120}>
              <h3 className="fp-humans-heading">Featuring</h3>
            </Reveal>
            <div className="fp-featuring">
              {film.cast.map((person, i) => (
                <Reveal key={person.name} delay={200 + i * 90}>
                  <div className="fp-featuring-card">
                    <div className="fp-featuring-photo">
                      {person.photo ? (
                        <img src={person.photo} alt={person.name} className="fp-featuring-photo-img" />
                      ) : (
                        <span className="fp-featuring-initials">{person.name.split(" ").map((n) => n[0]).join("")}</span>
                      )}
                    </div>
                    <div className="fp-featuring-info">
                      <span className="fp-featuring-name">{person.name}</span>
                      <span className="fp-featuring-role">{person.role}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Crew — smaller inline */}
            <Reveal>
              <h3 className="fp-humans-heading fp-crew-heading">Crew</h3>
            </Reveal>
            <div className="fp-crew">
              {film.crew.map((person, i) => (
                <Reveal key={person.name + person.role} delay={120 + i * 60}>
                  <div className="fp-crew-member">
                    <div className="fp-crew-photo">
                      <span className="fp-crew-initials">{person.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    <div className="fp-crew-info">
                      <span className="fp-crew-role">{person.role}</span>
                      <span className="fp-crew-name">{person.name}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* More parallax images */}
          {film.stills.length >= 3 && (
            <div className="fp-image-frame fp-image-full fp-section" ref={(el) => { parallaxRefs.current[2] = el; }}>
              <img src={film.stills[2]} alt="" className="fp-parallax-img" data-src={film.stills[2]} onClick={openLightbox} />
            </div>
          )}

          {/* Additional stills grid */}
          {film.stills.length > 3 && (
            <div className="fp-images-row">
              {film.stills.slice(3, 5).map((src, i) => (
                <div key={src} className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[3 + i] = el; }}>
                  <img src={src} alt="" className="fp-parallax-img" data-src={src} onClick={openLightbox} />
                </div>
              ))}
            </div>
          )}

          {/* Sponsors */}
          {film.sponsors.length > 0 && (
            <section className="fp-section" id="section-sponsors">
              <Reveal>
                <span className="fp-label">Sponsors</span>
              </Reveal>
              <div className="fp-sponsors">
                {film.sponsors.map((s, i) => (
                  <Reveal key={s.name} delay={120 + i * 60}>
                    <div className="fp-sponsor">{s.name}</div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={300}>
                <p className="fp-sponsor-note">Want to sponsor the next film?</p>
              </Reveal>
              <Reveal delay={360}>
                <TransitionLink href="/about" className="fp-sponsor-link">Partner with CultRepo &rarr;</TransitionLink>
              </Reveal>
            </section>
          )}

          {/* Tech tags */}
          <section className="fp-section">
            <Reveal>
              <span className="fp-label">Technologies</span>
            </Reveal>
            <div className="fp-techs">
              {film.technologies.map((t, i) => (
                <Reveal key={t} delay={120 + i * 40}>
                  <span className="fp-tech">{t}</span>
                </Reveal>
              ))}
            </div>
          </section>

        </div>

        {/* ===== SIDEBAR (RIGHT, STICKY) ===== */}
        <aside className={`fp-sidebar ${entered ? "fp-entered" : ""}`}>
          {/* X close button */}
          <button className="fp-close" onClick={() => navigateTo("/")} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* The Film card */}
          <div className="fp-sb-card fp-sb-film">
            <div className="fp-sb-film-row">
              <div className="fp-sb-film-info">
                <span className="fp-sb-label">The Film</span>
                <div className="fp-sb-film-bottom">
                  <span className="fp-sb-film-title">{film.title}</span>
                  <span className="fp-sb-film-desc">{film.description}</span>
                </div>
              </div>
              {film.poster && (
                <img
                  src={film.poster}
                  alt={`${film.title} poster`}
                  className="fp-sb-poster-img"
                  data-src={film.poster}
                  onClick={openLightbox}
                />
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

      {/* More Films — full-width grid below the layout */}
      <section className="fp-more-films">
        <Reveal>
          <span className="fp-label fp-more-films-label">More Films</span>
        </Reveal>
        <div className="films-grid">
          {allFilms.filter((f) => f.slug !== slug).map((f, i) => {
            const row = Math.floor(i / GRID_COLS);
            const col = i % GRID_COLS;
            const delay = (row + col) * STAGGER_MS;
            return (
              <Reveal key={f.slug} delay={delay}>
                <TransitionLink href={`/films/${f.slug}`} className="film-card">
                  <div className="film-card-video-wrap">
                    <video src={f.video} muted loop playsInline autoPlay preload="metadata" className="film-card-video" />
                    <div className="film-card-overlay" />
                  </div>
                  <div className="film-card-info">
                    <span className="film-card-title">{f.title}</span>
                    <span className="film-card-status">{f.status}</span>
                  </div>
                </TransitionLink>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxSrc && (
        <div className={`fp-lightbox ${lightboxOpen ? "open" : ""}`} onClick={closeLightbox}>
          {lightboxSrc.endsWith(".mp4") ? (
            <video src={lightboxSrc} muted loop playsInline autoPlay className="fp-lightbox-media" />
          ) : (
            <img src={lightboxSrc} alt="" className="fp-lightbox-media" />
          )}
        </div>
      )}
    </div>
  );
}
