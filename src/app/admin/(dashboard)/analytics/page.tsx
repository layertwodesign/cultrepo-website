import AdminCardGrid from "@/components/AdminCardGrid";
import Sparkline from "@/components/Sparkline";
import { ANALYTICS_LINKS } from "@/app/admin/_data";
import {
  getGaSummary,
  getGaSpark,
  getGaTopPages,
  getGaTopReferrers,
  isGaConfigured,
  type GaTopRow,
} from "@/lib/ga";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

function formatDuration(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function pctDelta(cur: number, prev: number): { sign: "+" | "−" | ""; pct: string } {
  if (prev === 0) return { sign: "", pct: "—" };
  const diff = ((cur - prev) / prev) * 100;
  if (Math.abs(diff) < 0.5) return { sign: "", pct: "0%" };
  return { sign: diff > 0 ? "+" : "−", pct: `${Math.abs(diff).toFixed(0)}%` };
}

function TopList({ rows, label, hint }: { rows: GaTopRow[]; label: string; hint: string }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0) || 1;
  return (
    <div className="ga-list-card">
      <div className="ga-list-head">
        <span className="ga-list-label">{label}</span>
        <span className="ga-list-hint">{hint}</span>
      </div>
      {rows.length === 0 ? (
        <p className="ga-empty">No data yet.</p>
      ) : (
        <ul className="ga-list">
          {rows.map((row) => {
            const pct = (row.count / total) * 100;
            return (
              <li key={row.label} className="ga-list-row">
                <span className="ga-list-name" title={row.label}>{row.label}</span>
                <span className="ga-list-count">{formatNumber(row.count)}</span>
                <span className="ga-list-bar" aria-hidden>
                  <span className="ga-list-bar-fill" style={{ width: `${pct}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const [summary, spark, topPages, topReferrers] = await Promise.all([
    getGaSummary(),
    getGaSpark(30),
    getGaTopPages(8),
    getGaTopReferrers(8),
  ]);

  return (
    <div className="admin-hub">
      <header className="admin-hub-header">
        <div>
          <span className="admin-eyebrow">Analytics</span>
          <h1 className="admin-hub-title">Numbers</h1>
          <p className="admin-hub-blurb">
            {isGaConfigured
              ? "Last 7 days from Google Analytics, refreshed every 5 minutes."
              : "Connect the GA Data API to populate this page (instructions below). Vercel and Search Console links are always available."}
          </p>
        </div>
      </header>

      {/* Live GA stats — only render when configured */}
      {isGaConfigured ? (
        <>
          <section className="admin-section admin-stats-section">
            <ul className="admin-stat-grid">
              <li className="admin-stat">
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Visitors</span>
                  <span className="admin-stat-value">{formatNumber(summary?.visitors ?? 0)}</span>
                  <span className="admin-stat-hint ga-delta">
                    {(() => {
                      const d = pctDelta(summary?.visitors ?? 0, summary?.visitorsPrev ?? 0);
                      return d.sign ? `${d.sign}${d.pct} vs prior 7d` : "vs prior 7d";
                    })()}
                  </span>
                </div>
              </li>
              <li className="admin-stat">
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Page views</span>
                  <span className="admin-stat-value">{formatNumber(summary?.pageViews ?? 0)}</span>
                  <span className="admin-stat-hint ga-delta">
                    {(() => {
                      const d = pctDelta(summary?.pageViews ?? 0, summary?.pageViewsPrev ?? 0);
                      return d.sign ? `${d.sign}${d.pct} vs prior 7d` : "vs prior 7d";
                    })()}
                  </span>
                </div>
              </li>
              <li className="admin-stat">
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Sessions</span>
                  <span className="admin-stat-value">{formatNumber(summary?.sessions ?? 0)}</span>
                  <span className="admin-stat-hint">last 7 days</span>
                </div>
              </li>
              <li className="admin-stat">
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Avg engagement</span>
                  <span className="admin-stat-value">{formatDuration(summary?.avgEngagementSec ?? 0)}</span>
                  <span className="admin-stat-hint">per session</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="admin-section">
            <div className="admin-section-head">
              <h2 className="admin-section-title">Page views — last 30 days</h2>
              <p className="admin-section-blurb">Daily total across all routes.</p>
            </div>
            <div className="ga-spark-card">
              <Sparkline values={(spark ?? []).map((p) => p.views)} />
            </div>
          </section>

          <section className="admin-section">
            <div className="admin-section-head">
              <h2 className="admin-section-title">What people are seeing</h2>
              <p className="admin-section-blurb">
                Last 7 days. Top pages on the left, top traffic sources on the right.
              </p>
            </div>
            <div className="ga-lists-grid">
              <TopList rows={topPages ?? []} label="Top pages" hint="By page views" />
              <TopList rows={topReferrers ?? []} label="Top sources" hint="By sessions" />
            </div>
          </section>
        </>
      ) : (
        <section className="admin-section">
          <div className="ga-setup-card">
            <h2 className="ga-setup-title">Connect Google Analytics</h2>
            <p className="ga-setup-blurb">
              Once a GCP service account is wired up, this page populates with live numbers,
              a 30-day sparkline, top pages, and top traffic sources.
            </p>
            <ol className="ga-setup-list">
              <li>Google Cloud Console → enable <em>Google Analytics Data API</em>.</li>
              <li>Create a service account, download its JSON key.</li>
              <li>GA4 Admin → Property → Property Access → invite that service-account email as Viewer.</li>
              <li>
                Set two env vars on Vercel: <code>GA_PROPERTY_ID</code> (numeric, from GA Admin) and
                <code> GA_SERVICE_ACCOUNT_KEY_BASE64</code> (the JSON key, base64-encoded).
              </li>
            </ol>
          </div>
        </section>
      )}

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Open in dashboards</h2>
          <p className="admin-section-blurb">
            For the deeper view — funnel reports, custom dimensions, individual session paths.
          </p>
        </div>
        <AdminCardGrid items={ANALYTICS_LINKS} />
      </section>
    </div>
  );
}
