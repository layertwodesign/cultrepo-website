"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "./TransitionLink";
import { useNavVisibility } from "./NavVisibility";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { hidden } = useNavVisibility();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // When nav is hidden (film page top), don't render the nav bar
  // but always keep the menu overlay accessible
  const navVisible = !hidden && !isHome;
  const navVisibleHome = !hidden && isHome;

  return (
    <>
      {/* Nav bar with gradient backdrop */}
      <div className={`nav-bar ${hidden ? "nav-hidden" : ""} ${navVisible || open ? "nav-scrolled" : ""}`}>
        {/* Wordmark */}
        <TransitionLink
          href="/"
          className={`top-wordmark ${!hidden && !navVisibleHome ? "visible" : ""}`}
        />

        {/* Hamburger — hidden when nav is hidden (film page hero) */}
        <button
          className={`hamburger ${!hidden && !navVisibleHome ? "visible" : ""} ${open ? "open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
        </button>
      </div>

      {/* Full-screen menu overlay */}
      <div className={`menu-overlay ${open ? "open" : ""}`}>
        {/* Close button inside menu */}
        <button
          className="menu-close"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <nav className="menu-nav">
          <TransitionLink href="/" className={`menu-link ${pathname === "/" ? "active" : ""}`}>
            Home
          </TransitionLink>
          <TransitionLink href="/films" className={`menu-link ${pathname.startsWith("/films") ? "active" : ""}`}>
            Films
          </TransitionLink>
          <TransitionLink href="/about" className={`menu-link ${pathname === "/about" ? "active" : ""}`}>
            About
          </TransitionLink>
        </nav>
        <div className="menu-footer">
          <a href="https://youtube.com/@cultrepo" target="_blank" rel="noopener noreferrer" className="menu-footer-link">YouTube</a>
          <a href="https://twitter.com/cultrepo" target="_blank" rel="noopener noreferrer" className="menu-footer-link">Twitter</a>
          <a href="mailto:emma@cultrepo.com" className="menu-footer-link">Contact</a>
        </div>
      </div>
    </>
  );
}
