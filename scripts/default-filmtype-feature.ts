/**
 * Backfill all existing Hygraph films with filmType = Feature
 * (skips ones that already have a value). Run once after add-filmtype-field.ts.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

const API_URL =
  "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
if (!TOKEN) {
  console.error("Missing HYGRAPH_MIGRATION_TOKEN");
  process.exit(1);
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) {
      const msg = json.errors.map((e) => e.message).join("\n");
      if (/Too Many Requests/i.test(msg)) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1500));
        continue;
      }
      throw new Error(msg);
    }
    if (!json.data) throw new Error("No data returned");
    await new Promise((r) => setTimeout(r, 120));
    return json.data;
  }
  throw new Error("Too many retries");
}

async function main() {
  const existing = await gql<{
    films: { id: string; slug: string; filmType: string | null }[];
  }>(`{ films(stage: DRAFT, first: 200) { id slug filmType } }`);

  let count = 0;
  for (const f of existing.films) {
    if (f.filmType) continue;
    await gql(
      `mutation Up($id: ID!) {
        updateFilm(where: { id: $id }, data: { filmType: Feature }) { id }
      }`,
      { id: f.id }
    );
    await gql(
      `mutation P($id: ID!) {
        publishFilm(where: { id: $id }, to: PUBLISHED) { id }
      }`,
      { id: f.id }
    );
    console.log(`  · ${f.slug}: filmType = Feature`);
    count++;
  }
  console.log(`\n✓ ${count}/${existing.films.length} films defaulted to Feature.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
