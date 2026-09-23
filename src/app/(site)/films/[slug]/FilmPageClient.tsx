"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import type { Film } from "@/lib/films";
import FilmPreview from "@/components/FilmPreview";
import TransitionLink from "@/components/TransitionLink";
import { useTransition } from "@/components/PageTransition";
import Reveal from "@/components/Reveal";
import { getCrewPortrait, portraitCredits } from "@/lib/people-portraits";

const STAGGER_MS = 80;
const GRID_COLS = 3;
const ABOUT_PREVIEW_WORDS = 80;

function FilmAbout({ synopsis }: { synopsis: string }) {
  const [expanded, setExpanded] = useState(false);
  const words = Array.from(synopsis.matchAll(/\S+/g));
  const canExpand = words.length > ABOUT_PREVIEW_WORDS;
  const lastPreviewWord = words[ABOUT_PREVIEW_WORDS - 1];
  const previewText = canExpand
    ? synopsis.slice(0, lastPreviewWord.index! + lastPreviewWord[0].length)
    : synopsis;
  const previewParagraphs = previewText.trim().split(/\n\s*\n/);
  if (canExpand && previewParagraphs.length > 1 && previewParagraphs.at(-1)!.split(/\s+/).length < 12) {
    previewParagraphs.pop();
  }
  const preview = previewParagraphs.join("\n\n");

  return (
    <>
      <div id="film-about-copy" className="fp-about-text">
        {(expanded ? synopsis : preview).trim().split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {canExpand && (
        <button
          type="button"
          className="fp-about-toggle"
          aria-expanded={expanded}
          aria-controls="film-about-copy"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "read less" : "read more"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d={expanded ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}

type Props = {
  film: Film;
  allFilms: Film[];
  liveViews: number | null;
};

export default function FilmPageClient({ film, allFilms, liveViews }: Props) {
  const slug = film.slug;
  const { navigateTo, consumeFilmRect } = useTransition();
  const [entered, setEntered] = useState(false);
  const [activeSection, setActiveSection] = useState("film");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
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
    let secondFrame = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        el.style.transition = "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.left = `${natural.left}px`;
        el.style.top = `${natural.top}px`;
        el.style.width = `${natural.width}px`;
        el.style.height = `${natural.height}px`;

        // After settle, clear inline styles and show rest of content
        settleTimer = setTimeout(() => {
          el.style.cssText = "";
          setEntered(true);
        }, 520);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      clearTimeout(settleTimer);
      el.style.cssText = "";
    };
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
      const ids = ["film", "fundraising", "about", "humans", "sponsors"];
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
    setLightboxSrc(src);
    requestAnimationFrame(() => requestAnimationFrame(() => setLightboxOpen(true)));
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setTimeout(() => { setLightboxSrc(null); }, 400);
  }, []);

  const isFundraising = film.status === "Fundraising";

  const scrollTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fp" ref={pageRef}>
      {/* Mobile-only close button — sits left of the hamburger */}
      <button
        className="fp-close-mobile"
        onClick={() => navigateTo("/films")}
        aria-label="Close film"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
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
              <FilmPreview
                title={film.title}
                poster={film.poster}
                src={film.video}
                controls
                playsInline
                autoPlay
                loop
                preload="auto"
                className="fp-video-fallback"
                ref={(el) => {
                  if (!el) return;
                  // Try to autoplay with sound. If browser blocks (almost
                  // always on cold loads), fall back to muted autoplay so the
                  // clip still starts — same UX as the YouTube embed.
                  el.muted = false;
                  el.play().catch(() => {
                    el.muted = true;
                    el.play().catch(() => {});
                  });
                }}
              />
            )}
          </section>

          {/* Status — only when film not yet released */}
          {film.status !== "Released" && (
            <section className="fp-section fp-status-section" id="section-fundraising">
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
            <FilmAbout key={film.slug} synopsis={film.synopsis} />
          </section>

          {/* Parallax images */}
          {film.stills.length >= 2 && (
            <div className="fp-images-row">
              <div className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[0] = el; }}>
                <Image width={1600} height={900} sizes="(max-width: 768px) 50vw, 35vw" src={film.stills[0]} alt="" className="fp-parallax-img" data-src={film.stills[0]} onClick={openLightbox} />
              </div>
              <div className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[1] = el; }}>
                <Image width={1600} height={900} sizes="(max-width: 768px) 50vw, 35vw" src={film.stills[1]} alt="" className="fp-parallax-img" data-src={film.stills[1]} onClick={openLightbox} />
              </div>
            </div>
          )}

          {/* The Humans */}
          <section className="fp-section" id="section-humans">
            <Reveal>
              <span className="fp-label">The People</span>
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
                        <Image
                          src={person.photo}
                          alt={person.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 200px"
                          style={{ objectFit: "cover" }}
                        />
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

            {portraitCredits.filter((credit) => film.cast.some((person) => person.photo === credit.photo)).map((credit) => (
              <details className="fp-photo-credits" key={credit.photo}>
                <summary>Photo credits</summary>
                <p>
                  <a href={credit.source} target="_blank" rel="noopener noreferrer">{credit.person}</a>
                  {" by "}{credit.author}{" · "}
                  <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">{credit.license}</a>
                  {". Cropped to fit."}
                </p>
              </details>
            ))}

            {/* Crew — smaller inline */}
            <Reveal>
              <h3 className="fp-humans-heading fp-crew-heading">Crew</h3>
            </Reveal>
            <div className="fp-crew">
              {film.crew.map((person, i) => {
                const photo = getCrewPortrait(person.name);
                return (
                  <Reveal key={person.name + person.role} delay={120 + i * 60}>
                    <div className="fp-crew-member">
                      <div className="fp-crew-photo">
                        {photo ? (
                          <Image src={photo} alt={person.name} width={56} height={56} sizes="56px" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span className="fp-crew-initials">{person.name.trim().split(/\s+/).map((n) => n[0]).join("")}</span>
                        )}
                      </div>
                      <div className="fp-crew-info">
                        <span className="fp-crew-role">{person.role}</span>
                        <span className="fp-crew-name">{person.name}</span>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* More parallax images */}
          {film.stills.length >= 3 && (
            <div className="fp-image-frame fp-image-full fp-section" ref={(el) => { parallaxRefs.current[2] = el; }}>
              <Image width={1600} height={900} sizes="(max-width: 768px) 100vw, 70vw" src={film.stills[2]} alt="" className="fp-parallax-img" data-src={film.stills[2]} onClick={openLightbox} />
            </div>
          )}

          {/* Additional stills grid */}
          {film.stills.length > 3 && (
            <div className="fp-images-row">
              {film.stills.slice(3, 5).map((src, i) => (
                <div key={src} className="fp-image-frame fp-section" ref={(el) => { parallaxRefs.current[3 + i] = el; }}>
                  <Image width={1600} height={900} sizes="(max-width: 768px) 50vw, 35vw" src={src} alt="" className="fp-parallax-img" data-src={src} onClick={openLightbox} />
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
          <button className="fp-close" onClick={() => navigateTo("/films")} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* The Film card */}
          <div className="fp-sb-card fp-sb-film">
            <div className={`fp-sb-film-row ${!film.poster ? "no-poster" : ""}`}>
              <div className="fp-sb-film-info">
                <span className="fp-sb-label">
                  The Film
                  {film.filmType && (
                    <span className="fp-sb-type-badge">{film.filmType}</span>
                  )}
                </span>
                <div className="fp-sb-film-bottom">
                  <span className="fp-sb-film-title">{film.title}</span>
                  <span className="fp-sb-film-desc">{film.description}</span>
                </div>
              </div>
              {film.poster && (
                <Image
                  width={480} height={680} sizes="96px" style={{ height: "auto" }}
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
              {(() => {
                const director =
                  film.crew.find((c) => /director(?! of)/i.test(c.role) && !/photography/i.test(c.role))?.name
                  ?? (film.director || null);
                const producer = film.crew.find((c) => /producer/i.test(c.role))?.name ?? null;
                const rows: { key: string; val: string }[] = [];
                if (director) rows.push({ key: "Director", val: director });
                if (producer) rows.push({ key: "Producer", val: producer });
                if (film.year) rows.push({ key: "Year", val: film.year });
                if (film.duration) rows.push({ key: "Run Time", val: film.duration });
                rows.push({
                  key: "Views",
                  val: liveViews != null
                    ? liveViews >= 1_000_000
                      ? `${(liveViews / 1_000_000).toFixed(1)}M`
                      : liveViews >= 1_000
                        ? `${(liveViews / 1_000).toFixed(1)}K`
                        : liveViews.toLocaleString()
                    : "—",
                });
                return rows.map((r) => (
                  <div key={r.key} className="fp-sb-meta">
                    <span className="fp-sb-meta-key">{r.key}</span>
                    <span className="fp-sb-meta-val">{r.val}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Anchor links */}
          {film.status !== "Released" && (
            <button
              className={`fp-sb-link ${activeSection === "fundraising" ? "active" : ""}`}
              onClick={() => scrollTo("fundraising")}
            >
              {isFundraising ? "Fundraising" : "Status"}
            </button>
          )}
          <button className={`fp-sb-link ${activeSection === "about" ? "active" : ""}`} onClick={() => scrollTo("about")}>
            About
          </button>
          <button className={`fp-sb-link ${activeSection === "humans" ? "active" : ""}`} onClick={() => scrollTo("humans")}>
            The People
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
                    <FilmPreview title={f.title} poster={f.poster} src={f.video} muted loop playsInline autoPlay preload="metadata" className="film-card-video" />
                    <div className="film-card-overlay" />
                  </div>
                  <div className="film-card-info">
                    <span className="film-card-title">{f.title}</span>
                    <span className="film-card-status">
                      {f.status === "Released" && f.year ? f.year : f.status}
                    </span>
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
            <div style={{ position: "relative", width: "80vw", height: "80vh" }}>
              <Image src={lightboxSrc} alt={`${film.title} still`} fill sizes="80vw" className="fp-lightbox-media" style={{ objectFit: "contain" }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
