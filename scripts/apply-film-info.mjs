/**
 * One-shot content update from Josiah's film-info doc (July 2026).
 * https://docs.google.com/document/d/1CfsZLybq-hbEnwL9_AQ__X5QFD0v-mj8-ND7jb0w9x8
 *
 * Replaces placeholder cast/crew/duration/sponsors on the 7 released films
 * and rewrites the Vite + Kubernetes synopses. Headshot/still uploads are a
 * separate pass. Run with: node --env-file=.env.local scripts/apply-film-info.mjs
 */

const URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const TOKEN = process.env.HYGRAPH_READ_TOKEN;

async function gql(query, variables) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

const SPONSORS = [
  { slug: "voidzero", name: "Void(0)" },
  { slug: "sentry", name: "Sentry" },
  { slug: "boltnew", name: "Bolt.new" },
  { slug: "supabase", name: "Supabase" },
  { slug: "cncf", name: "Cloud Native Computing Foundation" },
  { slug: "honeypot", name: "Honeypot" },
  { slug: "chronosphere", name: "Chronosphere" },
];

const JOSIAH = "Josiah McGarvie";
const GUILLERMO = "Guillermo López";
const EMMA = "Emma Tracey";

const FILMS = [
  {
    slug: "vite",
    duration: "39 min",
    producer: GUILLERMO,
    sponsors: ["voidzero", "sentry", "shopify", "boltnew", "supabase"],
    synopsis:
      "Created by Evan You (the mind behind Vue.js), Vite began as a frustrated response to slow build times with Webpack. What started as a personal side project for Vue users quickly grew into a framework-agnostic ecosystem embraced by React, Svelte, Astro, Remix, and more. Along the way, it sparked rivalries, rewrites, and community-driven breakthroughs that changed the frontend landscape forever.",
    cast: [
      ["Evan You", "Creator of Vue.JS & Vite"],
      ["Matias Capeletto", "Vite Core Team"],
      ["Anthony Fu", "Vite Core Team"],
      ["Rich Harris", "Creator of Svelte"],
      ["Ryan Carniato", "Creator of Solid.JS"],
      ["Fred K. Schott", "Co-Creator of Snowpack & Astro"],
      ["Pedro Cattori", "Remix Core Team"],
      ["Mark Dalgleish", "Remix Core Team"],
      ["Miško Hevery", "Creator of Angular.JS & Qwik"],
      ["Eric Simons", "CEO at Bolt.new"],
      ["David Cramer", "Co-Founder & CPO at Sentry"],
      ["Theo Browne", "Streamer, Creator, Entrepreneur"],
      ["Bjorn Lu", "Vite Core Team"],
      ["Dominik Göpel", "Vite Core Team"],
      ["Vladimir Sheremet", "Vite Core Team"],
    ],
  },
  {
    slug: "kubernetes",
    duration: "56 min",
    producer: GUILLERMO,
    sponsors: ["google", "red-hat", "cncf"],
    synopsis: [
      "Inspired by the open source success of Docker in 2013 and seeing the need for innovation in the area of large-scale cloud computing, a handful of forward-thinking Google engineers set to work on the container orchestrator that would come to be known as Kubernetes – this new tool would forever change the way the internet is built.",
      "These engineers overcome technical challenges, resistance to open source from within, naysayers, and intense competition from other big players in the industry.",
      "Most engineers know about “The Container Orchestrator Wars” but most people would not be able to explain exactly what happened, and why it was Kubernetes that ultimately came out on top.",
      "This film captures the story directly from the people who lived it, featuring interviews with prominent engineers from Google, Red Hat, Twitter and others.",
    ].join("\n\n"),
    cast: [
      ["Arnaud Porterie", "SVP of Engineering at Vibe.co"],
      ["Brian Grant", "Co-creator of Kubernetes"],
      ["Chen Goldberg", "Executive Vice President at CoreWeave"],
      ["Chris Aniszczyk", "CTO at Cloud Native Computing Foundation"],
      ["Clayton Coleman", "Distinguished Engineer at Google"],
      ["Craig McLuckie", "Co-creator of Kubernetes"],
      ["Dawn Chen", "Software Engineer at Google"],
      ["Eric Brewer", "VP Infrastructure & Google Fellow"],
      ["Joe Beda", "Co-creator of Kubernetes"],
      ["Kelsey Hightower", "Distinguished Engineer at Google"],
      ["Sarah Novotny", "Startup Advisor"],
      ["Tim Hockin", "Co-creator of Kubernetes"],
      ["Ville Aikas", "Co-creator of Kubernetes"],
    ],
  },
  {
    slug: "graphql",
    duration: "28 min",
    producer: EMMA,
    sponsors: ["honeypot"],
    cast: [
      ["Dan Schafer", "Co-creator of GraphQL"],
      ["Nick Schrock", "Co-creator of GraphQL"],
      ["Lee Byron", "Co-creator of GraphQL"],
      ["Adam Miskiewicz", "Engineering Leadership at Airbnb"],
      ["Sasha Solomon", "Previously Staff Software Engineer, Tech Lead at Twitter"],
      ["Garrett Heinlen", "Staff Software Engineer at Netflix"],
      ["Kyle Mathews", "Co-founder at Electricsql"],
      ["Brooks Swinnerton", "Engineering Leader at Stripe"],
    ],
  },
  {
    slug: "elixir",
    duration: "13 min",
    producer: EMMA,
    sponsors: ["honeypot"],
    cast: [
      ["José Valim", "Creator of Elixir"],
      ["Stefan Kellner", "CEO at Kollex"],
      ["Chris McCord", "Staff Software Engineer at Fly.io"],
      ["Justin Schneck", "CTO at Peridio | Creator of Avocado Linux"],
      ["Martin Dobberstein", "Software Engineering Manager at Redcare Pharmacy"],
      ["Georgina McFadyen", "Contract Software Developer"],
      ["Evadne Wu", "Software Engineer"],
    ],
  },
  {
    slug: "vuejs",
    duration: "35 min",
    producer: EMMA,
    sponsors: ["honeypot"],
    cast: [
      ["Evan You", "Creator of Vue.JS & Vite"],
      ["Sarah Drasner", "Area Tech Lead, AI Web Ecosystem, Chrome"],
      ["Taylor Otwell", "Founder & CEO at Laravel"],
      ["Thorsten Lünborg", "Vue.js Core Team"],
      ["Scott Tolinski", "Co-Host of Syntax.fm"],
      ["Jinjiang Zhao", "Vue.js Core Team"],
      ["Gu Yilling", "Vue.js Core Team"],
    ],
  },
  {
    slug: "emberjs",
    duration: "25 min",
    producer: EMMA,
    sponsors: ["honeypot"],
    cast: [
      ["Tom Dale", "Co-creator of Ember.js"],
      ["Yehuda Katz", "Co-creator of Ember.js"],
      ["Leah Silber", "CEO at Tilde Inc"],
      ["Gavin Joyce", "Engineering Fin.ai, Founder Vidu"],
      ["Marco Otte-Witte", "Managing Director at Mainmatter"],
    ],
  },
  {
    slug: "prometheus",
    duration: "27 min",
    producer: GUILLERMO,
    sponsors: ["google", "honeypot", "cncf", "red-hat", "chronosphere"],
    cast: [
      ["Julius Volz", "Co-founder of Prometheus.io"],
      ["Matthias Rampke", "Distinguished Software Engineer at Palo Alto Networks"],
      ["Björn Rabenstein", "Software Engineer"],
      ["Priyanka Sharma", "Former Executive Director at CNCF"],
      ["Bartlomiej Plotka", "Senior Software Engineer at Google"],
      ["Richard Hartmann", "Office of the CTO at Grafana Labs"],
      ["Alexis Richardson", "CEO and CoFounder at ConfigHub"],
      ["Rob Skillington", "VP, Fellow at Palo Alto Networks"],
      ["Jaana Dogan", "Principal Engineer at Google"],
    ],
  },
];

