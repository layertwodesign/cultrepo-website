/**
 * Re-generate higher-resolution carousel clips by:
 *   1. Reading YouTube IDs from Hygraph for each Film
 *   2. Downloading the YouTube master (~1080p) via yt-dlp
 *   3. Encoding two variants: 720p and 1920p ("1080p" cinema)
 *
 * Outputs to public/clips-new/{slug}-{720|1080}.mp4
 *
 * Reuses cached masters in /tmp/cultrepo-clips/ across runs.
 *
 * Run:   npx tsx scripts/regen-clips.ts
 */
import { config } from "dotenv";
import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";

config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const API_URL = "https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master";
const CACHE_DIR = "/tmp/cultrepo-clips";
const OUT_DIR = "public/clips-new";
const CLIP_DURATION = 15;

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

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const data = await gql<{ films: { slug: string; youtubeId: string | null }[] }>(
    `{ films(first: 200) { slug youtubeId } }`,
  );

  const targets = data.films.filter((f) => f.youtubeId);
  console.log(`Re-generating ${targets.length} films (skipping ${data.films.length - targets.length} without YT id)\n`);

  for (const f of targets) {
    const masterPath = `${CACHE_DIR}/${f.slug}-master.mp4`;
    const out720 = `${OUT_DIR}/${f.slug}-720.mp4`;
    const out1080 = `${OUT_DIR}/${f.slug}-1080.mp4`;

    if (existsSync(out720) && existsSync(out1080)) {
      console.log(`✓ ${f.slug} already encoded — skipping`);
      continue;
    }

    if (!existsSync(masterPath)) {
      console.log(`↓ Downloading ${f.slug} (yt=${f.youtubeId})`);
      try {
        await run("yt-dlp", [
          "-f",
          "bv*[height<=1080][ext=mp4]/bv*[height<=1080]",
          "-o",
          masterPath,
          `https://www.youtube.com/watch?v=${f.youtubeId}`,
        ]);
      } catch (e) {
        console.warn(`  ⚠ Download failed for ${f.slug}: ${(e as Error).message}`);
        continue;
      }
    } else {
      const s = await stat(masterPath);
      console.log(`✓ ${f.slug} master cached (${(s.size / 1_000_000).toFixed(1)} MB)`);
    }

    // 720p — matches current carousel display when not scaled up
    if (!existsSync(out720)) {
      console.log(`  → encoding ${f.slug} 720p`);
      await run("ffmpeg", [
        "-y", "-ss", "0", "-i", masterPath,
        "-t", String(CLIP_DURATION),
        "-vf", "scale=720:-2",
        "-c:v", "libx264", "-preset", "slow", "-crf", "23",
        "-profile:v", "main", "-pix_fmt", "yuv420p",
        "-an", "-movflags", "+faststart",
        "-loglevel", "error",
        out720,
      ]);
    }

    // 1080p — cinema-aspect Full HD width (height varies by source aspect)
    if (!existsSync(out1080)) {
      console.log(`  → encoding ${f.slug} 1080p`);
      await run("ffmpeg", [
        "-y", "-ss", "0", "-i", masterPath,
        "-t", String(CLIP_DURATION),
        "-vf", "scale=1920:-2",
        "-c:v", "libx264", "-preset", "slow", "-crf", "22",
        "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-an", "-movflags", "+faststart",
        "-loglevel", "error",
        out1080,
      ]);
    }
  }

  console.log(`\nDone. Outputs in ${OUT_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
