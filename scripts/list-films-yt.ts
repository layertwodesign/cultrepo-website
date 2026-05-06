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
    films: { title: string; slug: string; youtubeId: string | null; videoClip: { url: string; fileName: string | null } | null }[];
  }>(`{ films(first: 200) { title slug youtubeId videoClip { url fileName } } }`);

  for (const f of data.films) {
    const clipName = f.videoClip?.fileName ?? "(none)";
    console.log(`${f.slug.padEnd(20)} yt=${(f.youtubeId ?? "—").padEnd(13)} clip=${clipName}`);
  }
}

main().catch(console.error);
