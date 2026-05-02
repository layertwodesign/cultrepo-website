/**
 * Schema migration: add fields promised in the project Loom but not yet in Hygraph.
 *
 *  • SiteSettings.featuredFilm   — relation to Film, picks the homepage center video
 *  • FilmCastMember.photo        — asset relation, headshot for the film page
 *  • AboutPage.ctaTitle          — string, "Sponsor a film." style headline
 *  • AboutPage.ctaSubtitle       — string, supporting copy
 *  • SponsorshipPage             — new singleton model (heroCopy + formRecipientEmail)
 *
 * Submits all changes in one batch via submitBatchChanges. Re-running fails
 * Hygraph rejects re-creating things that already exist; remove the model/
 * field in the dashboard if you need to re-run.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN;
const MGMT_URL = "https://management-us-west-2.hygraph.com/graphql";
const ENVIRONMENT_ID = "36af04adedeb412fa3759e8b2b1fe9eb";

if (!TOKEN) {
  console.error("Missing HYGRAPH_MIGRATION_TOKEN in .env.local");
  process.exit(1);
}

type Change = Record<string, unknown>;
const changes: Change[] = [];

// SiteSettings.featuredFilm — relation to Film
changes.push({
  createRelationalField: {
    modelApiId: "SiteSettings",
    apiId: "featuredFilm",
    displayName: "Featured Film",
    description: "The film that takes center stage on the homepage carousel.",
    type: "RELATION",
    isList: false,
    reverseField: {
      modelApiId: "Film",
      apiId: "featuredOnSiteSettings",
      displayName: "Featured On Site Settings",
      isList: true,
      isHidden: true,
      isUnidirectional: true,
    },
  },
});

// FilmCastMember.photo — asset relation
changes.push({
  createRelationalField: {
    parentApiId: "FilmCastMember",
    apiId: "photo",
    displayName: "Photo",
    description: "Headshot shown on the film page.",
    type: "ASSET",
    isList: false,
    reverseField: {
      modelApiId: "Asset",
      apiId: "filmCastMembersPhoto",
      displayName: "Film Cast Member Photos",
      isList: true,
    },
  },
});

// AboutPage CTA copy
changes.push({
  createSimpleField: {
    modelApiId: "AboutPage",
    apiId: "ctaTitle",
    displayName: "CTA Title",
    description: "Headline of the bottom 'Sponsor a film' block.",
    type: "STRING",
  },
});
changes.push({
  createSimpleField: {
    modelApiId: "AboutPage",
    apiId: "ctaSubtitle",
    displayName: "CTA Subtitle",
    description: "Sub copy under the CTA headline.",
    type: "STRING",
  },
});

// SponsorshipPage singleton-by-convention
changes.push({
  createModel: {
    apiId: "SponsorshipPage",
    apiIdPlural: "SponsorshipPages",
    displayName: "Sponsorship Page",
  },
});
changes.push({
  createSimpleField: {
    modelApiId: "SponsorshipPage",
    apiId: "heroCopy",
    displayName: "Hero Copy",
    description: "The body sentence on the sponsorship page.",
    type: "STRING",
  },
});
changes.push({
  createSimpleField: {
    modelApiId: "SponsorshipPage",
    apiId: "formRecipientEmail",
    displayName: "Form Recipient Email",
    description: "Where sponsorship form submissions are forwarded.",
    type: "STRING",
  },
});

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(MGMT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("\n"));
  if (!json.data) throw new Error("No data returned");
  return json.data;
}

async function pollMigration(id: string) {
  for (let i = 0; i < 60; i++) {
    const data = await gql<{
      viewer: { project: { environment: { migration: { status: string; errors: string | null } } } };
    }>(
      `query M($envId: ID!, $id: ID!) {
        viewer { ... on TokenViewer {
          project { environment(id: $envId) { migration(id: $id) { status errors } } }
        }}
      }`,
      { envId: ENVIRONMENT_ID, id }
    );
    const m = data.viewer.project.environment.migration;
    if (m.status === "SUCCESS") return;
    if (m.status === "FAILED" || m.status === "TIMEOUT") {
      throw new Error(`Migration ${m.status}: ${m.errors}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Migration polling timed out");
}

async function main() {
  console.log(`Submitting ${changes.length} schema changes…`);
  const data = await gql<{ submitBatchChanges: { migration: { id: string; status: string; errors: string | null } } }>(
    `mutation Submit($input: BatchMigrationInput!) {
      submitBatchChanges(data: $input) { migration { id status errors } }
    }`,
    {
      input: {
        environmentId: ENVIRONMENT_ID,
        name: `cultrepo-loom-fields-${Date.now()}`,
        changes,
      },
    }
  );
  const m = data.submitBatchChanges.migration;
  console.log(`Submitted: ${m.id} (${m.status})`);
  if (m.errors) {
    console.error(m.errors);
    process.exit(1);
  }
  await pollMigration(m.id);
  console.log("✓ Schema updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
