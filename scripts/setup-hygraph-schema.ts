/**
 * One-shot schema migration: builds the CultRepo content model in Hygraph.
 *
 * Submits a single batched migration via the Management API's
 * `submitBatchChanges` mutation. We bypass @hygraph/management-sdk because
 * its preflight queries `viewer.project.environments` which our PAT lacks
 * permission for; instead we hard-code the environment ID and POST raw.
 *
 * NOT idempotent — Hygraph rejects re-creating things that already exist.
 * If you need to re-run, delete affected models/components/enums in the
 * Hygraph UI first.
 *
 * Usage:
 *   pnpm tsx scripts/setup-hygraph-schema.ts
 *
 * Env (loaded from .env.local):
 *   HYGRAPH_MIGRATION_TOKEN — PAT with schema mutate permission
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

// ------------------------------------------------------------------ enums
changes.push({
  createEnumeration: {
    apiId: "FilmStatus",
    displayName: "Film Status",
    values: [
      { apiId: "Released", displayName: "Released" },
      { apiId: "PostProduction", displayName: "Post-Production" },
      { apiId: "InProduction", displayName: "In Production" },
      { apiId: "Filming", displayName: "Filming" },
      { apiId: "PreProduction", displayName: "Pre-Production" },
      { apiId: "ComingSoon", displayName: "Coming Soon" },
      { apiId: "Fundraising", displayName: "Fundraising" },
    ],
  },
});

changes.push({
  createEnumeration: {
    apiId: "StatChannel",
    displayName: "Stat Channel",
    values: [
      { apiId: "YouTube", displayName: "YouTube" },
      { apiId: "Instagram", displayName: "Instagram" },
      { apiId: "X", displayName: "X" },
      { apiId: "Bluesky", displayName: "Bluesky" },
    ],
  },
});

// ------------------------------------------------------------- helpers
const simpleField = (
  parent: { modelApiId?: string; parentApiId?: string },
  apiId: string,
  displayName: string,
  type:
    | "STRING"
    | "INT"
    | "FLOAT"
    | "BOOLEAN"
    | "RICHTEXT"
    | "DATETIME"
    | "JSON",
  opts: {
    isRequired?: boolean;
    isList?: boolean;
    isUnique?: boolean;
    isTitle?: boolean;
    initialValue?: string;
  } = {}
) => {
  changes.push({
    createSimpleField: { ...parent, apiId, displayName, type, ...opts },
  });
};

const enumField = (
  parent: { modelApiId?: string; parentApiId?: string },
  apiId: string,
  displayName: string,
  enumerationApiId: string,
  opts: { isRequired?: boolean; isList?: boolean } = {}
) => {
  changes.push({
    createEnumerableField: {
      ...parent,
      apiId,
      displayName,
      enumerationApiId,
      ...opts,
    },
  });
};

const componentField = (
  parentApiId: string,
  apiId: string,
  displayName: string,
  componentApiId: string,
  isList: boolean
) => {
  changes.push({
    createComponentField: {
      parentApiId,
      apiId,
      displayName,
      componentApiId,
      isList,
    },
  });
};

type ReverseField = {
  apiId: string;
  modelApiId: string;
  displayName: string;
  isList: boolean;
};

const relationalField = (
  modelApiId: string,
  apiId: string,
  displayName: string,
  type: "RELATION" | "ASSET",
  isList: boolean,
  reverseField: ReverseField
) => {
  changes.push({
    createRelationalField: {
      modelApiId,
      apiId,
      displayName,
      type,
      isList,
      reverseField,
    },
  });
};

// ------------------------------------------------------------- components

function nameAndRoleComponent(apiId: string, displayName: string, plural: string) {
  changes.push({
    createComponent: { apiId, apiIdPlural: plural, displayName },
  });
  simpleField({ parentApiId: apiId }, "name", "Name", "STRING", { isRequired: true });
  simpleField({ parentApiId: apiId }, "role", "Role", "STRING", { isRequired: true });
}

nameAndRoleComponent("FilmCastMember", "Film Cast Member", "FilmCastMembers");
nameAndRoleComponent("FilmCrewMember", "Film Crew Member", "FilmCrewMembers");

changes.push({ createComponent: { apiId: "FilmExtra", apiIdPlural: "FilmExtras", displayName: "Film Extra" } });
simpleField({ parentApiId: "FilmExtra" }, "title", "Title", "STRING", { isRequired: true });
simpleField({ parentApiId: "FilmExtra" }, "youtubeId", "YouTube ID", "STRING", { isRequired: true });

changes.push({ createComponent: { apiId: "FilmTimelineStep", apiIdPlural: "FilmTimelineSteps", displayName: "Film Timeline Step" } });
simpleField({ parentApiId: "FilmTimelineStep" }, "label", "Label", "STRING", { isRequired: true });
simpleField({ parentApiId: "FilmTimelineStep" }, "done", "Done", "BOOLEAN", { isRequired: true, initialValue: "false" });

changes.push({ createComponent: { apiId: "AboutStat", apiIdPlural: "AboutStats", displayName: "About Stat" } });
simpleField({ parentApiId: "AboutStat" }, "value", "Value", "FLOAT", { isRequired: true });
simpleField({ parentApiId: "AboutStat" }, "suffix", "Suffix", "STRING");
simpleField({ parentApiId: "AboutStat" }, "decimals", "Decimals", "INT", { isRequired: true, initialValue: "0" });
simpleField({ parentApiId: "AboutStat" }, "label", "Label", "STRING", { isRequired: true });
enumField({ parentApiId: "AboutStat" }, "channel", "Channel", "StatChannel", { isRequired: true });

// ---------------------------------------------------------------- models

// Sponsor
changes.push({ createModel: { apiId: "Sponsor", apiIdPlural: "Sponsors", displayName: "Sponsor" } });
simpleField({ modelApiId: "Sponsor" }, "name", "Name", "STRING", { isRequired: true, isTitle: true });
simpleField({ modelApiId: "Sponsor" }, "slug", "Slug", "STRING", { isRequired: true, isUnique: true });
relationalField("Sponsor", "logo", "Logo", "ASSET", false, {
  modelApiId: "Asset",
  apiId: "sponsorsLogo",
  displayName: "Sponsor Logos",
  isList: true,
});

// TeamMember
changes.push({ createModel: { apiId: "TeamMember", apiIdPlural: "TeamMembers", displayName: "Team Member" } });
simpleField({ modelApiId: "TeamMember" }, "name", "Name", "STRING", { isRequired: true, isTitle: true });
simpleField({ modelApiId: "TeamMember" }, "role", "Role", "STRING", { isRequired: true });
simpleField({ modelApiId: "TeamMember" }, "bio", "Bio", "STRING", { isRequired: true });
simpleField({ modelApiId: "TeamMember" }, "email", "Email", "STRING", { isRequired: true, isUnique: true });
simpleField({ modelApiId: "TeamMember" }, "order", "Order", "INT", { isRequired: true, initialValue: "0" });
relationalField("TeamMember", "photo", "Photo", "ASSET", false, {
  modelApiId: "Asset",
  apiId: "teamMembersPhoto",
  displayName: "Team Member Photos",
  isList: true,
});

// Film
changes.push({ createModel: { apiId: "Film", apiIdPlural: "Films", displayName: "Film" } });
simpleField({ modelApiId: "Film" }, "title", "Title", "STRING", { isRequired: true, isTitle: true });
simpleField({ modelApiId: "Film" }, "slug", "Slug", "STRING", { isRequired: true, isUnique: true });
enumField({ modelApiId: "Film" }, "status", "Status", "FilmStatus", { isRequired: true });
simpleField({ modelApiId: "Film" }, "description", "Description", "STRING", { isRequired: true });
simpleField({ modelApiId: "Film" }, "synopsis", "Synopsis", "STRING", { isRequired: true });
simpleField({ modelApiId: "Film" }, "year", "Year", "STRING");
simpleField({ modelApiId: "Film" }, "duration", "Duration", "STRING");
simpleField({ modelApiId: "Film" }, "director", "Director", "STRING");
simpleField({ modelApiId: "Film" }, "youtubeId", "YouTube ID", "STRING");
simpleField({ modelApiId: "Film" }, "technologies", "Technologies", "STRING", { isList: true });
simpleField({ modelApiId: "Film" }, "fundraisingGoal", "Fundraising Goal", "INT");
simpleField({ modelApiId: "Film" }, "fundraisingRaised", "Fundraising Raised", "INT");
simpleField({ modelApiId: "Film" }, "order", "Order", "INT", { isRequired: true, initialValue: "0" });
relationalField("Film", "poster", "Poster", "ASSET", false, {
  modelApiId: "Asset",
  apiId: "filmsPoster",
  displayName: "Film Posters",
  isList: true,
});
relationalField("Film", "videoClip", "Video Clip", "ASSET", false, {
  modelApiId: "Asset",
  apiId: "filmsVideoClip",
  displayName: "Film Video Clips",
  isList: true,
});
relationalField("Film", "stills", "Stills", "ASSET", true, {
  modelApiId: "Asset",
  apiId: "filmsStills",
  displayName: "Film Stills",
  isList: true,
});
relationalField("Film", "sponsors", "Sponsors", "RELATION", true, {
  modelApiId: "Sponsor",
  apiId: "films",
  displayName: "Films",
  isList: true,
});
componentField("Film", "cast", "Cast", "FilmCastMember", true);
componentField("Film", "crew", "Crew", "FilmCrewMember", true);
componentField("Film", "extras", "Extras", "FilmExtra", true);
componentField("Film", "timeline", "Timeline", "FilmTimelineStep", true);

// AboutPage
changes.push({ createModel: { apiId: "AboutPage", apiIdPlural: "AboutPages", displayName: "About Page" } });
simpleField({ modelApiId: "AboutPage" }, "heroTitle", "Hero Title", "STRING");
simpleField({ modelApiId: "AboutPage" }, "heroSubtitle", "Hero Subtitle", "STRING");
simpleField({ modelApiId: "AboutPage" }, "story", "Story", "STRING");
relationalField("AboutPage", "backstageImage", "Backstage Image", "ASSET", false, {
  modelApiId: "Asset",
  apiId: "aboutPagesBackstageImage",
  displayName: "About Page Backstage Images",
  isList: true,
});
componentField("AboutPage", "stats", "Stats", "AboutStat", true);
relationalField("AboutPage", "trustedBySponsors", "Trusted By Sponsors", "RELATION", true, {
  modelApiId: "Sponsor",
  apiId: "aboutPagesTrustedBy",
  displayName: "About Pages Trusted By",
  isList: true,
});

// SiteSettings
changes.push({ createModel: { apiId: "SiteSettings", apiIdPlural: "SiteSettingsItems", displayName: "Site Settings" } });
simpleField({ modelApiId: "SiteSettings" }, "tagline", "Tagline", "STRING");
simpleField({ modelApiId: "SiteSettings" }, "youtubeUrl", "YouTube URL", "STRING");
simpleField({ modelApiId: "SiteSettings" }, "blueskyUrl", "Bluesky URL", "STRING");
simpleField({ modelApiId: "SiteSettings" }, "xUrl", "X URL", "STRING");
simpleField({ modelApiId: "SiteSettings" }, "instagramUrl", "Instagram URL", "STRING");
simpleField({ modelApiId: "SiteSettings" }, "newsletterFormAction", "Newsletter Form Action", "STRING");

// ----------------------------------------------------------------- submit

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(MGMT_URL, {
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

async function pollMigration(id: string) {
  const start = Date.now();
  while (Date.now() - start < 120_000) {
    const data = await gql<{ migration: { status: string; errors: string | null } }>(
      `query Mig($id: ID!) {
        migration: __type(name: "Query") { name }
      }`,
      { id }
    );
    void data;
    // The Query type doesn't expose migration lookup for token viewers, so
    // we can't poll. Just sleep and trust the submit-and-forget.
    await new Promise((r) => setTimeout(r, 2000));
    return;
  }
}

async function main() {
  console.log(`Submitting ${changes.length} schema changes…`);
  const data = await gql<{ submitBatchChanges: { migration: { id: string; status: string; errors: string | null } } }>(
    `mutation Submit($input: BatchMigrationInput!) {
      submitBatchChanges(data: $input) {
        migration { id status errors }
      }
    }`,
    {
      input: {
        environmentId: ENVIRONMENT_ID,
        name: "cultrepo-schema-setup",
        changes,
      },
    }
  );
  const m = data.submitBatchChanges.migration;
  console.log(`Migration submitted: ${m.id} (${m.status})`);
  if (m.errors) {
    console.error("Errors:", m.errors);
    process.exit(1);
  }
  await pollMigration(m.id);
  console.log("\n✓ Migration submitted. Schema may take 30-60s to fully apply.");
  console.log("Check the Hygraph UI (Schema page) to confirm models appeared.");
  console.log("Then run scripts/seed-hygraph.ts to push existing content.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
