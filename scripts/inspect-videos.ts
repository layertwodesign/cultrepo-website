import { config } from "dotenv";
config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const API_URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";

async function gql<T>(q: string): Promise<T> {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query: q }),
  });
  const j = (await r.json()) as { data?: T; errors?: { message: string }[] };
  if (j.errors?.length) throw new Error(j.errors.map((e) => e.message).join("\n"));
  if (!j.data) throw new Error("no data");
  return j.data;
}

async function main() {
  const data = await gql<{
    films: {
      title: string;
      slug: string;
      videoClip: { url: string; width: number | null; height: number | null; size: number | null; mimeType: string | null; fileName: string | null } | null;
    }[];
  }>(`{
    films(first: 200) {
      title
      slug
      videoClip {
        url
        width
        height
        size
        mimeType
        fileName
      }
    }
  }`);

  for (const f of data.films) {
    const v = f.videoClip;
    if (!v) {
      console.log(`${f.slug}: NO videoClip`);
      continue;
    }
    const sizeMB = v.size ? (v.size / 1_000_000).toFixed(2) + " MB" : "?";
    console.log(`${f.slug}: ${v.width}×${v.height} ${v.mimeType} ${sizeMB} ${v.fileName}`);
    console.log(`  ${v.url}`);
  }
}

main().catch(console.error);
