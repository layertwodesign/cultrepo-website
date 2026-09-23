/**
 * YouTube stats. The film route caches the small parsed result hourly.
 *
 * Prefer the Data API when configured, then use the public watch page's
 * player metadata for views. Unavailable counts stay null, never a fake zero.
 */

export type VideoStats = {
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
};

function parseCount(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const count = Number(value);
  return Number.isSafeInteger(count) ? count : null;
}

async function getApiStats(youtubeId: string, apiKey: string): Promise<VideoStats | null> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.search = new URLSearchParams({ part: "statistics", id: youtubeId, key: apiKey }).toString();
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const stats = json.items?.find((item: { id?: string }) => item.id === youtubeId)?.statistics;
    const viewCount = parseCount(stats?.viewCount);
    if (viewCount === null) return null;
    return {
      viewCount,
      likeCount: parseCount(stats?.likeCount),
      commentCount: parseCount(stats?.commentCount),
    };
  } catch {
    return null;
  }
}

export async function getVideoStats(
  youtubeId: string | null | undefined
): Promise<VideoStats | null> {
  if (!youtubeId || !/^[\w-]{11}$/.test(youtubeId)) return null;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    const stats = await getApiStats(youtubeId, apiKey);
    if (stats) return stats;
  }

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${youtubeId}&hl=en`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Parse only the player response, never counts belonging to related videos.
    const playerJson = html.match(
      /<script\b[^>]*>\s*var ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\})\s*;\s*<\/script>/
    )?.[1];
    if (!playerJson) return null;
    const details = JSON.parse(playerJson).videoDetails;
    if (details?.videoId !== youtubeId) return null;
    const viewCount = parseCount(details.viewCount);
    if (viewCount === null) return null;
    return {
      viewCount,
      likeCount: null,
      commentCount: null,
    };
  } catch {
    return null;
  }
}

export function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
