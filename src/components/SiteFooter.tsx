"use client";

import { usePathname } from "next/navigation";
import { BlueskyIcon, InstagramIcon, XIcon, YouTubeIcon, YOUTUBE_URL } from "./SocialIcons";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="site-footer">
      <span className="site-footer-credit">&copy; 2026</span>

      <div className="site-footer-socials">
        <a href="https://bsky.app/profile/cultrepo.bsky.social" target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="Bluesky"><BlueskyIcon /></a>
        <a href="https://x.com/cultrepo" target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="X"><XIcon /></a>
        <a href="https://www.instagram.com/cult.repo" target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="Instagram"><InstagramIcon /></a>
        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="YouTube"><YouTubeIcon /></a>
      </div>

      <a href="https://layertwo.design" target="_blank" rel="noopener noreferrer" className="site-footer-credit site-footer-credit-link">Site by LayerTwo</a>
    </footer>
  );
}
