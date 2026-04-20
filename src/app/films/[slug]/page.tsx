"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
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
  const [phase, setPhase] = useState<"loading" | "ready" | "playing">("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef(0);
  const ytReadyRef = useRef(false);

  // Loading bar — crawls until YouTube signals ready, then finishes
  useEffect(() => {
    if (!film?.youtubeId) return;
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (!ytReadyRef.current) {
        // Crawl toward 90% while waiting
        const fast = Math.min(elapsed / 1200, 1) * 60;
        const slow = Math.max(0, (elapsed - 1200) / 10000) * 30;
        progressRef.current = Math.min(fast + slow, 90);
      } else {
        // YouTube ready — fill to 100
        progressRef.current = Math.min(progressRef.current + 4, 100);
      }
      setLoadProgress(progressRef.current);

      if (progressRef.current >= 100 && phase === "loading") {
        // Bar is full — transition to "ready" (loader fades out)
        setPhase("ready");
        // After loader fade (500ms), start playback
        setTimeout(() => {
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"playVideo","args":""}', "*"
            );
          }
          setPhase("playing");
        }, 500);
        return; // stop the loop
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [film?.youtubeId, phase]);

  // Listen for YouTube iframe ready
  useEffect(() => {
    if (!film?.youtubeId) return;

    const onMessage = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === "onReady" || data.event === "initialDelivery") {
          ytReadyRef.current = true;
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", onMessage);

    // Fallback — if YouTube doesn't respond in 5s, proceed anyway
    const fallback = setTimeout(() => { ytReadyRef.current = true; }, 5000);

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(fallback);
    };
  }, [film?.youtubeId]);

  const showLoader = phase === "loading";
  const showYoutube = phase === "playing";

  // Hide nav on mount, show on scroll past hero
  useEffect(() => {
    setHidden(true);

    let wasPaused = false;
    const onScroll = () => {
      const threshold = window.innerHeight * 0.7;
      const pastThreshold = window.scrollY > threshold;
      setScrolled(pastThreshold);
      setHidden(window.scrollY <= threshold);

      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        if (pastThreshold && !wasPaused) {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
          wasPaused = true;
        } else if (!pastThreshold && wasPaused) {
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
          wasPaused = false;
        }
      }
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
        {/* Clip video as ambient background during loading */}
        <video
          src={film.video}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          className={`film-hero-video film-hero-clip ${showYoutube ? "film-hero-clip-hidden" : ""}`}
        />

        {/* Loading overlay — ghost + progress bar */}
        {film.youtubeId && (
          <div className={`film-loader ${!showLoader ? "film-loader-hidden" : ""}`}>
            <img src="/ghost.png" alt="" className="film-loader-ghost" />
            <div className="film-loader-bar-wrap">
              <div className="film-loader-bar" style={{ width: `${loadProgress}%` }} />
            </div>
          </div>
        )}

        {/* YouTube iframe — loads in background without autoplay, revealed after loader */}
        {film.youtubeId && (
          <iframe
            ref={iframeRef}
            className={`film-hero-iframe ${showYoutube ? "film-hero-iframe-visible" : ""}`}
            src={`https://www.youtube.com/embed/${film.youtubeId}?autoplay=0&rel=0&modestbranding=1&color=white&iv_load_policy=3&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={film.title}
          />
        )}

        {/* Fallback for films without YouTube */}
        {!film.youtubeId && (
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

        {/* X close button */}
        <button
          className={`film-close ${scrolled ? "film-close-hidden" : ""}`}
          onClick={() => navigateTo("/")}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Scroll indicator */}
        <div className={`film-scroll-indicator ${scrolled || !showYoutube ? "film-scroll-hidden" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M5 11l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* Editorial content below */}
      <section className="film-editorial">
        <div className="film-ed-title-block">
          <span className="film-ed-status">{film.status}</span>
          <h1 className="film-ed-title">{film.title}</h1>
          <p className="film-ed-tagline">{film.description}</p>
        </div>

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

        <div className="film-ed-divider" />

        <div className="film-ed-synopsis">
          <p>{film.synopsis}</p>
        </div>

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

        <div className="film-ed-divider" />

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

        <div className="film-ed-divider" />

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
