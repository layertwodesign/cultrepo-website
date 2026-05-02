import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/components/Navigation";
import SiteFooter from "@/components/SiteFooter";
import { PageTransitionProvider } from "@/components/PageTransition";
import { NavVisibilityProvider } from "@/components/NavVisibility";
import SmoothScroll from "@/components/SmoothScroll";
import RulerParallax from "@/components/RulerParallax";
import UnicornBackground from "@/components/UnicornBackground";
import { getFilms } from "@/lib/films";

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

export const metadata: Metadata = {
  title: "CultRepo | Cinematic Documentaries About the Humans Shaping Technology",
  description:
    "CultRepo creates cinematic documentaries about the humans shaping technology. Long-form films about the people behind open source, infrastructure, and emerging systems.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const films = await getFilms();
  const navFilms = films.map((f) => ({ title: f.title, slug: f.slug }));
  return (
    <html lang="en" className={`${interphases.variable} ${interphasesMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.google.com" />
      </head>
      <body>
        <NavVisibilityProvider>
          <PageTransitionProvider>
            <SmoothScroll />
            <RulerParallax />
            <UnicornBackground />
            <Navigation films={navFilms} />
            <div className="camera-ruler camera-ruler-left" />
            <div className="camera-ruler camera-ruler-right" />
            {children}
            <SiteFooter />
            <div className="film-grain" />
          </PageTransitionProvider>
        </NavVisibilityProvider>
      </body>
    </html>
  );
}
