/**
 * Google Analytics Data API helpers.
 *
 * Powered by a GCP service account. Set the following env vars in
 * Vercel + .env.local for these to work — without them the helpers
 * return null and the admin page renders empty states gracefully.
 *
 *   GA_PROPERTY_ID                   the numeric GA4 property ID (not the G-XXXX tag)
 *   GA_SERVICE_ACCOUNT_KEY_BASE64    base64-encoded JSON service-account key
 *
 * Setup (≈ 10 min, one-time):
 *   1. Google Cloud Console → APIs & Services → enable "Google Analytics Data API".
 *   2. Create a service account, grant role "Viewer" on the GCP project.
 *   3. Add a JSON key, download it.
 *   4. base64 it: `base64 -i path/to/key.json`
 *   5. In GA4 → Admin → Property → Property Access → invite the service-account
 *      email as Viewer.
 *   6. Property ID lives at GA4 → Admin → Property → Property Details (numeric).
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";

export const GA_CACHE_TAG = "ga";

let cachedClient: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient | null {
  if (cachedClient) return cachedClient;
  const b64 = process.env.GA_SERVICE_ACCOUNT_KEY_BASE64;
  if (!b64) return null;
  try {
    const json = Buffer.from(b64, "base64").toString("utf8");
    const credentials = JSON.parse(json);
    cachedClient = new BetaAnalyticsDataClient({ credentials });
    return cachedClient;
  } catch (err) {
    console.error("[ga] failed to parse GA_SERVICE_ACCOUNT_KEY_BASE64:", err);
    return null;
  }
}

function propertyPath(): string | null {
  const id = process.env.GA_PROPERTY_ID;
  if (!id) return null;
  return `properties/${id}`;
}

export const isGaConfigured = Boolean(
  process.env.GA_PROPERTY_ID && process.env.GA_SERVICE_ACCOUNT_KEY_BASE64
);

// ----------------------------------------------------------------- types

export type GaSummary = {
  pageViews: number;
  visitors: number;
  sessions: number;
  avgEngagementSec: number;
  // matching previous-period values for delta display
  pageViewsPrev: number;
  visitorsPrev: number;
};

export type GaTopRow = { label: string; count: number };

export type GaSparkPoint = { date: string; views: number };

// ----------------------------------------------------------------- helpers

async function safeRunReport<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[ga] runReport failed:", err);
    return fallback;
  }
}


// ----------------------------------------------------------------- public

async function runMetricsReport(
  client: BetaAnalyticsDataClient,
  property: string,
  startDate: string,
  endDate: string
) {
  const [resp] = await client.runReport({
    property,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "screenPageViews" },
      { name: "totalUsers" },
      { name: "sessions" },
      { name: "userEngagementDuration" },
    ],
  });
  const m = resp.rows?.[0]?.metricValues ?? [];
  return {
    pageViews: Number(m[0]?.value ?? 0),
    visitors: Number(m[1]?.value ?? 0),
    sessions: Number(m[2]?.value ?? 0),
    engagementSec: Number(m[3]?.value ?? 0),
  };
}

export async function getGaSummary(): Promise<GaSummary | null> {
  const client = getClient();
  const property = propertyPath();
  if (!client || !property) return null;

  return safeRunReport(async () => {
    const [cur, prev] = await Promise.all([
      runMetricsReport(client, property, "7daysAgo", "today"),
      runMetricsReport(client, property, "14daysAgo", "8daysAgo"),
    ]);
    const avgEngagementSec = cur.sessions > 0 ? cur.engagementSec / cur.sessions : 0;
    return {
      pageViews: cur.pageViews,
      visitors: cur.visitors,
      sessions: cur.sessions,
      avgEngagementSec,
      pageViewsPrev: prev.pageViews,
      visitorsPrev: prev.visitors,
    };
  }, null);
}

export async function getGaSpark(days = 30): Promise<GaSparkPoint[] | null> {
  const client = getClient();
  const property = propertyPath();
  if (!client || !property) return null;

  return safeRunReport(async () => {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: days + 1,
    });
    return (resp.rows ?? []).map((r) => ({
      date: r.dimensionValues?.[0]?.value ?? "",
      views: Number(r.metricValues?.[0]?.value ?? 0),
    }));
  }, null);
}

export async function getGaTopPages(limit = 8): Promise<GaTopRow[] | null> {
  const client = getClient();
  const property = propertyPath();
  if (!client || !property) return null;

  return safeRunReport(async () => {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit,
    });
    return (resp.rows ?? []).map((r) => ({
      label: r.dimensionValues?.[0]?.value ?? "(unknown)",
      count: Number(r.metricValues?.[0]?.value ?? 0),
    }));
  }, null);
}

export async function getGaTopReferrers(limit = 8): Promise<GaTopRow[] | null> {
  const client = getClient();
  const property = propertyPath();
  if (!client || !property) return null;

  return safeRunReport(async () => {
    const [resp] = await client.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit,
    });
    return (resp.rows ?? [])
      .map((r) => ({
        label: r.dimensionValues?.[0]?.value ?? "(direct)",
        count: Number(r.metricValues?.[0]?.value ?? 0),
      }))
      .filter((r) => r.label !== "(not set)");
  }, null);
}
