"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import TransitionLink from "./TransitionLink";
import CornerSquares from "./CornerSquares";
import MenuMarquee from "./MenuMarquee";
import { BlueskyIcon, InstagramIcon, XIcon, YouTubeIcon, YOUTUBE_URL } from "./SocialIcons";
import { films } from "@/lib/films";

const UnicornScene = dynamic(() => import("unicornstudio-react/next"), { ssr: false });

const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/films", label: "Films", match: (p: string) => p.startsWith("/films") },
  { href: "/about", label: "About", match: (p: string) => p === "/about" },
];

export default function Navigation() {
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

  const wordmarkVisible = open || (!isHome && !isFilm);

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
        className={`top-wordmark ${wordmarkVisible ? "visible" : ""} ${open ? "menu-active" : ""}`}
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

        <MenuMarquee items={marqueeItems} />

        <nav className="menu-cards">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                className={`menu-card ${active ? "active" : ""}`}
              >
                <CornerSquares />
                <span className="menu-card-title">{item.label}</span>
              </TransitionLink>
            );
          })}
        </nav>

        <div className="menu-actions">
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
                status === "ok"
                  ? "Thanks — check your inbox"
                  : status === "error"
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
          <div className="menu-cta-row">
            <TransitionLink href="/sponsorship" className="menu-cta menu-cta-primary">
              Sponsorship
            </TransitionLink>
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="menu-cta menu-cta-secondary">
              <span>Subscribe</span>
              <YouTubeIcon size={14} />
            </a>
          </div>
        </div>

        <div className="menu-footer">
          <span className="menu-footer-credit">Copyright 2026</span>

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
