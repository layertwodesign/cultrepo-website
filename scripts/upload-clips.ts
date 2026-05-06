/**
 * Upload regenerated 720p + 1080p clips to Hygraph and link them to Films.
 *
 * - Reads files from public/clips-new/{slug}-{720|1080}.mp4
 * - Creates Hygraph Assets, uploads to S3, publishes
 * - Updates each Film: videoClip → 720p, videoClipHd → 1080p
 * - Re-publishes the Film
 *
 * Idempotent: skips upload if an Asset with the same fileName already exists.
 */
import { config } from "dotenv";
import { readFileSync, statSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const API_URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const CLIPS_DIR = join(process.cwd(), "public", "clips-new");

if (!TOKEN) { console.error("Missing HYGRAPH_MIGRATION_TOKEN"); process.exit(1); }

async function gql<T>(q: string, variables?: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ query: q, variables }),
    });
    const j = (await r.json()) as { data?: T; errors?: { message: string }[] };
    if (j.errors?.length) {
      const msg = j.errors.map((e) => e.message).join("\n");
      if (/Too Many Requests/i.test(msg)) {
        await new Promise((res) => setTimeout(res, (attempt + 1) * 1500));
        continue;
      }
      throw new Error(msg);
    }
    if (!j.data) throw new Error("no data");
    await new Promise((r) => setTimeout(r, 80));
    return j.data;
  }
  throw new Error("retries exhausted");
}

async function findAssetByFileName(fileName: string): Promise<string | null> {
  type R = { assets: { id: string; upload?: { status: string } }[] };
  const d = await gql<R>(
    `query F($fn: String!) { assets(where: {fileName: $fn}, first:1, stage: DRAFT) { id upload { status } } }`,
    { fn: fileName },
  );
  const a = d.assets[0];
  if (!a) return null;
  const ok = a.upload?.status === "ASSET_UPLOAD_COMPLETE" || a.upload?.status === "ASSET_PROCESS_COMPLETE";
  return ok ? a.id : null;
}

async function uploadFile(filePath: string): Promise<string> {
  const fileName = basename(filePath);
  const existing = await findAssetByFileName(fileName);
  if (existing) {
    console.log(`  • ${fileName} (already uploaded)`);
    return existing;
  }

  type CR = {
    createAsset: {
      id: string;
      upload: {
        status: string;
        requestPostData: {
          url: string; date: string; key: string; signature: string;
          credential: string; algorithm: string; policy: string; securityToken: string;
        } | null;
      };
    };
  };
  const c = await gql<CR>(
    `mutation C($fn: String!) {
      createAsset(data: { fileName: $fn }) {
        id upload { status requestPostData { url date key signature credential algorithm policy securityToken } }
      }
    }`,
    { fn: fileName },
  );
  const post = c.createAsset.upload.requestPostData;
  if (!post) throw new Error(`No upload URL for ${fileName}`);

  const buf = readFileSync(filePath);
  const form = new FormData();
  form.set("X-Amz-Date", post.date);
  form.set("key", post.key);
  form.set("X-Amz-Signature", post.signature);
  form.set("X-Amz-Credential", post.credential);
  form.set("X-Amz-Algorithm", post.algorithm);
  form.set("policy", post.policy);
  form.set("X-Amz-Security-Token", post.securityToken);
  form.set("file", new Blob([new Uint8Array(buf)]), fileName);

  const s3 = await fetch(post.url, { method: "POST", body: form });
  if (!s3.ok) throw new Error(`S3 upload failed: ${s3.status} ${(await s3.text()).slice(0, 300)}`);

  // wait for processing
  for (let i = 0; i < 60; i++) {
    const p = await gql<{ asset: { upload: { status: string } } | null }>(
      `query P($id: ID!) { asset(where: {id: $id}, stage: DRAFT) { upload { status } } }`,
      { id: c.createAsset.id },
    );
    const s = p.asset?.upload.status;
    if (s === "ASSET_UPLOAD_COMPLETE" || s === "ASSET_PROCESS_COMPLETE") break;
    if (s === "ASSET_ERROR_UPLOAD" || s === "ASSET_ERROR_PROCESS") {
      throw new Error(`Asset processing failed: ${s}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  await gql(`mutation Pub($id: ID!) { publishAsset(where: {id:$id}, to: PUBLISHED) { id } }`, { id: c.createAsset.id });
  const sizeMB = (statSync(filePath).size / 1_000_000).toFixed(2);
  console.log(`  ✓ ${fileName} (${sizeMB} MB)`);
  return c.createAsset.id;
}

async function getFilmsBySlug(): Promise<Map<string, { id: string }>> {
  const d = await gql<{ films: { id: string; slug: string }[] }>(
    `{ films(stage: DRAFT, first: 200) { id slug } }`,
  );
  return new Map(d.films.map((f) => [f.slug, { id: f.id }]));
}

async function linkFilmAssets(filmId: string, asset720: string, asset1080: string) {
  await gql(
    `mutation U($id: ID!, $a720: ID!, $a1080: ID!) {
      updateFilm(
        where: { id: $id },
        data: {
          videoClip:   { connect: { id: $a720 } },
          videoClipHd: { connect: { id: $a1080 } }
        }
      ) { id }
    }`,
    { id: filmId, a720: asset720, a1080: asset1080 },
  );
  await gql(
    `mutation P($id: ID!) { publishFilm(where: {id:$id}, to: PUBLISHED) { id } }`,
    { id: filmId },
  );
}

async function main() {
  // Discover {slug}-720.mp4 / {slug}-1080.mp4 pairs in clips-new
  const files = readdirSync(CLIPS_DIR).filter((f) => f.endsWith(".mp4"));
  const slugs = new Set<string>();
  for (const f of files) {
    const m = f.match(/^(.+)-(720|1080)\.mp4$/);
    if (m) slugs.add(m[1]);
  }

  const filmMap = await getFilmsBySlug();

  for (const slug of slugs) {
    const film = filmMap.get(slug);
    if (!film) {
      console.log(`⚠  ${slug}: no Film record found in Hygraph — skipping`);
      continue;
    }
    const path720 = join(CLIPS_DIR, `${slug}-720.mp4`);
    const path1080 = join(CLIPS_DIR, `${slug}-1080.mp4`);

    console.log(`▶ ${slug}`);
    const id720 = await uploadFile(path720);
    const id1080 = await uploadFile(path1080);
    await linkFilmAssets(film.id, id720, id1080);
    console.log(`  ✓ Linked to Film "${slug}"`);
  }
  console.log(`\nDone.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
