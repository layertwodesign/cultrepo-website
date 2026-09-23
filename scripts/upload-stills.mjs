/**
 * Downloads film screenshots from Josiah's public Drive folders, uploads them
 * as Hygraph assets, and replaces each film's `stills` with the new set
 * (alphabetical by filename). Companion to upload-headshots.mjs. Run with:
 *   node --env-file=.env.local scripts/upload-stills.mjs
 */

const URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const TOKEN = process.env.HYGRAPH_READ_TOKEN;

const FOLDERS = {
  vite: "1gjbVooB_nx7oacMtR710cgPh2AGXkbUj",
  kubernetes: "1VopJbdLorkVUjLG5cQpV7oCDB4VQEcfr",
  graphql: "1ujaFRUxuUDbxHajgAQPBhAL9Mp1xfwX9",
  elixir: "1aKjWfirB0tKBMGInWtazsu9jX3IMOgPd",
  vuejs: "1ckG7rr8twYEa7Ss0YUOtg4IjQ7JoNDNB",
  emberjs: "1hhZJIpbvLv3wfo4XxP0tzqMEv3b9sPpB",
  prometheus: "1mdW64Ko-uxALwIaBVODjAEhlRDFr_GeD",
};

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif",
};

async function gql(query, variables) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

async function listFolder(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`);
  const html = await res.text();
  const entries = [];
  const re = /id="entry-([\w-]+)"[\s\S]*?flip-entry-title">([^<]+)</g;
  let m;
  while ((m = re.exec(html))) entries.push({ fileId: m[1], fileName: m[2] });
  entries.sort((a, b) => a.fileName.localeCompare(b.fileName));
  return entries;
}

async function uploadAsset(fileName, buf, mime) {
  const d = await gql(
    `mutation ($fileName: String!) { createAsset(data: { fileName: $fileName }) {
      id upload { status error { code message } requestPostData {
        url date key signature algorithm policy credential securityToken } } } }`,
    { fileName }
  );
  const a = d.createAsset;
  if (a.upload.error) throw new Error(`${fileName}: ${a.upload.error.message}`);
  const p = a.upload.requestPostData;
  const fd = new FormData();
  fd.append("X-Amz-Date", p.date);
  fd.append("key", p.key);
  fd.append("X-Amz-Signature", p.signature);
  fd.append("X-Amz-Algorithm", p.algorithm);
  fd.append("policy", p.policy);
  fd.append("X-Amz-Credential", p.credential);
  fd.append("X-Amz-Security-Token", p.securityToken);
  fd.append("file", new Blob([buf], { type: mime }), fileName);
  const up = await fetch(p.url, { method: "POST", body: fd });
  if (up.status !== 204 && up.status !== 201)
    throw new Error(`${fileName}: S3 upload failed with ${up.status}`);
  return a.id;
}

async function waitForAsset(id, fileName) {
  for (let i = 0; i < 90; i++) {
    const d = await gql(
      `query ($id: ID!) { asset(where: { id: $id }, stage: DRAFT) { upload { status } } }`,
      { id }
    );
    const status = d.asset?.upload?.status;
    if (status === "ASSET_UPLOAD_COMPLETE") return;
    if (status === "ASSET_ERROR_UPLOAD") throw new Error(`${fileName}: asset processing failed`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${fileName}: asset never finished processing`);
}

// filename -> asset id for everything uploaded today, so reruns don't duplicate
const assetByFile = new Map();
{
  const d = await gql(
    `query { assets(stage: DRAFT, orderBy: createdAt_ASC, first: 400,
      where: { upload: { status: ASSET_UPLOAD_COMPLETE }, createdAt_gt: "2026-07-21T00:00:00Z" })
      { id fileName } }`
  );
  for (const a of d.assets) assetByFile.set(a.fileName.toLowerCase(), a.id);
  if (assetByFile.size) console.log(`found ${assetByFile.size} existing asset(s) from today`);
}

async function ensureAsset(fileName, fileId) {
  const key = fileName.toLowerCase();
  if (assetByFile.has(key)) return assetByFile.get(key);
  const ext = fileName.split(".").pop().toLowerCase();
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
  if (!res.ok) throw new Error(`${fileName}: Drive download failed with ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`${fileName}: suspiciously small download (${buf.length}B)`);
  const assetId = await uploadAsset(fileName, buf, MIME[ext] ?? "application/octet-stream");
  await waitForAsset(assetId, fileName);
  await gql(`mutation ($id: ID!) { publishAsset(where: { id: $id }, to: PUBLISHED) { id } }`, {
    id: assetId,
  });
  assetByFile.set(key, assetId);
  console.log(`  uploaded ${fileName} -> ${assetId}`);
  return assetId;
}

for (const [slug, folderId] of Object.entries(FOLDERS)) {
  console.log(`\n== ${slug}`);
  const entries = await listFolder(folderId);
  if (!entries.length) throw new Error(`${slug}: folder listing came back empty`);

  const stillIds = [];
  for (const e of entries) stillIds.push(await ensureAsset(e.fileName, e.fileId));

  const { film } = await gql(
    `query ($slug: String!) { film(where: { slug: $slug }) { id } }`,
    { slug }
  );
  if (!film) throw new Error(`film not found: ${slug}`);

  await gql(
    `mutation ($id: ID!, $data: FilmUpdateInput!) { updateFilm(where: { id: $id }, data: $data) { id } }`,
    { id: film.id, data: { stills: { set: stillIds.map((id) => ({ id })) } } }
  );
  await gql(`mutation ($id: ID!) { publishFilm(where: { id: $id }, to: PUBLISHED) { id } }`, {
    id: film.id,
  });
  console.log(`  set ${stillIds.length} stills, published`);
}
console.log("\ndone");
