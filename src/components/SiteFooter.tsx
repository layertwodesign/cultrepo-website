"use client";

import { usePathname } from "next/navigation";
import { BlueskyIcon, InstagramIcon, XIcon, YouTubeIcon } from "./SocialIcons";

type Props = {
  force?: boolean;
  blueskyUrl: string;
  xUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
};

export default function SiteFooter({ force = false, blueskyUrl, xUrl, instagramUrl, youtubeUrl }: Props) {
  const pathname = usePathname();
  if (!force && (pathname === "/" || pathname === "/about")) return null;

  return (
    <footer className="site-footer">
      <span className="site-footer-credit">&copy; 2026</span>

      <div className="site-footer-socials">
        <a href={blueskyUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="Bluesky"><BlueskyIcon /></a>
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="X"><XIcon /></a>
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="Instagram"><InstagramIcon /></a>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label="YouTube"><YouTubeIcon /></a>
      </div>

      <a href="https://layertwo.design" target="_blank" rel="noopener noreferrer" className="site-footer-credit site-footer-credit-link">Site by LayerTwo</a>
    </footer>
  );
}
