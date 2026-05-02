/**
 * Seed singleton content (AboutPage, SiteSettings) into Hygraph.
 * Idempotent — only creates if no record exists.
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

async function seedAboutPage() {
  const existing = await gql<{ aboutPages: { id: string }[] }>(
    `{ aboutPages(first: 1, stage: DRAFT) { id } }`
  );
  if (existing.aboutPages.length) {
    console.log("AboutPage already exists, skipping");
    return;
  }

  const sponsorSlugs = ["ibm", "redhat", "google", "jetbrains", "shopify"];
  const sponsors = await gql<{ sponsors: { id: string; slug: string }[] }>(
    `query S($slugs: [String!]!) {
      sponsors(where: { slug_in: $slugs }) { id slug }
    }`,
    { slugs: sponsorSlugs }
  );
  const sponsorIdsBySlug = new Map(sponsors.sponsors.map((s) => [s.slug, s.id]));
  const trustedByIds = sponsorSlugs
    .map((s) => sponsorIdsBySlug.get(s))
    .filter((x): x is string => Boolean(x));

  await gql(
    `mutation Create($data: AboutPageCreateInput!) {
      createAboutPage(data: $data) { id }
    }`,
    {
      data: {
        heroTitle: "Films about the humans behind the systems we use every day.",
        heroSubtitle:
          "Independent. Long-form. Made with the people who built the things, not about them.",
        story:
          "Founded in 2018 as Honeypot, Cult.Repo is an independent media platform telling the human stories behind technology — with a particular focus on the people who build and maintain open source.\n\nWhat started as a single YouTube channel has grown into a small studio of filmmakers chasing the stories that don't fit into a blog post or a release note.",
        stats: {
          create: [
            { value: 250, suffix: "K", decimals: 0, label: "YouTube Subscribers", channel: "YouTube" },
            { value: 15, suffix: "M", decimals: 0, label: "YouTube Views", channel: "YouTube" },
            { value: 5, suffix: "K", decimals: 0, label: "Instagram Followers", channel: "Instagram" },
            { value: 12.5, suffix: "K", decimals: 1, label: "X Followers", channel: "X" },
          ],
        },
        trustedBySponsors: { connect: trustedByIds.map((id) => ({ id })) },
      },
    }
  );

  // Publish — find the just-created record by querying again
  const created = await gql<{ aboutPages: { id: string }[] }>(
    `{ aboutPages(first: 1, stage: DRAFT) { id } }`
  );
  await gql(
    `mutation Pub($id: ID!) {
      publishAboutPage(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id: created.aboutPages[0].id }
  );
  console.log("✓ AboutPage created + published");
}

async function seedSiteSettings() {
  const existing = await gql<{ siteSettingsItems: { id: string }[] }>(
    `{ siteSettingsItems(first: 1, stage: DRAFT) { id } }`
  );
  if (existing.siteSettingsItems.length) {
    console.log("SiteSettings already exists, skipping");
    return;
  }
  await gql(
    `mutation Create($data: SiteSettingsCreateInput!) {
      createSiteSettings(data: $data) { id }
    }`,
    {
      data: {
        tagline:
          "Independent documentaries about the humans behind open source.",
        youtubeUrl: "https://www.youtube.com/@cultrepo?sub_confirmation=1",
        blueskyUrl: "https://bsky.app/profile/cultrepo.bsky.social",
        xUrl: "https://x.com/cultrepo",
        instagramUrl: "https://www.instagram.com/cult.repo",
        newsletterFormAction: "/api/newsletter",
      },
    }
  );
  const created = await gql<{ siteSettingsItems: { id: string }[] }>(
    `{ siteSettingsItems(first: 1, stage: DRAFT) { id } }`
  );
  await gql(
    `mutation Pub($id: ID!) {
      publishSiteSettings(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id: created.siteSettingsItems[0].id }
  );
  console.log("✓ SiteSettings created + published");
}

async function main() {
  await seedAboutPage();
  await seedSiteSettings();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
