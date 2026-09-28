/**
 * Rebuilds SiteSettings.homepageTicker from the films' real cast lists, so the
 * homepage names column only shows people who are featured in CultRepo films.
 * The original ticker was seeded with placeholder names (scripts/seed-ticker.ts).
 *
 * One row group per film (film title + up to PER_FILM people). People named in
 * the film's synopsis or description come first, in order of mention; the rest
 * follow in cast order.
 *
 * Writes the DRAFT stage only and never publishes. Existing ticker components
 * are updated in place and new ones appended, so nothing is deleted.
 *
 *   node --env-file=.env.local scripts/sync-ticker-from-cast.mjs          # dry run
 *   node --env-file=.env.local scripts/sync-ticker-from-cast.mjs --apply  # save draft
 *
 * Publish SiteSettings in Hygraph (or via publishSiteSettings) once approved.
 */

const API_URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const TOKEN = process.env.HYGRAPH_WRITE_TOKEN ?? process.env.HYGRAPH_MIGRATION_TOKEN;
const PER_FILM = 3;
const APPLY = process.argv.includes("--apply");

if (!TOKEN) {
  console.error("Missing HYGRAPH_WRITE_TOKEN (or HYGRAPH_MIGRATION_TOKEN) in .env.local");
  process.exit(1);
}

async function gql(query, variables) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("\n"));
  return json.data;
}

const fold = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function pickPeople(film) {
  const text = fold(`${film.synopsis ?? ""} ${film.description ?? ""}`);
  const names = [...new Set(film.cast.map((c) => c.name.trim()).filter(Boolean))];
  const mentioned = names
    .map((name) => ({ name, at: text.indexOf(fold(name)) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((m) => m.name);
  const rest = names.filter((n) => !mentioned.includes(n));
  return [...mentioned, ...rest].slice(0, PER_FILM);
}

const { films } = await gql(`{
  films(first: 200, orderBy: order_ASC, stage: DRAFT) {
    title slug synopsis description
    cast(first: 100) { name }
  }
}`);

const groups = films
  .map((f) => ({ name: f.title.trim(), people: pickPeople(f) }))
  .filter((g) => g.people.length > 0);

const { siteSettingsItems } = await gql(`{
  siteSettingsItems(first: 1, stage: DRAFT) { id homepageTicker(first: 100) { id name people } }
}`);
// Component lists default to the first 10 items, hence first: 100 above.
const settings = siteSettingsItems[0];
if (!settings) throw new Error("No SiteSettings entry found");
const existing = settings.homepageTicker ?? [];

if (existing.length > groups.length) {
  console.error(
    `Ticker has ${existing.length} groups but only ${groups.length} films have cast. ` +
      "Removing the extras is a deletion; do it by hand in Hygraph."
  );
  process.exit(1);
}

const update = existing.map((component, i) => ({
  where: { id: component.id },
  data: { name: groups[i].name, people: groups[i].people },
}));
const create = groups.slice(existing.length).map((g) => ({ data: g }));

console.log(`SiteSettings ${settings.id} (DRAFT)`);
existing.forEach((c, i) => {
  console.log(`  update ${c.id}: ${c.name} [${c.people.join(", ")}]`);
  console.log(`      -> ${groups[i].name} [${groups[i].people.join(", ")}]`);
});
create.forEach((c) => console.log(`  create: ${c.data.name} [${c.data.people.join(", ")}]`));
console.log(`${groups.length} films, ${groups.reduce((n, g) => n + g.people.length, 0)} names`);

if (!APPLY) {
  console.log("Dry run. Re-run with --apply to save the draft.");
  process.exit(0);
}

await gql(
  `mutation ($id: ID!, $data: SiteSettingsUpdateInput!) {
    updateSiteSettings(where: { id: $id }, data: $data) { id stage }
  }`,
  { id: settings.id, data: { homepageTicker: { update, create } } }
);
console.log("Saved to DRAFT. Not published.");
