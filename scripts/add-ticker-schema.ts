/**
 * Schema migration: TickerTech component + SiteSettings.homepageTicker.
 * Run once.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const MGMT_URL = "https://management-us-west-2.hygraph.com/graphql";
const ENVIRONMENT_ID = "36af04adedeb412fa3759e8b2b1fe9eb";

if (!TOKEN) {
  console.error("Missing HYGRAPH_MIGRATION_TOKEN");
  process.exit(1);
}

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
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("\n"));
  if (!json.data) throw new Error("No data");
  return json.data;
}

const changes: Record<string, unknown>[] = [
  {
    createComponent: {
      apiId: "TickerTech",
      apiIdPlural: "TickerTechs",
      displayName: "Ticker Tech",
      description:
        "A technology entry on the homepage ticker, plus the people associated with it. Each person becomes its own row beside the tech name.",
    },
  },
  {
    createSimpleField: {
      parentApiId: "TickerTech",
      apiId: "name",
      displayName: "Tech Name",
      type: "STRING",
      isRequired: true,
      description: "Shown on the left side of each row (e.g. 'Vue.js').",
    },
  },
  {
    createSimpleField: {
      parentApiId: "TickerTech",
      apiId: "people",
      displayName: "People",
      type: "STRING",
      isList: true,
      description:
        "One name per entry. Each name renders as a separate ticker row paired with this tech.",
    },
  },
  {
    createComponentField: {
      parentApiId: "SiteSettings",
      apiId: "homepageTicker",
      displayName: "Homepage Ticker",
      componentApiId: "TickerTech",
      isList: true,
      description:
        "The scrolling tech + people list shown on the home page. Add a tech, attach the people you want shown next to it, then reorder as needed.",
    },
  },
];

async function main() {
  const data = await gql<{
    submitBatchChanges: { migration: { id: string; status: string; errors: string | null } };
  }>(
    `mutation Submit($input: BatchMigrationInput!) {
      submitBatchChanges(data: $input) {
        migration { id status errors }
      }
    }`,
    {
      input: {
        environmentId: ENVIRONMENT_ID,
        name: `cultrepo-add-ticker-${Date.now()}`,
        changes,
      },
    }
  );
  const m = data.submitBatchChanges.migration;
  console.log(`Migration ${m.id} (${m.status})`);
  if (m.errors) {
    console.error("Errors:", m.errors);
    process.exit(1);
  }
  console.log(`✓ ${changes.length} changes applied.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
