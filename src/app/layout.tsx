import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const interphases = localFont({
  src: [
    { path: "./fonts/TTInterphasesPro-Lt.ttf", weight: "300" },
    { path: "./fonts/TTInterphasesPro-Rg.ttf", weight: "400" },
    { path: "./fonts/TTInterphasesPro-Md.ttf", weight: "500" },
    { path: "./fonts/TTInterphasesPro-DmBd.ttf", weight: "600" },
    { path: "./fonts/TTInterphasesPro-Bd.ttf", weight: "700" },
  ],
  variable: "--font-interphases",
  display: "swap",
});

const interphasesMono = localFont({
  src: [
    { path: "./fonts/TTInterphasesProMono-Rg.ttf", weight: "400" },
    { path: "./fonts/TTInterphasesProMono-Bd.ttf", weight: "700" },
  ],
  variable: "--font-interphases-mono",
  display: "swap",
});

const SITE_TITLE =
  "CultRepo | Documenting the People Building World-Shaping Tech";
const SITE_DESCRIPTION =
  "CultRepo documents the people building world-shaping tech. Long-form films about the people behind open source, infrastructure, and emerging systems.";
const SITE_URL = "https://www.cultrepo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | CultRepo",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "CultRepo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@cultrepo",
    creator: "@cultrepo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interphases.variable} ${interphasesMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.google.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
