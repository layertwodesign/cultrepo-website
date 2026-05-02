/**
 * Seeds the new Loom-promised fields with sensible defaults so the site doesn't
 * render empty strings the moment env vars switch the runtime to Hygraph.
 *
 * - AboutPage.ctaTitle / ctaSubtitle
 * - New SponsorshipPage record (heroCopy)
 *
 * Re-run safe — checks for existing values before writing.
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
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("\n"));
  if (!json.data) throw new Error("No data");
  await new Promise((r) => setTimeout(r, 120));
  return json.data;
}

async function patchAboutCta() {
  const existing = await gql<{ aboutPages: { id: string; ctaTitle: string | null }[] }>(
    `{ aboutPages(first: 1, stage: DRAFT) { id ctaTitle ctaSubtitle } }`
  );
  const ap = existing.aboutPages[0];
  if (!ap) {
    console.log("AboutPage missing — run scripts/seed-hygraph-singletons.ts first");
    return;
  }
  if (ap.ctaTitle) {
    console.log("AboutPage CTA already set, skipping");
    return;
  }
  await gql(
    `mutation U($id: ID!, $data: AboutPageUpdateInput!) {
      updateAboutPage(where: { id: $id }, data: $data) { id }
    }`,
    {
      id: ap.id,
      data: {
        ctaTitle: "Sponsor a film.",
        ctaSubtitle: "Reach builders, engineers, and technical leaders.",
      },
    }
  );
  await gql(
    `mutation Pub($id: ID!) { publishAboutPage(where: { id: $id }, to: PUBLISHED) { id } }`,
    { id: ap.id }
  );
  console.log("✓ AboutPage CTA defaults set");
}

async function ensureSponsorshipPage() {
  const existing = await gql<{ sponsorshipPages: { id: string }[] }>(
    `{ sponsorshipPages(first: 1, stage: DRAFT) { id } }`
  );
  if (existing.sponsorshipPages.length) {
    console.log("SponsorshipPage already exists, skipping");
    return;
  }
  await gql(
    `mutation Create($data: SponsorshipPageCreateInput!) {
      createSponsorshipPage(data: $data) { id }
    }`,
    {
      data: {
        heroCopy:
          "Our team is here to help shape a sponsorship that puts your story in front of builders, engineers, and technical leaders.",
        formRecipientEmail: "hello@cultrepo.com",
      },
    }
  );
  const created = await gql<{ sponsorshipPages: { id: string }[] }>(
    `{ sponsorshipPages(first: 1, stage: DRAFT) { id } }`
  );
  await gql(
    `mutation Pub($id: ID!) { publishSponsorshipPage(where: { id: $id }, to: PUBLISHED) { id } }`,
    { id: created.sponsorshipPages[0].id }
  );
  console.log("✓ SponsorshipPage created + published");
}

async function main() {
  await patchAboutCta();
  await ensureSponsorshipPage();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