async function upsertSponsors() {
  const { sponsors: existing } = await gql(`query { sponsors(first: 100) { id slug } }`);
  const bySlug = new Map(existing.map((s) => [s.slug, s.id]));
  for (const s of SPONSORS) {
    if (bySlug.has(s.slug)) continue;
    const data = await gql(
      `mutation ($name: String!, $slug: String!) { createSponsor(data: { name: $name, slug: $slug }) { id } }`,
      { name: s.name, slug: s.slug }
    );
    bySlug.set(s.slug, data.createSponsor.id);
    console.log(`created sponsor ${s.slug}`);
  }
  for (const s of SPONSORS) {
    await gql(`mutation ($id: ID!) { publishSponsor(where: { id: $id }, to: PUBLISHED) { id } }`, {
      id: bySlug.get(s.slug),
    });
  }
  return bySlug;
}

async function updateFilm(film, sponsorIdBySlug) {
  const { film: current } = await gql(
    `query ($slug: String!) { film(where: { slug: $slug }) { id cast { id } crew { id } } }`,
    { slug: film.slug }
  );
  if (!current) throw new Error(`film not found: ${film.slug}`);

  const data = {
    duration: film.duration,
    director: JOSIAH,
    ...(film.synopsis ? { synopsis: film.synopsis } : {}),
    cast: {
      delete: current.cast.map((c) => ({ id: c.id })),
      create: film.cast.map(([name, role]) => ({ data: { name, role } })),
    },
    crew: {
      delete: current.crew.map((c) => ({ id: c.id })),
      create: [
        { data: { name: JOSIAH, role: "Director" } },
        { data: { name: film.producer, role: "Producer" } },
      ],
    },
    sponsors: { set: film.sponsors.map((slug) => ({ id: sponsorIdBySlug.get(slug) })) },
  };

  await gql(
    `mutation ($id: ID!, $data: FilmUpdateInput!) { updateFilm(where: { id: $id }, data: $data) { id } }`,
    { id: current.id, data }
  );
  await gql(`mutation ($id: ID!) { publishFilm(where: { id: $id }, to: PUBLISHED) { id } }`, {
    id: current.id,
  });
  console.log(`updated + published ${film.slug}`);
}

const sponsorIds = await upsertSponsors();
for (const film of FILMS) await updateFilm(film, sponsorIds);
console.log("done");
