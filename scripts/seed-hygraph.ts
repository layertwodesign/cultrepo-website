/**
 * One-shot migration: pushes the local hardcoded data in src/lib/films-data.ts
 * (and the local team list) up to Hygraph via the Management API.
 *
 * Idempotent — looks up existing records by slug/email and updates them in
 * place rather than creating duplicates. Safe to re-run.
 *
 * Usage:
 *   pnpm tsx scripts/seed-hygraph.ts
 *
 * Required env (loaded from .env.local):
 *   HYGRAPH_API_URL          — content endpoint (the script uses this for mutations too)
 *   HYGRAPH_MIGRATION_TOKEN  — Permanent Auth Token with Read+Mutate on `master` stage
 *
 * Notes:
 * - Status enum is normalized: "Post-Production" → "PostProduction" etc.
 * - Assets (poster, video, stills, photo) are NOT uploaded — set them manually
 *   in the Hygraph dashboard after the seed, or extend this script to use the
 *   Hygraph asset upload API.
 * - Sponsors are upserted by name and referenced from films.
 */

import { films as localFilms } from "../src/lib/films-data";

const API_URL = process.env.HYGRAPH_API_URL;
const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN;

if (!API_URL || !TOKEN) {
  console.error(
    "Missing HYGRAPH_API_URL or HYGRAPH_MIGRATION_TOKEN. Add them to .env.local."
  );
  process.exit(1);
}

const localTeam = [
  {
    name: "Emma Tracey",
    role: "CEO",
    bio: "Serial founder who started her career as a journalist and never stopped chasing stories. A long-time open source advocate, Emma cares about getting recognition into the hands of the people quietly maintaining the systems everyone else depends on.",
    email: "emma@cultrepo.com",
    order: 0,
  },
  {
    name: "Josiah McGarvie",
    role: "Filmmaker",
    bio: "Australian filmmaker, eight years deep in tech documentaries. Co-founded the original YouTube channel with Emma and assembled the team behind films on Kubernetes, Vue.js, GraphQL, Elixir, Vite, Argo, eBPF, PyTorch, Envoy, Prometheus, and Ember.js.",
    email: "josiah@cultrepo.com",
    order: 1,
  },
  {
    name: "Ida Bechtle",
    role: "Filmmaker",
    bio: "Joined when the YouTube channel was barely a channel. She has been a quiet engine behind its growth, with a knack for finding the human moment inside a technical story. Off-set: cats, puzzles, and a strong opinion about coffee.",
    email: "ida@cultrepo.com",
    order: 2,
  },
  {
    name: "Guillermo Lopez",
    role: "Filmmaker",
    bio: "Filmmaker and producer who came up in advertising before turning fully to tech documentaries. Brings a sharper narrative spine to production. Credits include Kubernetes, Prometheus, Angular, Vite, TypeScript, the Investors Masterclass, and various minidocs.",
    email: "guillermo@cultrepo.com",
    order: 3,
  },
];

const STATUS_TO_ENUM: Record<string, string> = {
  Released: "Released",
  "Post-Production": "PostProduction",
  "In Production": "InProduction",
  Filming: "Filming",
  "Pre-Production": "PreProduction",
  "Coming Soon": "ComingSoon",
  Fundraising: "Fundraising",
};

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("\n"));
  }
  if (!json.data) throw new Error("No data returned");
  return json.data;
}

async function upsertSponsor(name: string): Promise<{ id: string }> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const data = await gql<{ upsertSponsor: { id: string } }>(
    `mutation Upsert($slug: String!, $name: String!) {
      upsertSponsor(
        where: { slug: $slug }
        upsert: {
          create: { slug: $slug, name: $name }
          update: { name: $name }
        }
      ) { id }
    }`,
    { slug, name }
  );
  return data.upsertSponsor;
}

