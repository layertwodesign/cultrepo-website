/**
 * Find/replace "Cult.Repo" → "CultRepo" across all CMS-edited text fields.
 * Updates DRAFT records and republishes any that already had a published version.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const API_URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";

const FIND = /Cult\.Repo/g;
const REPLACE = "CultRepo";

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

type Patch = {
  type: string;
  id: string;
  label: string;
  data: Record<string, string>;
  publish: boolean;
};

const patches: Patch[] = [];

function maybeReplace(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  if (!FIND.test(value)) return null;
  FIND.lastIndex = 0;
  return value.replace(FIND, REPLACE);
}

function collect(
  type: string,
  id: string,
  label: string,
  fields: Record<string, string | null | undefined>,
  publish: boolean,
) {
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    const next = maybeReplace(v);
    if (next != null) data[k] = next;
  }
  if (Object.keys(data).length > 0) {
    patches.push({ type, id, label, data, publish });
  }
}

async function main() {
  // ---- AboutPage ----
  type APItem = {
    id: string;
    stage: string;
    heroTitle: string | null;
    heroSubtitle: string | null;
    story: string | null;
    ctaTitle: string | null;
    ctaSubtitle: string | null;
  };
  const ap = await gql<{ aboutPages: APItem[] }>(
    `{ aboutPages(stage: DRAFT, first: 5) { id stage heroTitle heroSubtitle story ctaTitle ctaSubtitle } }`,
  );
  for (const x of ap.aboutPages) {
    collect(
      "AboutPage",
      x.id,
      "AboutPage",
      {
        heroTitle: x.heroTitle,
        heroSubtitle: x.heroSubtitle,
        story: x.story,
        ctaTitle: x.ctaTitle,
        ctaSubtitle: x.ctaSubtitle,
      },
      true,
    );
  }

  // ---- SiteSettings ----
  type SS = { id: string; tagline: string | null };
  const ss = await gql<{ siteSettingsItems: SS[] }>(
    `{ siteSettingsItems(stage: DRAFT, first: 5) { id tagline } }`,
  );
  for (const x of ss.siteSettingsItems) {
    collect("SiteSettings", x.id, "SiteSettings", { tagline: x.tagline }, true);
  }

  // ---- SponsorshipPage ----
  type SP = {
    id: string;
    heroCopy: string | null;
    formTitle: string | null;
    formSuccessMessage: string | null;
  };
  const sp = await gql<{ sponsorshipPages: SP[] }>(
    `{ sponsorshipPages(stage: DRAFT, first: 5) { id heroCopy formTitle formSuccessMessage } }`,
  );
  for (const x of sp.sponsorshipPages) {
    collect(
      "SponsorshipPage",
      x.id,
      "SponsorshipPage",
      {
        heroCopy: x.heroCopy,
        formTitle: x.formTitle,
        formSuccessMessage: x.formSuccessMessage,
      },
      true,
    );
  }

  // ---- Films ----
  type F = {
    id: string;
    title: string | null;
    slug: string | null;
    description: string | null;
    synopsis: string | null;
  };
  const films = await gql<{ films: F[] }>(
    `{ films(stage: DRAFT, first: 200) { id title slug description synopsis } }`,
  );
  for (const x of films.films) {
    collect(
      "Film",
      x.id,
      `Film "${x.title ?? x.slug}"`,
      { title: x.title, description: x.description, synopsis: x.synopsis },
      true,
    );
  }

  // ---- Team Members ----
  type TM = { id: string; name: string | null; role: string | null; bio: string | null };
  const tm = await gql<{ teamMembers: TM[] }>(
    `{ teamMembers(stage: DRAFT, first: 100) { id name role bio } }`,
  );
  for (const x of tm.teamMembers) {
    collect(
      "TeamMember",
      x.id,
      `TeamMember "${x.name}"`,
      { name: x.name, role: x.role, bio: x.bio },
      true,
    );
  }

  if (patches.length === 0) {
    console.log("No occurrences of 'Cult.Repo' found in CMS content.");
    return;
  }

  console.log(`Found ${patches.length} record(s) to update:`);
  for (const p of patches) {
    console.log(`  - [${p.type}] ${p.label} → fields: ${Object.keys(p.data).join(", ")}`);
  }

  for (const p of patches) {
    const updateMutation = `mutation Up($id: ID!, $data: ${p.type}UpdateInput!) {
      update${p.type}(where: { id: $id }, data: $data) { id }
    }`;
    await gql(updateMutation, { id: p.id, data: p.data });

    if (p.publish) {
      const publishMutation = `mutation Pub($id: ID!) {
        publish${p.type}(where: { id: $id }, to: PUBLISHED) { id }
      }`;
      try {
        await gql(publishMutation, { id: p.id });
      } catch (e) {
        console.warn(`  ⚠ Publish failed for [${p.type}] ${p.label}:`, (e as Error).message);
      }
    }
    console.log(`  ✓ Updated [${p.type}] ${p.label}`);
  }

  console.log(`\nDone. Updated ${patches.length} record(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
