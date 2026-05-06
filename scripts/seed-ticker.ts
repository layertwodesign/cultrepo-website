/**
 * Seed SiteSettings.homepageTicker with the current hardcoded ticker data,
 * grouped by tech.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const API_URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";

const flat = [
  ["GraphQL", "Arnulfo Bayer"], ["Vue.js", "Brigitte Jast"], ["Kubernetes", "Jontae Heaney"],
  ["Prometheus", "Karelle Tromp"], ["React.js", "Eli Wisoky"], ["Ruby on Rails", "Doug Crona"],
  ["Node.js", "Kenzie Lesch"], ["Angular", "Ford Schmeler"], ["Python", "Maverick Botsford"],
  ["Vite", "Jaquan Grady"], ["Elixir", "Jayson Crona"], ["Ember.js", "Adrienne Jast"],
  ["GraphQL", "Jayson Heaney"], ["Vue.js", "Lucious Tromp"], ["Kubernetes", "Shea Trantow"],
  ["Prometheus", "Randy Wisoky"], ["React.js", "Newell Crona"], ["Ruby on Rails", "Kyeesha Bayer"],
  ["Node.js", "Newell Rohan"], ["Angular", "Eusebio Lesch"], ["Python", "Arnulfo Jast"],
  ["Vite", "Brigitte Crona"], ["Elixir", "Breana Beier"], ["Ember.js", "Jontae Rohan"],
  ["GraphQL", "Karelle Beier"], ["Vue.js", "Eli Lesch"], ["Kubernetes", "Eusebio Rohan"],
  ["Prometheus", "Doug Beier"], ["React.js", "Kyeesha Lesch"], ["Ruby on Rails", "Eusebio Crona"],
];

// Preserve first-appearance order of techs
const techOrder: string[] = [];
const grouped = new Map<string, string[]>();
for (const [tech, person] of flat) {
  if (!grouped.has(tech)) {
    grouped.set(tech, []);
    techOrder.push(tech);
  }
  grouped.get(tech)!.push(person);
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("\n"));
  if (!json.data) throw new Error("No data");
  return json.data;
}

async function main() {
  const existing = await gql<{ siteSettingsItems: { id: string }[] }>(
    `{ siteSettingsItems(first: 1, stage: DRAFT) { id } }`
  );
  const id = existing.siteSettingsItems[0]?.id;
  if (!id) {
    console.error("No SiteSettings record found");
    process.exit(1);
  }

  const create = techOrder.map((tech) => ({
    data: { name: tech, people: grouped.get(tech)! },
  }));

  await gql(
    `mutation Up($id: ID!, $data: SiteSettingsUpdateInput!) {
      updateSiteSettings(where: { id: $id }, data: $data) { id }
    }`,
    { id, data: { homepageTicker: { create } } }
  );
  await gql(
    `mutation P($id: ID!) {
      publishSiteSettings(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id }
  );
  console.log(`✓ Seeded ${create.length} ticker techs (${flat.length} total people).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
