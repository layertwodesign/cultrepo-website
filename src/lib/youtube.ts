/**
 * YouTube Data API v3 stats fetch with Next.js cache.
 *
 * Returns the live view/like/comment counts for a video. Cached for 1 hour
 * via Next's `revalidate`. Falls back to `null` if the API key is missing
 * or the request fails — callers should render a placeholder ("—") in that
 * case rather than throwing.
 */

export type VideoStats = {
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

const API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_SECONDS = 60 * 60; // 1 hour

export async function getVideoStats(
  youtubeId: string | null | undefined
): Promise<VideoStats | null> {
  if (!API_KEY || !youtubeId) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(
      youtubeId
    )}&key=${API_KEY}`;
    const res = await fetch(url, {
      next: { revalidate: CACHE_SECONDS, tags: ["youtube-stats"] },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: { statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }[];
    };
    const stats = json.items?.[0]?.statistics;
    if (!stats) return null;
    return {
      viewCount: Number(stats.viewCount ?? 0),
      likeCount: Number(stats.likeCount ?? 0),
      commentCount: Number(stats.commentCount ?? 0),
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
