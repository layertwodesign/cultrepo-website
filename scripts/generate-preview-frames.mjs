/** Extract preview opening frames, never film artwork.
 * Run: node --env-file=.env.local scripts/generate-preview-frames.mjs
 * Requires ffmpeg; reads published CMS assets without changing the CMS.
 * The video URL keys the cache, so replacing a clip cannot reuse its old frame.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { spawnSync } from 'node:child_process';

if (!process.env.HYGRAPH_API_URL) throw new Error('HYGRAPH_API_URL required');
const response = await fetch(process.env.HYGRAPH_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(process.env.HYGRAPH_READ_TOKEN ? { Authorization: `Bearer ${process.env.HYGRAPH_READ_TOKEN}` } : {}) },
  body: JSON.stringify({ query: '{ films(first: 100, stage: PUBLISHED) { slug videoClip { url } } }' }),
});
if (!response.ok) throw new Error(`CMS HTTP ${response.status}`);
const result = await response.json();
if (result.errors || !result.data?.films?.length) throw new Error('Published films unavailable');
const map = {};
const blackRanges = {};
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cultrepo-frames-'));
await fs.mkdir('public/preview-frames', { recursive: true });
try {
  for (const film of result.data.films) {
    if (!film.videoClip?.url) continue;
    if (!/^[a-z0-9-]+$/.test(film.slug)) throw new Error('Unexpected film slug');
    const source = film.videoClip.url;
    const clipResponse = await fetch(source);
    if (!clipResponse.ok) throw new Error(`Clip HTTP ${clipResponse.status}`);
    const clip = path.join(temp, `${film.slug}.mp4`);
    await fs.writeFile(clip, Buffer.from(await clipResponse.arrayBuffer()));
    const scan = spawnSync('ffmpeg', ['-hide_banner', '-i', clip, '-vf', 'blackdetect=d=0.05:pix_th=0.10:pic_th=0.98', '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    if (scan.status !== 0) throw new Error(`Video scan failed: ${film.slug}`);
    const ranges = [...scan.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
    blackRanges[source] = ranges;
    const opening = ranges.find(([from]) => from === 0);
    let start = opening ? opening[1] + 0.12 : 0;
    // Blackdetect alone leaves near-black fade-in frames. Pick the earliest
    // clearly visible frame in the opening shot and start playback there too.
    const samples = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(start), '-i', clip, '-t', '3', '-vf', 'fps=12,scale=64:36,format=gray', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1024 * 1024 });
    if (samples.status !== 0) throw new Error(`Opening scan failed: ${film.slug}`);
    const means = [];
    for (let offset = 0; offset + 2304 <= samples.stdout.length; offset += 2304) {
      means.push(samples.stdout.subarray(offset, offset + 2304).reduce((sum, value) => sum + value, 0) / 2304);
    }
    const threshold = Math.min(40, Math.max(...means) * 0.85);
    const visible = means.findIndex(mean => mean >= threshold);
    if (visible > 0) start += visible / 12;

    const frame = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(start), '-i', clip, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'], { maxBuffer: 16 * 1024 * 1024 });
    if (frame.status !== 0 || !frame.stdout.length) throw new Error(`Frame extraction failed: ${film.slug}`);
    const hash = crypto.createHash('sha256').update(frame.stdout).digest('hex').slice(0, 10);
    const poster = `/preview-frames/${film.slug}-${hash}.webp`;
    // Keep the source aspect ratio. CSS applies the same crop to frame/video.
    await sharp(frame.stdout).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`public${poster}`);
    const blur = await sharp(frame.stdout).resize({ width: 24 }).webp({ quality: 35 }).toBuffer();
    map[source] = { poster, blur: `data:image/webp;base64,${blur.toString('base64')}`, start };
    console.log(`${film.slug}: frame at ${start.toFixed(3)}s, inline ${blur.length} bytes`);
  }
  await fs.writeFile('src/lib/preview-frames.json', JSON.stringify(map, null, 2) + '\n');
  await fs.writeFile('src/lib/preview-black-ranges.json', JSON.stringify(blackRanges, null, 2) + '\n');
  console.log(`Generated ${Object.keys(map).length} video-frame previews`);
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