async function upsertFilm(film: typeof localFilms[number], order: number, sponsorIds: string[]) {
  const status = STATUS_TO_ENUM[film.status] ?? "Released";
  const baseFields = {
    title: film.title,
    slug: film.slug,
    status,
    description: film.description,
    synopsis: film.synopsis,
    year: film.year,
    duration: film.duration,
    director: film.director,
    youtubeId: film.youtubeId,
    technologies: { set: film.technologies },
    cast: { create: film.cast.map((c) => ({ name: c.name, role: c.role })) },
    crew: { create: film.crew.map((c) => ({ name: c.name, role: c.role })) },
    extras: { create: film.extras.map((e) => ({ title: e.title, youtubeId: e.youtubeId })) },
    timeline: { create: film.timeline.map((t) => ({ label: t.label, done: t.done })) },
    fundraisingGoal: film.fundraising?.goal ?? null,
    fundraisingRaised: film.fundraising?.raised ?? null,
    order,
    sponsors: { connect: sponsorIds.map((id) => ({ id })) },
  };

  await gql(
    `mutation Upsert($slug: String!, $create: FilmCreateInput!, $update: FilmUpdateInput!) {
      upsertFilm(where: { slug: $slug }, upsert: { create: $create, update: $update }) {
        id
      }
    }`,
    {
      slug: film.slug,
      create: baseFields,
      // For update we can't recreate components — clear and recreate is simplest:
      update: {
        ...baseFields,
        cast: { deleteAll: true, create: film.cast.map((c) => ({ name: c.name, role: c.role })) },
        crew: { deleteAll: true, create: film.crew.map((c) => ({ name: c.name, role: c.role })) },
        extras: { deleteAll: true, create: film.extras.map((e) => ({ title: e.title, youtubeId: e.youtubeId })) },
        timeline: { deleteAll: true, create: film.timeline.map((t) => ({ label: t.label, done: t.done })) },
        sponsors: { set: sponsorIds.map((id) => ({ id })) },
      },
    }
  );

  await gql(
    `mutation Pub($slug: String!) {
      publishFilm(where: { slug: $slug }, to: PUBLISHED) { id }
    }`,
    { slug: film.slug }
  );
}

async function upsertTeamMember(m: typeof localTeam[number]) {
  await gql(
    `mutation Upsert($email: String!, $create: TeamMemberCreateInput!, $update: TeamMemberUpdateInput!) {
      upsertTeamMember(where: { email: $email }, upsert: { create: $create, update: $update }) { id }
    }`,
    {
      email: m.email,
      create: { ...m },
      update: { name: m.name, role: m.role, bio: m.bio, order: m.order },
    }
  );
  await gql(
    `mutation Pub($email: String!) {
      publishTeamMember(where: { email: $email }, to: PUBLISHED) { id }
    }`,
    { email: m.email }
  );
}

async function main() {
  console.log("Seeding sponsors…");
  const sponsorNames = new Set<string>();
  for (const f of localFilms) for (const s of f.sponsors) sponsorNames.add(s.name);
  const sponsorIdByName = new Map<string, string>();
  for (const name of sponsorNames) {
    const { id } = await upsertSponsor(name);
    sponsorIdByName.set(name, id);
    console.log(`  ✓ ${name}`);
  }

  console.log("\nSeeding films…");
  for (let i = 0; i < localFilms.length; i++) {
    const film = localFilms[i];
    const sponsorIds = film.sponsors
      .map((s) => sponsorIdByName.get(s.name))
      .filter((x): x is string => Boolean(x));
    await upsertFilm(film, i, sponsorIds);
    console.log(`  ✓ ${film.title}`);
  }

  console.log("\nSeeding team members…");
  for (const m of localTeam) {
    await upsertTeamMember(m);
    console.log(`  ✓ ${m.name}`);
  }

  console.log(`
Done.

Next:
  1. Open the Hygraph dashboard and confirm everything looks right.
  2. Upload posters, video clips, stills, and team photos manually
     (or extend this script with the Hygraph asset upload API).
  3. Add HYGRAPH_API_URL (and optionally HYGRAPH_READ_TOKEN) to Vercel
     project env vars and redeploy — the site flips to CMS-backed reads
     automatically.
  4. Wire the Hygraph webhook to /api/revalidate.
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
