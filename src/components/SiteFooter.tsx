"use client";

import { usePathname } from "next/navigation";
import { sitePath } from "@/lib/site-path";
import { BlueskyIcon, InstagramIcon, XIcon, YouTubeIcon } from "./SocialIcons";

type Props = {
  force?: boolean;
  blueskyUrl: string;
  xUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
};

export default function SiteFooter({ force = false, blueskyUrl, xUrl, instagramUrl, youtubeUrl }: Props) {
  const pathname = sitePath(usePathname());
  if (!force && (pathname === "/" || pathname === "/about")) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer-socials">
        <a href={blueskyUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="Bluesky"><BlueskyIcon size={22} /></a>
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="X"><XIcon size={22} /></a>
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="Instagram"><InstagramIcon size={22} /></a>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="YouTube"><YouTubeIcon size={22} /></a>
      </div>

      <div className="site-footer-meta">
        <span className="site-footer-credit">&copy; 2026</span>
      </div>
    </footer>
  );
}
