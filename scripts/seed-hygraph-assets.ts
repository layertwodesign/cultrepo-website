/**
 * Asset upload + linking for Hygraph.
 *
 * Walks the local /public asset folders, uploads each file to Hygraph
 * via createAsset → S3 pre-signed POST → publishAsset, then connects
 * the resulting asset IDs to the matching Film/TeamMember/Sponsor
 * records by slug/email.
 *
 * Idempotent: skips assets whose `fileName` is already present in
 * Hygraph (matched on filename).
 *
 * Usage:
 *   pnpm tsx scripts/seed-hygraph-assets.ts
 */

import { config } from "dotenv";
import { readFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { films as localFilms } from "../src/lib/films-data";

config({ path: ".env.local" });

const API_URL =
  "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
if (!TOKEN) {
  console.error("Missing HYGRAPH_MIGRATION_TOKEN");
  process.exit(1);
}

const PUBLIC = join(process.cwd(), "public");

// ----------------------------------------------------------------- helpers

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) {
      const msg = json.errors.map((e) => e.message).join("\n");
      if (/Too Many Requests/i.test(msg)) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1500));
        continue;
      }
      throw new Error(msg);
    }
    if (!json.data) throw new Error("No data returned");
    await new Promise((r) => setTimeout(r, 100));
    return json.data;
  }
  throw new Error("Too many retries");
}

async function findAssetByFileName(fileName: string): Promise<string | null> {
  type Resp = { assets: { id: string; fileName: string; upload?: { status: string } }[] };
  const data = await gql<Resp>(
    `query Find($fileName: String!) {
      assets(where: { fileName: $fileName }, first: 1, stage: DRAFT) {
        id
        fileName
        upload { status }
      }
    }`,
    { fileName }
  );
  const a = data.assets[0];
  if (!a) return null;
  // If a stale "PENDING" asset exists from a previous failed run, treat it as missing.
  if (a.upload?.status && a.upload.status !== "ASSET_UPLOAD_COMPLETE" && a.upload.status !== "ASSET_PROCESS_COMPLETE") {
    return null;
  }
  return a.id;
}

