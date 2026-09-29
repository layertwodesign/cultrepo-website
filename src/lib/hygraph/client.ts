/**
 * Minimal Hygraph GraphQL client.
 *
 * Uses native fetch — no extra dependency. Reads from env:
 *   HYGRAPH_API_URL          — content endpoint, required when CMS is on
 *   HYGRAPH_READ_TOKEN       — optional bearer; only needed if the public API
 *                              is gated. Most projects expose Published stage
 *                              publicly and don't need a token for reads.
 *   HYGRAPH_STAGE            — optional; "DRAFT" makes a staging deploy read
 *                              unpublished edits. Anything else (or unset)
 *                              keeps the token's default, PUBLISHED.
 *
 * Returns null when the env isn't configured so callers can fall back to the
 * local hardcoded data during local dev / before the CMS is provisioned.
 */

export type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; path?: string[] }[];
};

const API_URL = process.env.HYGRAPH_API_URL;
const READ_TOKEN = process.env.HYGRAPH_READ_TOKEN;
const STAGE = process.env.HYGRAPH_STAGE === "DRAFT" ? "DRAFT" : null;

export const isHygraphConfigured = Boolean(API_URL);

export async function hygraphFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { tag?: string; revalidate?: number }
): Promise<T | null> {
  if (!API_URL) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (READ_TOKEN) headers.Authorization = `Bearer ${READ_TOKEN}`;
  if (STAGE) headers["gcms-stage"] = STAGE;

  const request = () => fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: {
      tags: options?.tag ? [options.tag] : undefined,
      revalidate: options?.revalidate ?? 60,
    },
  });

  let res = await request();
  // Brief build-time bursts can hit the CMS read limit. Honour its cooldown,
  // then fail instead of caching local fallback content as a successful page.
  for (let attempt = 0; res.status === 429 && attempt < 3; attempt++) {
    const retryAfter = res.headers.get("retry-after");
    const seconds = Number(retryAfter);
    const dateDelay = retryAfter ? Date.parse(retryAfter) - Date.now() : NaN;
    const delay = retryAfter && Number.isFinite(seconds)
      ? seconds * 1000
      : Number.isFinite(dateDelay) ? dateDelay : 1000 * 2 ** attempt;
    if (delay > 30000) throw new Error("Hygraph rate limited; retry after its cooldown");
    await new Promise((resolve) => setTimeout(resolve, Math.max(1000, delay)));
    res = await request();
  }

  if (!res.ok) {
    throw new Error(`Hygraph request failed (HTTP ${res.status})`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error("Hygraph returned GraphQL errors");
  }
  return json.data ?? null;
}
