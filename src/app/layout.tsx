import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { PageTransitionProvider } from "@/components/PageTransition";
import SmoothScroll from "@/components/SmoothScroll";

const interphases = localFont({
  src: [
    { path: "./fonts/TTInterphasesPro-Lt.ttf", weight: "300" },
    { path: "./fonts/TTInterphasesPro-Rg.ttf", weight: "400" },
    { path: "./fonts/TTInterphasesPro-Md.ttf", weight: "500" },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interphases.variable} ${interphasesMono.variable}`}>
      <body>
        <PageTransitionProvider>
          <SmoothScroll />
          <Navigation />
          {children}
          <div className="film-grain" />
        </PageTransitionProvider>
      </body>
    </html>
  );
}
