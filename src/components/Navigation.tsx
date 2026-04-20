"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

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

  return (
    <>
      {/* Wordmark — hidden on home until intro triggers it via style injection */}
      <Link
        href="/"
        className={`top-wordmark ${isHome ? "" : "visible"}`}
        style={{ zIndex: 210 }}
      />

      {/* Hamburger — hidden on home until intro triggers it */}
      <button
        className={`hamburger ${isHome ? "" : "visible"} ${open ? "open" : ""}`}
        style={{ zIndex: 210 }}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>

      {/* Full-screen menu overlay */}
      <div className={`menu-overlay ${open ? "open" : ""}`}>
        <nav className="menu-nav">
          <Link href="/" className={`menu-link ${pathname === "/" ? "active" : ""}`}>
            Home
          </Link>
          <Link href="/films" className={`menu-link ${pathname.startsWith("/films") ? "active" : ""}`}>
            Films
          </Link>
          <Link href="/about" className={`menu-link ${pathname === "/about" ? "active" : ""}`}>
            About
          </Link>
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
