import type { Film } from "./films-data";

/** The director and producer shown on a film page (and in its structured data). */
export function filmCredits(film: Pick<Film, "crew" | "director">) {
  const director =
    film.crew.find((c) => /director(?! of)/i.test(c.role) && !/photography/i.test(c.role))?.name
    ?? (film.director || null);
  const producer = film.crew.find((c) => /producer/i.test(c.role))?.name ?? null;
  return { director, producer };
}
