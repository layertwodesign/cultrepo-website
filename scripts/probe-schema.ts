import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const r = await fetch("https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.HYGRAPH_MIGRATION_TOKEN },
    body: JSON.stringify({ query: "{ films(first: 2) { slug videoClipHd { url } } }" }),
  });
  console.log(JSON.stringify(await r.json(), null, 2));
}
main();
