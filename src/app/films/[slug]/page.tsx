"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { films, getFilmBySlug, getRelatedFilms } from "@/lib/films";
import TransitionLink from "@/components/TransitionLink";
import StippleOverlay from "@/components/StippleOverlay";
import { useNavVisibility } from "@/components/NavVisibility";
import { useTransition } from "@/components/PageTransition";

export default function FilmPage() {
  const { slug } = useParams<{ slug: string }>();
  const film = getFilmBySlug(slug);
  const { setHidden } = useNavVisibility();
  const { navigateTo } = useTransition();
  const [scrolled, setScrolled] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [stippleOut, setStippleOut] = useState(false);
  const [stippleDone, setStippleDone] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!film?.youtubeId) return;
    const onMessage = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === "onStateChange" && data.info === 1) setYtReady(true);
        if (data.event === "onReady" || data.event === "initialDelivery") {
          iframeRef.current?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("message", onMessage);
    const fallback = setTimeout(() => setYtReady(true), 3000);
    return () => { window.removeEventListener("message", onMessage); clearTimeout(fallback); };
  }, [film?.youtubeId]);

  useEffect(() => { if (ytReady && !stippleOut) setStippleOut(true); }, [ytReady, stippleOut]);

  useEffect(() => {
    setHidden(true);
    let wasPaused = false;
    const onScroll = () => {
      const threshold = window.innerHeight * 0.7;
      const past = window.scrollY > threshold;
      setScrolled(past);
      setHidden(window.scrollY <= threshold);
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        if (past && !wasPaused) { iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*"); wasPaused = true; }
        else if (!past && wasPaused) { iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*"); wasPaused = false; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); setHidden(false); };
  }, [setHidden]);

  if (!film) return <div className="page-container"><p>Film not found.</p></div>;

  const related = getRelatedFilms(slug, 3);
  const isFundraising = film.status === "Fundraising";
  const fundraisingPct = film.fundraising ? Math.min(100, (film.fundraising.raised / film.fundraising.goal) * 100) : 0;

  return (
    <div className="film-page">
      {/* ===== HERO ===== */}
      <section className="film-hero film-hero-immersive" ref={heroRef}>
        <video src={film.video} muted loop playsInline autoPlay preload="auto" className="film-hero-video film-hero-clip" />
        {film.youtubeId && (
          <iframe ref={iframeRef} className="film-hero-iframe film-hero-iframe-visible"
            src={`https://www.youtube.com/embed/${film.youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white&iv_load_policy=3&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={film.title} />
        )}
        {film.youtubeId && !stippleDone && (
          <StippleOverlay direction="out" running={stippleOut} duration={450} style={{ zIndex: 5 }} onComplete={() => setStippleDone(true)} />
        )}
        <button className={`film-close ${scrolled ? "film-close-hidden" : ""}`} onClick={() => navigateTo("/")} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <div className={`film-scroll-indicator ${scrolled ? "film-scroll-hidden" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M5 11l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </section>

      {/* ===== EDITORIAL CONTENT ===== */}
      <section className="film-editorial">

        {/* Title block */}
        <div className="film-ed-title-block">
          <span className="film-ed-status">{film.status}</span>
          <h1 className="film-ed-title">{film.title}</h1>
          <p className="film-ed-tagline">{film.description}</p>
        </div>

        {/* Meta / Credits */}
        <div className="film-ed-meta-strip">
          <div className="film-ed-meta"><span className="film-ed-meta-key">Director</span><span className="film-ed-meta-val">{film.director}</span></div>
          <div className="film-ed-meta"><span className="film-ed-meta-key">Year</span><span className="film-ed-meta-val">{film.year}</span></div>
          <div className="film-ed-meta"><span className="film-ed-meta-key">Runtime</span><span className="film-ed-meta-val">{film.duration}</span></div>
          <div className="film-ed-meta"><span className="film-ed-meta-key">Status</span><span className="film-ed-meta-val">{film.status}</span></div>
        </div>

        <div className="film-ed-divider" />

        {/* Synopsis */}
        <div className="film-ed-synopsis"><p>{film.synopsis}</p></div>

        {/* Extra videos */}
        {film.extras.length > 0 && (
          <>
            <h2 className="film-ed-section-label">More Videos</h2>
            <div className="film-ed-extras">
              {film.extras.map((extra) => (
                <div key={extra.youtubeId} className="film-ed-extra">
                  <div className="film-ed-extra-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${extra.youtubeId}?rel=0&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen title={extra.title} />
                  </div>
                  <span className="film-ed-extra-title">{extra.title}</span>
                </div>
              ))}
            </div>
            <div className="film-ed-divider" />
          </>
        )}

        {/* Cast */}
        <div className="film-ed-cast-section">
          <h2 className="film-ed-section-label">Featuring</h2>
          <div className="film-ed-cast">
            {film.cast.map((person) => (
              <div key={person.name} className="film-ed-cast-member">
                <div className="film-ed-cast-avatar">{person.name.split(" ").map((n) => n[0]).join("")}</div>
                <div className="film-ed-cast-info">
                  <span className="film-ed-cast-name">{person.name}</span>
                  <span className="film-ed-cast-role">{person.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crew */}
        <div className="film-ed-cast-section">
          <h2 className="film-ed-section-label">Crew</h2>
          <div className="film-ed-cast">
            {film.crew.map((person) => (
              <div key={person.name + person.role} className="film-ed-cast-member">
                <div className="film-ed-cast-avatar">{person.name.split(" ").map((n) => n[0]).join("")}</div>
                <div className="film-ed-cast-info">
                  <span className="film-ed-cast-name">{person.name}</span>
                  <span className="film-ed-cast-role">{person.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="film-ed-divider" />

        {/* Sponsors */}
        {film.sponsors.length > 0 && (
          <>
            <div className="film-ed-sponsors-section">
              <h2 className="film-ed-section-label">Sponsored By</h2>
              <div className="film-ed-sponsors">
                {film.sponsors.map((s) => (
                  <div key={s.name} className="film-ed-sponsor">{s.name}</div>
                ))}
              </div>
              <p className="film-ed-sponsor-cta-text">
                Want your brand alongside these partners?
              </p>
              <TransitionLink href="/about" className="film-ed-sponsor-cta">Become a Sponsor</TransitionLink>
            </div>
            <div className="film-ed-divider" />
          </>
        )}

        {/* Technologies */}
        <div className="film-ed-tech-section">
          <h2 className="film-ed-section-label">Technologies Featured</h2>
          <div className="film-ed-techs">
            {film.technologies.map((t) => (
              <span key={t} className="film-ed-tech-chip">{t}</span>
            ))}
          </div>
        </div>

        <div className="film-ed-divider" />

        {/* Stills */}
        <div className="film-ed-stills-section">
          <h2 className="film-ed-section-label">Production Stills</h2>
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
            <div className="film-ed-still-row">
              <div className="film-ed-still film-ed-still-square">
                <video src={film.video} muted loop playsInline autoPlay preload="metadata" style={{ objectPosition: "left 40%" }} />
              </div>
              <div className="film-ed-still film-ed-still-portrait">
                <video src={film.video} muted loop playsInline autoPlay preload="metadata" style={{ objectPosition: "right 60%" }} />
              </div>
            </div>
            <div className="film-ed-still film-ed-still-cinematic">
              <video src={film.video} muted loop playsInline autoPlay preload="metadata" style={{ objectPosition: "center 50%" }} />
            </div>
          </div>
        </div>

        <div className="film-ed-divider" />

        {/* Timeline */}
        <div className="film-ed-timeline-section">
          <h2 className="film-ed-section-label">Production Timeline</h2>
          <div className="film-ed-timeline">
            {film.timeline.map((step, i) => (
              <div key={step.label} className={`film-ed-timeline-step ${step.done ? "done" : ""}`}>
                <div className="film-ed-timeline-dot" />
                {i < film.timeline.length - 1 && <div className="film-ed-timeline-line" />}
                <span className="film-ed-timeline-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fundraising */}
        {isFundraising && film.fundraising && (
          <>
            <div className="film-ed-divider" />
            <div className="film-ed-fundraise">
              <h2 className="film-ed-section-label">Support This Film</h2>
              <p className="film-ed-fundraise-desc">
                Help us bring this story to life. Every contribution goes directly toward production costs.
              </p>
              <div className="film-ed-fundraise-bar-wrap">
                <div className="film-ed-fundraise-bar" style={{ width: `${fundraisingPct}%` }} />
              </div>
              <div className="film-ed-fundraise-stats">
                <span className="film-ed-fundraise-raised">${film.fundraising.raised.toLocaleString()} raised</span>
                <span className="film-ed-fundraise-goal">of ${film.fundraising.goal.toLocaleString()} goal</span>
              </div>
              <div className="film-ed-fundraise-tiers">
                <button className="film-ed-fundraise-tier">
                  <span className="film-ed-tier-price">$5</span>
                  <span className="film-ed-tier-label">Rent a Film</span>
                </button>
                <button className="film-ed-fundraise-tier">
                  <span className="film-ed-tier-price">$25</span>
                  <span className="film-ed-tier-label">Supporter</span>
                </button>
                <button className="film-ed-fundraise-tier featured">
                  <span className="film-ed-tier-price">$100</span>
                  <span className="film-ed-tier-label">Named Credit</span>
                </button>
                <button className="film-ed-fundraise-tier">
                  <span className="film-ed-tier-price">$500</span>
                  <span className="film-ed-tier-label">Executive Producer</span>
                </button>
              </div>
            </div>
          </>
        )}

        <div className="film-ed-divider" />

        {/* Related films */}
        <div className="film-ed-related">
          <h2 className="film-ed-section-label">More Films</h2>
          <div className="film-ed-related-grid">
            {related.map((r) => (
              <TransitionLink key={r.slug} href={`/films/${r.slug}`} className="film-ed-related-card">
                <div className="film-ed-related-video-wrap">
                  <video src={r.video} muted loop playsInline autoPlay preload="metadata" className="film-ed-related-video" />
                </div>
                <div className="film-ed-related-info">
                  <span className="film-ed-related-title">{r.title}</span>
                  <span className="film-ed-related-status">{r.status}</span>
                </div>
              </TransitionLink>
            ))}
          </div>
        </div>

        <div className="film-ed-divider" />

        {/* Share / Subscribe */}
        <div className="film-ed-share">
          <h2 className="film-ed-section-label">Stay Connected</h2>
          <div className="film-ed-share-actions">
            <a href={`https://youtube.com/@cultrepo?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="film-ed-share-btn primary">
              Subscribe on YouTube
            </a>
            <a href={`https://twitter.com/intent/tweet?text=Watch%20${encodeURIComponent(film.title)}%20by%20@cultrepo&url=${encodeURIComponent(`https://cultrepo.com/films/${film.slug}`)}`} target="_blank" rel="noopener noreferrer" className="film-ed-share-btn">
              Share on X
            </a>
          </div>
        </div>

        <div className="film-ed-divider" />

        {/* Footer CTA band */}
        <div className="film-ed-footer-cta">
          <div className="film-ed-footer-cta-item">
            <span className="film-ed-footer-cta-label">Want to sponsor the next one?</span>
            <TransitionLink href="/about" className="film-ed-footer-cta-link">Partner with CultRepo &rarr;</TransitionLink>
          </div>
          <div className="film-ed-footer-cta-item">
            <span className="film-ed-footer-cta-label">Explore the full catalog</span>
            <TransitionLink href="/films" className="film-ed-footer-cta-link">View All Films &rarr;</TransitionLink>
          </div>
        </div>

      </section>
    </div>
  );
}
