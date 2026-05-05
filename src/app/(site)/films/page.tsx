import type { Metadata } from "next";
import { getFilms } from "@/lib/films";
import { getSiteSettings } from "@/lib/site-settings";
import { buildMetadata } from "@/lib/seo";
import TransitionLink from "@/components/TransitionLink";
import Reveal from "@/components/Reveal";

const STAGGER_MS = 80;
const GRID_COLS = 3;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata(
    settings.filmsListingSeo,
    settings.defaultSeo,
    {
      title: "Films",
      description:
        "Documentaries, shorts, and video essays from CultRepo — about the people building open source and modern technology.",
    },
    "/films"
  );
}

export default async function FilmsPage() {
  const films = await getFilms();
  return (
    <div className="page-container">
      <div className="films-content">
        <section className="films-header">
          <h1 className="films-title">Films</h1>
        </section>

        <div className="films-grid">
          {films.map((film, i) => {
            const row = Math.floor(i / GRID_COLS);
            const col = i % GRID_COLS;
            const delay = (row + col) * STAGGER_MS;
            return (
              <Reveal key={film.slug} delay={delay}>
                <TransitionLink
                  href={`/films/${film.slug}`}
                  className="film-card"
                >
                  <div className="film-card-video-wrap">
                    <video
                      src={film.video}
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                      className="film-card-video"
                    />
                    <div className="film-card-overlay" />
                  </div>
                  <div className="film-card-info">
                    <span className="film-card-title">{film.title}</span>
                    <span className="film-card-status">
                      {film.status === "Released" && film.year ? film.year : film.status}
                    </span>
                  </div>
                </TransitionLink>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