async function uploadFile(filePath: string): Promise<string> {
  const fileName = basename(filePath);
  const existing = await findAssetByFileName(fileName);
  if (existing) {
    console.log(`  • ${fileName} (already uploaded)`);
    return existing;
  }

  type CreateResp = {
    createAsset: {
      id: string;
      upload: {
        status: string;
        requestPostData: {
          url: string;
          date: string;
          key: string;
          signature: string;
          credential: string;
          algorithm: string;
          policy: string;
          securityToken: string;
        } | null;
      };
    };
  };
  const created = await gql<CreateResp>(
    `mutation Create($fileName: String!) {
      createAsset(data: { fileName: $fileName }) {
        id
        upload { status requestPostData { url date key signature credential algorithm policy securityToken } }
      }
    }`,
    { fileName }
  );

  const post = created.createAsset.upload.requestPostData;
  if (!post) {
    throw new Error(`No upload URL for ${fileName} — status was ${created.createAsset.upload.status}`);
  }

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

  const s3Res = await fetch(post.url, { method: "POST", body: form });
  if (!s3Res.ok) {
    const text = await s3Res.text();
    throw new Error(`S3 upload failed for ${fileName}: ${s3Res.status} ${text.slice(0, 300)}`);
  }

  // Wait for Hygraph to process the upload
  for (let i = 0; i < 30; i++) {
    const probe = await gql<{ asset: { id: string; upload: { status: string } } | null }>(
      `query Probe($id: ID!) {
        asset(where: { id: $id }, stage: DRAFT) { id upload { status } }
      }`,
      { id: created.createAsset.id }
    );
    const status = probe.asset?.upload.status;
    if (status === "ASSET_UPLOAD_COMPLETE" || status === "ASSET_PROCESS_COMPLETE") break;
    if (status === "ASSET_ERROR_UPLOAD" || status === "ASSET_ERROR_PROCESS") {
      throw new Error(`Asset processing failed for ${fileName}: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Publish
  await gql(
    `mutation Pub($id: ID!) {
      publishAsset(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id: created.createAsset.id }
  );

  console.log(`  ✓ ${fileName}`);
  return created.createAsset.id;
}

// --------------------------------------------------- Film slug → asset paths

function fileExists(p: string): boolean {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

function posterPathForFilm(film: typeof localFilms[number]): string | null {
  if (!film.poster) return null;
  const p = join(PUBLIC, film.poster.replace(/^\//, ""));
  return fileExists(p) ? p : null;
}

function videoPathForFilm(film: typeof localFilms[number]): string | null {
  if (!film.video) return null;
  const p = join(PUBLIC, film.video.replace(/^\//, ""));
  return fileExists(p) ? p : null;
}

async function stillsForFilm(film: typeof localFilms[number]): Promise<string[]> {
  const out: string[] = [];
  for (const s of film.stills ?? []) {
    const p = join(PUBLIC, s.replace(/^\//, ""));
    if (fileExists(p)) out.push(p);
  }
  return out;
}

// --------------------------------------------------------------- main flow

async function linkFilmAsset(slug: string, fieldApiId: "poster" | "videoClip", assetId: string) {
  await gql(
    `mutation Link($slug: String!, $assetId: ID!) {
      updateFilm(where: { slug: $slug }, data: { ${fieldApiId}: { connect: { id: $assetId } } }) { id }
    }`,
    { slug, assetId }
  );
  await gql(
    `mutation Pub($slug: String!) {
      publishFilm(where: { slug: $slug }, to: PUBLISHED) { id }
    }`,
    { slug }
  );
}

async function linkFilmStills(slug: string, assetIds: string[]) {
  if (!assetIds.length) return;
  await gql(
    `mutation Link($slug: String!, $ids: [AssetConnectInput!]!) {
      updateFilm(where: { slug: $slug }, data: { stills: { connect: $ids } }) { id }
    }`,
    { slug, ids: assetIds.map((id) => ({ where: { id } })) }
  );
  await gql(
    `mutation Pub($slug: String!) {
      publishFilm(where: { slug: $slug }, to: PUBLISHED) { id }
    }`,
    { slug }
  );
}

async function linkTeamPhoto(email: string, assetId: string) {
  await gql(
    `mutation Link($email: String!, $assetId: ID!) {
      updateTeamMember(where: { email: $email }, data: { photo: { connect: { id: $assetId } } }) { id }
    }`,
    { email, assetId }
  );
  await gql(
    `mutation Pub($email: String!) {
      publishTeamMember(where: { email: $email }, to: PUBLISHED) { id }
    }`,
    { email }
  );
}

async function linkSponsorLogo(slug: string, assetId: string) {
  await gql(
    `mutation Link($slug: String!, $assetId: ID!) {
      updateSponsor(where: { slug: $slug }, data: { logo: { connect: { id: $assetId } } }) { id }
    }`,
    { slug, assetId }
  );
  await gql(
    `mutation Pub($slug: String!) {
      publishSponsor(where: { slug: $slug }, to: PUBLISHED) { id }
    }`,
    { slug }
  );
}

async function main() {
  console.log("Films: posters & video clips…");
  for (const f of localFilms) {
    const poster = posterPathForFilm(f);
    const video = videoPathForFilm(f);
    if (!poster && !video) {
      console.log(`  - ${f.title} (no local assets)`);
      continue;
    }
    if (poster) {
      const id = await uploadFile(poster);
      await linkFilmAsset(f.slug, "poster", id);
      console.log(`    → ${f.title}.poster linked`);
    }
    if (video) {
      const id = await uploadFile(video);
      await linkFilmAsset(f.slug, "videoClip", id);
      console.log(`    → ${f.title}.videoClip linked`);
    }
  }

  console.log("\nFilms: stills…");
  for (const f of localFilms) {
    const stills = await stillsForFilm(f);
    if (!stills.length) continue;
    const ids: string[] = [];
    for (const p of stills) ids.push(await uploadFile(p));
    await linkFilmStills(f.slug, ids);
    console.log(`    → ${f.title}.stills (${ids.length}) linked`);
  }

  console.log("\nTeam photos…");
  // Match team email → photo file by stem (emma.webp ↔ emma@cultrepo.com)
  const teamDir = join(PUBLIC, "team");
  const teamEntries = await readdir(teamDir);
  const teamByStem: Record<string, string> = {};
  for (const f of teamEntries) {
    const stem = f.split(".")[0].toLowerCase();
    teamByStem[stem] = join(teamDir, f);
  }
  const knownEmails = [
    "emma@cultrepo.com",
    "josiah@cultrepo.com",
    "ida@cultrepo.com",
    "guillermo@cultrepo.com",
  ];
  for (const email of knownEmails) {
    const stem = email.split("@")[0];
    const path = teamByStem[stem];
    if (!path) {
      console.log(`  - ${email} (no photo)`);
      continue;
    }
    const id = await uploadFile(path);
    await linkTeamPhoto(email, id);
    console.log(`    → ${email}.photo linked`);
  }

  console.log("\nSponsor logos…");
  // public/partners is brand logos for the About page partner row.
  // Sponsor list is broader (some have no logo file). Connect when file matches slug.
  const sponsorDir = join(PUBLIC, "partners");
  const sponsorEntries = await readdir(sponsorDir);
  const sponsorByStem: Record<string, string> = {};
  for (const f of sponsorEntries) {
    const stem = f.split(".")[0].toLowerCase();
    sponsorByStem[stem] = join(sponsorDir, f);
  }
  // Map filename stems → actual sponsor slugs (Hygraph slugifies "Red Hat" → "red-hat")
  const stemToSlug: Record<string, string> = {
    redhat: "red-hat",
  };
  for (const stem of Object.keys(sponsorByStem)) {
    const slug = stemToSlug[stem] ?? stem;
    const path = sponsorByStem[stem];
    const id = await uploadFile(path);
    try {
      await linkSponsorLogo(slug, id);
      console.log(`    → ${slug}.logo linked`);
    } catch (e) {
      console.log(`    ! ${slug} not found (skipping logo): ${(e as Error).message.slice(0, 80)}`);
    }
  }

  console.log("\n✓ Asset upload + linking complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
