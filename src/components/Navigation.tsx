"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import TransitionLink from "./TransitionLink";
import { BlueskyIcon, InstagramIcon, XIcon, YouTubeIcon, YOUTUBE_URL } from "./SocialIcons";

const UnicornScene = dynamic(() => import("unicornstudio-react/next"), { ssr: false });

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
        {open ? (
          <div className="menu-unicorn" aria-hidden>
            <UnicornScene
              projectId="5jTAQ6ZayBHOM08TLJnb"
              sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.11/dist/unicornStudio.umd.js"
              width="100%"
              height="100%"
              production
            />
          </div>
        ) : null}

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
