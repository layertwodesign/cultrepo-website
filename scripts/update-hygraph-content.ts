/**
 * One-off update for Hygraph content:
 * - AboutPage: new heroTitle, heroSubtitle, story, slimmer stats
 * - SiteSettings: new tagline
 * - TeamMember "Ida Bechtle": "She" -> "Ida" in bio
 * - Film "react": "humans" -> "people" in synopsis
 *
 * Idempotent — safe to re-run.
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

async function updateAboutPage() {
  const existing = await gql<{
    aboutPages: { id: string; stats: { id: string }[] }[];
  }>(`{
    aboutPages(first: 1, stage: DRAFT) {
      id
      stats { id }
    }
  }`);
  if (!existing.aboutPages.length) {
    console.log("No AboutPage found, skipping");
    return;
  }
  const aboutId = existing.aboutPages[0].id;
  const oldStatIds = existing.aboutPages[0].stats.map((s) => s.id);

  // Update text fields, delete old stats inline, create new
  await gql(
    `mutation Up($id: ID!, $data: AboutPageUpdateInput!) {
      updateAboutPage(where: { id: $id }, data: $data) { id }
    }`,
    {
      id: aboutId,
      data: {
        heroTitle: "Films about the people behind the systems we use every day.",
        heroSubtitle:
          "Feature-length documentaries, shorts, and video essays. A repository of the canonical stories of technology.",
        story:
          "Founded in 2018, Cult.Repo is an independent media company making cinematic documentaries about the people who build technology, with a special focus on open source software.\n\nWhat started as a single YouTube channel has grown into a small studio of filmmakers committed to the idea that technology has a human story worth telling.",
        stats: {
          delete: oldStatIds.map((id) => ({ id })),
          create: [
            { data: { value: 370, suffix: "K", decimals: 0, label: "YouTube Subscribers", channel: "YouTube" } },
            { data: { value: 20, suffix: "M", decimals: 0, label: "YouTube Views", channel: "YouTube" } },
          ],
        },
      },
    }
  );
  console.log(`✓ Replaced ${oldStatIds.length} stats with 2`);

  await gql(
    `mutation P($id: ID!) {
      publishAboutPage(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id: aboutId }
  );
  console.log("✓ AboutPage updated + published");
}

async function updateSiteSettings() {
  const existing = await gql<{ siteSettingsItems: { id: string }[] }>(
    `{ siteSettingsItems(first: 1, stage: DRAFT) { id } }`
  );
  if (!existing.siteSettingsItems.length) {
    console.log("No SiteSettings found, skipping");
    return;
  }
  const id = existing.siteSettingsItems[0].id;
  await gql(
    `mutation Up($id: ID!, $data: SiteSettingsUpdateInput!) {
      updateSiteSettings(where: { id: $id }, data: $data) { id }
    }`,
    {
      id,
      data: {
        tagline:
          "Independent documentaries about the people behind open source.",
      },
    }
  );
  await gql(
    `mutation P($id: ID!) {
      publishSiteSettings(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id }
  );
  console.log("✓ SiteSettings updated + published");
}

async function updateIdaBio() {
  const existing = await gql<{ teamMembers: { id: string; bio: string }[] }>(
    `{ teamMembers(where: { name_contains: "Ida" }, stage: DRAFT) { id bio } }`
  );
  const ida = existing.teamMembers[0];
  if (!ida) {
    console.log("No Ida team member, skipping");
    return;
  }
  // Replace standalone "She " (start-of-sentence pronoun) with "Ida ".
  // Only touch the documented case; preserve "human moment" etc.
  const newBio = ida.bio.replace(/(^|[\.\!\?]\s)She\s/g, "$1Ida ");
  if (newBio === ida.bio) {
    console.log("Ida bio already updated, skipping");
    return;
  }
  await gql(
    `mutation Up($id: ID!, $data: TeamMemberUpdateInput!) {
      updateTeamMember(where: { id: $id }, data: $data) { id }
    }`,
    { id: ida.id, data: { bio: newBio } }
  );
  await gql(
    `mutation P($id: ID!) {
      publishTeamMember(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id: ida.id }
  );
  console.log("✓ Ida bio updated + published");
}

async function updateFilmsHumans() {
  const existing = await gql<{
    films: { id: string; slug: string; synopsis: string | null }[];
  }>(`{
    films(stage: DRAFT, first: 200) { id slug synopsis }
  }`);
  let count = 0;
  for (const film of existing.films) {
    if (!film.synopsis) continue;
    if (!/humans/i.test(film.synopsis)) continue;
    const newSyn = film.synopsis.replace(/\bhumans\b/g, "people").replace(/\bHumans\b/g, "People");
    if (newSyn === film.synopsis) continue;
    await gql(
      `mutation Up($id: ID!, $data: FilmUpdateInput!) {
        updateFilm(where: { id: $id }, data: $data) { id }
      }`,
      { id: film.id, data: { synopsis: newSyn } }
    );
    await gql(
      `mutation P($id: ID!) {
        publishFilm(where: { id: $id }, to: PUBLISHED) { id }
      }`,
      { id: film.id }
    );
    count++;
    console.log(`  · ${film.slug}: humans → people`);
  }
  console.log(`✓ ${count} film synopsis(es) updated`);
}

async function main() {
  await updateAboutPage();
  await updateSiteSettings();
  await updateIdaBio();
  await updateFilmsHumans();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
