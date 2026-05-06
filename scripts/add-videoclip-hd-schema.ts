/**
 * One-shot schema add: Film.videoClipHd (Asset).
 *
 * Adds a sibling to the existing videoClip field so we can serve a 720p
 * variant initially and lazy-swap to a 1080p variant after the page settles.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const MGMT_URL = "https://management-us-west-2.hygraph.com/graphql";
const ENVIRONMENT_ID = "36af04adedeb412fa3759e8b2b1fe9eb";

if (!TOKEN) {
  console.error("Missing HYGRAPH_MIGRATION_TOKEN in .env.local");
  process.exit(1);
}

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

async function main() {
  const changes = [
    {
      createRelationalField: {
        modelApiId: "Film",
        apiId: "videoClipHd",
        displayName: "Video Clip (HD)",
        type: "ASSET",
        isList: false,
        reverseField: {
          modelApiId: "Asset",
          apiId: "filmsVideoClipHd",
          displayName: "Film HD Video Clips",
          isList: true,
        },
      },
    },
  ];

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
        name: `cultrepo-add-videoclip-hd-${Date.now()}`,
        changes,
      },
    },
  );

  const m = data.submitBatchChanges.migration;
  console.log(`Migration submitted: ${m.id} (${m.status})`);
  if (m.errors) console.error("Errors:", m.errors);
  else console.log("✓ Film.videoClipHd field added.");
}

main().catch((err) => { console.error(err); process.exit(1); });
