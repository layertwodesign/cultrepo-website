"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";

const YOUTUBE_URL = "https://www.youtube.com/@cultrepo?sub_confirmation=1";

function YouTubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function BlueskyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 600 530" fill="currentColor" aria-hidden="true">
      <path d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.26 8.009 590-19.474 590 69.21c0 17.7-10.154 148.64-16.111 169.92-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.45-163.25-81.433C20.155 217.85 10 86.91 10 69.21c0-88.685 77.742-61.2 125.72-25.18z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isFilm = pathname.startsWith("/films/") && pathname !== "/films";

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const wordmarkVisible = open || (!isHome && !isFilm);

  return (
    <>
      {/* Wordmark — hidden on homepage and film pages, but visible while menu is open */}
      <TransitionLink
        href="/"
        className={`top-wordmark ${wordmarkVisible ? "visible" : ""} ${open ? "menu-active" : ""}`}
        style={{ zIndex: 210 }}
      />

      {/* Hamburger — always visible */}
      <button
        className={`hamburger visible ${open ? "open" : ""}`}
        style={{ zIndex: 10000 }}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>

      {/* Full-screen menu overlay */}
      <div className={`menu-overlay ${open ? "open" : ""}`}>
        <button className="menu-close" aria-label="Close menu" onClick={() => setOpen(false)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <nav className="menu-nav">
          <TransitionLink href="/" className={`menu-link ${pathname === "/" ? "active" : ""}`}>Home</TransitionLink>
          <TransitionLink href="/films" className={`menu-link ${pathname.startsWith("/films") ? "active" : ""}`}>Films</TransitionLink>
          <TransitionLink href="/about" className={`menu-link ${pathname === "/about" ? "active" : ""}`}>About</TransitionLink>
        </nav>

        <div className="menu-cta-row">
          <TransitionLink href="/sponsorship" className="menu-cta menu-cta-primary">
            Sponsorship
          </TransitionLink>
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="menu-cta menu-cta-secondary">
            <span>Subscribe</span>
            <YouTubeIcon size={14} />
          </a>
        </div>

        <div className="menu-footer">
          <span className="menu-footer-credit">&copy; 2026</span>

          <div className="menu-socials">
            <a href="https://bsky.app/profile/cultrepo.bsky.social" target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="Bluesky"><BlueskyIcon /></a>
            <a href="https://x.com/cultrepo" target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="X"><XIcon /></a>
            <a href="https://www.instagram.com/cult.repo" target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="Instagram"><InstagramIcon /></a>
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="menu-social" aria-label="YouTube"><YouTubeIcon /></a>
          </div>

          <a href="https://layertwo.design" target="_blank" rel="noopener noreferrer" className="menu-footer-credit menu-footer-credit-link">Site by LayerTwo</a>
        </div>
      </div>
    </>
  );
}
