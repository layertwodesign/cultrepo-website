/** Refresh the checked-in preview cache from published CMS posters.
 * Run: node --env-file=.env.local scripts/generate-preview-posters.mjs
 * Does not write to the CMS. Changed poster URLs fall back to the image CDN
 * until this cache is refreshed; existing URLs are content-fingerprinted.
 */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { spawnSync } from 'node:child_process';

if (!process.env.HYGRAPH_API_URL) throw new Error('HYGRAPH_API_URL required');
const response = await fetch(process.env.HYGRAPH_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(process.env.HYGRAPH_READ_TOKEN ? { Authorization: `Bearer ${process.env.HYGRAPH_READ_TOKEN}` } : {}) },
  body: JSON.stringify({ query: '{ films(first: 100, stage: PUBLISHED) { slug poster { url } videoClip { url } } }' }),
});
if (!response.ok) throw new Error(`CMS HTTP ${response.status}`);
const result = await response.json();
if (result.errors || !result.data?.films?.length) throw new Error('Published films unavailable');
const map = {};
const blackRanges = {};
await fs.mkdir('public/preview-posters', { recursive: true });
for (const film of result.data.films) {
  if (film.videoClip?.url) {
    const scan = spawnSync('ffmpeg', ['-hide_banner', '-i', film.videoClip.url, '-vf', 'blackdetect=d=0.05:pix_th=0.10:pic_th=0.98', '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    if (scan.status !== 0) throw new Error(`Video scan failed: ${film.slug}`);
    blackRanges[film.videoClip.url] = [...scan.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  }
  if (!film.poster?.url) continue;
  if (!/^[a-z0-9-]+$/.test(film.slug)) throw new Error('Unexpected film slug');
  const imageResponse = await fetch(film.poster.url);
  if (!imageResponse.ok) throw new Error(`Poster HTTP ${imageResponse.status}`);
  const image = Buffer.from(await imageResponse.arrayBuffer());
  const hash = crypto.createHash('sha256').update(image).digest('hex').slice(0, 10);
  const poster = `/preview-posters/${film.slug}-${hash}.webp`;
  await sharp(image).resize(960, 540, { fit: 'cover' }).webp({ quality: 76 }).toFile(`public${poster}`);
  const blur = await sharp(image).resize(24, 14, { fit: 'cover' }).webp({ quality: 35 }).toBuffer();
  map[film.poster.url] = { poster, blur: `data:image/webp;base64,${blur.toString('base64')}` };
}
await fs.writeFile('src/lib/preview-posters.json', JSON.stringify(map, null, 2) + '\n');
console.log(`Generated ${Object.keys(map).length} preview posters`);

await fs.writeFile('src/lib/preview-black-ranges.json', JSON.stringify(blackRanges, null, 2) + '\n');
