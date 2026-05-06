import { config } from "dotenv";
config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const API_URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";

async function main() {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + TOKEN },
    body: JSON.stringify({
      query: `{
        films(first: 200) { slug videoClipHd { fileName } videoClip { fileName } }
        assets(first: 200, where: { fileName_ends_with: ".mp4" }) { fileName upload { status } }
      }`,
    }),
  });
  const j = await r.json();
  if (j.errors) { console.error(j.errors); return; }
  const mp4Assets = j.data.assets.filter((a: { fileName: string }) => a.fileName.includes("-720") || a.fileName.includes("-1080"));
  console.log(`New variant assets uploaded: ${mp4Assets.length}/26`);
  for (const a of mp4Assets) {
    console.log(`  ${a.fileName}  [${a.upload.status}]`);
  }
  console.log("\nFilms with HD link:");
  for (const f of j.data.films) {
    const lo = f.videoClip?.fileName ?? "—";
    const hi = f.videoClipHd?.fileName ?? "—";
    console.log(`  ${f.slug.padEnd(20)} videoClip=${lo}  videoClipHd=${hi}`);
  }
}
main();
