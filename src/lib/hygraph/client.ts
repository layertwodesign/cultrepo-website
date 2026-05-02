/**
 * Minimal Hygraph GraphQL client.
 *
 * Uses native fetch — no extra dependency. Reads from env:
 *   HYGRAPH_API_URL          — content endpoint, required when CMS is on
 *   HYGRAPH_READ_TOKEN       — optional bearer; only needed if the public API
 *                              is gated. Most projects expose Published stage
 *                              publicly and don't need a token for reads.
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

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    next: {
      tags: options?.tag ? [options.tag] : undefined,
      revalidate: options?.revalidate ?? 60,
    },
  });

  if (!res.ok) {
    console.error(`[hygraph] HTTP ${res.status}: ${await res.text()}`);
    return null;
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    console.error(`[hygraph] GraphQL errors:`, json.errors);
    return null;
  }
  return json.data ?? null;
}
