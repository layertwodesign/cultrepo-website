import Navigation from "@/components/Navigation";
import SiteFooter from "@/components/SiteFooter";
import { PageTransitionProvider } from "@/components/PageTransition";
import { NavVisibilityProvider } from "@/components/NavVisibility";
import SmoothScroll from "@/components/SmoothScroll";
import RulerParallax from "@/components/RulerParallax";
import UnicornBackground from "@/components/UnicornBackground";
import { getFilms } from "@/lib/films";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const films = await getFilms();
  const navFilms = films.map((f) => ({ title: f.title, slug: f.slug }));
  return (
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
  );
}
