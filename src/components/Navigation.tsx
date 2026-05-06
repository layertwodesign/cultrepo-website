"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";
import CornerSquares from "./CornerSquares";
import MenuMarquee from "./MenuMarquee";
import UnicornBackground from "./UnicornBackground";
import { BlueskyIcon, InstagramIcon, XIcon, YouTubeIcon } from "./SocialIcons";
import type { Film } from "@/lib/films";

const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/films", label: "Films", match: (p: string) => p === "/films" },
  { href: "/about", label: "About", match: (p: string) => p === "/about" },
];

type Props = {
  films: Pick<Film, "title" | "slug">[];
  blueskyUrl: string;
  xUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
};

export default function Navigation({ films, blueskyUrl, xUrl, instagramUrl, youtubeUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isFilm = pathname.startsWith("/films/") && pathname !== "/films";

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // On film pages: hidden on desktop (sidebar carries the brand), but shown
  // on mobile (where the sidebar is gone). Handled by a CSS rule below.
  const wordmarkVisible = open || !isHome;

  // Marquee strip — film titles, repeated for seamless scroll
  const marqueeItems = [...films, ...films].map((f, i) => (
    <TransitionLink
      key={`${f.slug}-${i}`}
      href={`/films/${f.slug}`}
      className="menu-marquee-item"
    >
      {f.title}
    </TransitionLink>
  ));

  return (
    <>
      <TransitionLink
        href="/"
        className={`top-wordmark ${wordmarkVisible ? "visible" : ""} ${open ? "menu-active" : ""} ${isFilm ? "on-film" : ""}`}
        style={{ zIndex: 210 }}
      />

      <button
        className={`hamburger visible ${open ? "open" : ""}`}
        style={{ zIndex: 10000 }}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>

      <div className={`menu-overlay ${open ? "open" : ""}`}>
        {open ? <UnicornBackground className="menu-unicorn" /> : null}

        <MenuMarquee items={marqueeItems} />

        <nav className="menu-cards">
          {NAV.map((item) => {
            const active = item.match(pathname);
            if (active) {
              return (
                <button
                  type="button"
                  key={item.href}
                  className="menu-card active"
                  onClick={() => setOpen(false)}
                >
                  <CornerSquares />
                  <span className="menu-card-title">
                    <span className="menu-card-title-track">
                      <span className="menu-card-title-line">{item.label}</span>
                      <span className="menu-card-title-line" aria-hidden>{item.label}</span>
                    </span>
                  </span>
                </button>
              );
            }
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                className="menu-card"
              >
                <CornerSquares />
                <span className="menu-card-title">
                  <span className="menu-card-title-track">
                    <span className="menu-card-title-line">{item.label}</span>
                    <span className="menu-card-title-line" aria-hidden>{item.label}</span>
                  </span>
                </span>
              </TransitionLink>
            );
          })}
        </nav>

        <div className="menu-actions">
          {status === "ok" ? (
            <div className="menu-email-success" role="status" aria-live="polite">
              <span className="menu-email-success-check" aria-hidden>✓</span>
              <div className="menu-email-success-text">
                <span className="menu-email-success-title">You&rsquo;re in</span>
                <span className="menu-email-success-sub">Check your inbox to confirm</span>
              </div>
              <button
                type="button"
                className="menu-email-success-dismiss"
                onClick={() => setStatus("idle")}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ) : (
            <form
              className="menu-email"
              onSubmit={async (e) => {
                e.preventDefault();
                if (status === "loading") return;
                setStatus("loading");
                try {
                  const res = await fetch("/api/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  if (!res.ok) throw new Error("failed");
                  setStatus("ok");
                  setEmail("");
                } catch {
                  setStatus("error");
                }
              }}
            >
              <input
                type="email"
                required
                placeholder={
                  status === "error"
                    ? "Something went wrong, try again"
                    : "Enter email"
                }
                className="menu-email-input"
                aria-label="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== "idle" && status !== "loading") setStatus("idle");
                }}
                disabled={status === "loading"}
              />
              <button type="submit" className="menu-email-submit" disabled={status === "loading"}>
                {status === "loading" ? "Joining…" : "Join our email list"}
              </button>
            </form>
          )}
          <div className="menu-cta-row">
            <TransitionLink href="/sponsorship" className="menu-cta menu-cta-primary">
              Sponsorship
            </TransitionLink>
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="menu-cta menu-cta-secondary">
              <span>Subscribe</span>
              <YouTubeIcon size={14} />
            </a>
          </div>
        </div>

        <div className="menu-footer">
          <span className="menu-footer-credit">&copy; 2026</span>

          <div className="menu-socials">
            <a href={blueskyUrl} target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="Bluesky"><BlueskyIcon /></a>
            <a href={xUrl} target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="X"><XIcon /></a>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="Instagram"><InstagramIcon /></a>
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="YouTube"><YouTubeIcon /></a>
          </div>

          <a href="https://layertwo.design" target="_blank" rel="noopener noreferrer" className="menu-footer-credit menu-footer-credit-link">Site by LayerTwo</a>
        </div>
      </div>
    </>
  );
}
