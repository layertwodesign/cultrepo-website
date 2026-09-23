/**
 * Downloads interviewee headshots from Josiah's public Drive folders, uploads
 * them as Hygraph assets, and connects each to the matching Film cast member.
 * Companion to apply-film-info.mjs. Run with:
 *   node --env-file=.env.local scripts/upload-headshots.mjs
 */

const URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const TOKEN = process.env.HYGRAPH_READ_TOKEN;

const FOLDERS = {
  vite: "1fLqrrPvZAgsR_p6aRowHQg8pTEqKmL2g",
  kubernetes: "1wlAn1GWZHFreuQMX49NvPwqJFqYSF17R",
  graphql: "1rGM53BdEuq81PqFtc-nzrtCILpE5HGvr",
  elixir: "1w-2PKF2gUV7X-QwXeQt_NSeCl7PVyj0J",
  vuejs: "13dxcUWqc9S1yc7-_t4Ui90slUOg-a1oS",
  emberjs: "1uy-0Zdj3UUYy2KFvxWVLnmZGYrzeq4I-",
  prometheus: "1iTAJFiAH-y4QfmPr6LK7x4UTcRJcfNvN",
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

// fold to a diacritic-free lowercase key so "José Valim" matches "Jose Valim.jpeg"
const nameKey = (s) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

async function listFolder(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`);
  const html = await res.text();
  const entries = [];
  const re = /id="entry-([\w-]+)"[\s\S]*?flip-entry-title">([^<]+)</g;
  let m;
  while ((m = re.exec(html))) entries.push({ fileId: m[1], fileName: m[2] });
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

// one asset per unique person across all films; seeded from any assets a
// previous (partial) run already uploaded so reruns don't duplicate
const assetByPerson = new Map();
{
  const d = await gql(
    `query { assets(stage: DRAFT, orderBy: createdAt_ASC, first: 200,
      where: { upload: { status: ASSET_UPLOAD_COMPLETE }, createdAt_gt: "2026-07-21T00:00:00Z" })
      { id fileName } }`
  );
  for (const a of d.assets) {
    const key = nameKey(a.fileName.replace(/\.[a-z0-9]+$/i, ""));
    assetByPerson.set(key, a.id); // later (newer) wins
  }
  for (const id of new Set(assetByPerson.values())) {
    await gql(`mutation ($id: ID!) { publishAsset(where: { id: $id }, to: PUBLISHED) { id } }`, { id });
  }
  if (assetByPerson.size) console.log(`resuming with ${assetByPerson.size} existing asset(s)`);
}

async function ensureAsset(fileName, fileId) {
  const key = nameKey(fileName.replace(/\.[a-z0-9]+$/i, ""));
  if (assetByPerson.has(key)) return { key, assetId: assetByPerson.get(key) };
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
  assetByPerson.set(key, assetId);
  console.log(`  uploaded ${fileName} -> ${assetId}`);
  return { key, assetId };
}

for (const [slug, folderId] of Object.entries(FOLDERS)) {
  console.log(`\n== ${slug}`);
  const entries = await listFolder(folderId);
  if (!entries.length) throw new Error(`${slug}: folder listing came back empty`);

  const { film } = await gql(
    `query ($slug: String!) { film(where: { slug: $slug }) {
      id cast(first: 50) { id name photo { id } } } }`,
    { slug }
  );
  if (!film) throw new Error(`film not found: ${slug}`);

  const assetByKey = new Map();
  for (const e of entries) {
    const { key, assetId } = await ensureAsset(e.fileName, e.fileId);
    assetByKey.set(key, assetId);
  }

  const updates = [];
  for (const member of film.cast) {
    const assetId = assetByKey.get(nameKey(member.name));
    if (!assetId) {
      console.log(`  !! no headshot matched for "${member.name}"`);
      continue;
    }
    updates.push({ where: { id: member.id }, data: { photo: { connect: { id: assetId } } } });
  }
  await gql(
    `mutation ($id: ID!, $data: FilmUpdateInput!) { updateFilm(where: { id: $id }, data: $data) { id } }`,
    { id: film.id, data: { cast: { update: updates } } }
  );
  await gql(`mutation ($id: ID!) { publishFilm(where: { id: $id }, to: PUBLISHED) { id } }`, {
    id: film.id,
  });
  console.log(`  connected ${updates.length}/${film.cast.length} photos, published`);
}
console.log("\ndone");
