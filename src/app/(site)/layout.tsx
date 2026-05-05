import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Navigation from "@/components/Navigation";
import SiteFooter from "@/components/SiteFooter";
import { PageTransitionProvider } from "@/components/PageTransition";
import { NavVisibilityProvider } from "@/components/NavVisibility";
import SmoothScroll from "@/components/SmoothScroll";
import RulerParallax from "@/components/RulerParallax";
import UnicornBackground from "@/components/UnicornBackground";
import { getFilms } from "@/lib/films";
import { getSiteSettings } from "@/lib/site-settings";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [films, settings] = await Promise.all([getFilms(), getSiteSettings()]);
  const navFilms = films.map((f) => ({ title: f.title, slug: f.slug }));
  const socials = {
    blueskyUrl: settings.blueskyUrl,
    xUrl: settings.xUrl,
    instagramUrl: settings.instagramUrl,
    youtubeUrl: settings.youtubeUrl,
  };
  return (
    <NavVisibilityProvider>
      <PageTransitionProvider>
        <SmoothScroll />
        <RulerParallax />
        <UnicornBackground />
        <Navigation films={navFilms} {...socials} />
        <div className="camera-ruler camera-ruler-left" />
        <div className="camera-ruler camera-ruler-right" />
        {children}
        <SiteFooter {...socials} />
        <div className="film-grain" />
        {/* Vercel-native analytics — Speed Insights uses Core Web Vitals,
            Web Analytics counts visits per route. */}
        <Analytics />
        <SpeedInsights />
        {/* GA4 — same property used on the legacy cultrepo.com so historical
            data stays continuous. */}
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </PageTransitionProvider>
    </NavVisibilityProvider>
  );
}
