import Link from "next/link";
import AdminCardGrid from "@/components/AdminCardGrid";
import { PRODUCTION_LINKS } from "@/app/admin/_data";
import { getFilms } from "@/lib/films";
import { getTeam } from "@/lib/team";
import { hygraphFetch, isHygraphConfigured } from "@/lib/hygraph/client";

const HYGRAPH_BASE =
  "https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb";

async function fetchSponsorCount(): Promise<number | null> {
  if (!isHygraphConfigured) return null;
  const data = await hygraphFetch<{ sponsorsConnection: { aggregate: { count: number } } }>(
    `query SponsorCount { sponsorsConnection { aggregate { count } } }`,
    undefined,
    { revalidate: 300 }
  );
  return data?.sponsorsConnection?.aggregate?.count ?? null;
}

async function fetchAssetCount(): Promise<number | null> {
  if (!isHygraphConfigured) return null;
  const data = await hygraphFetch<{ assetsConnection: { aggregate: { count: number } } }>(
    `query AssetCount { assetsConnection { aggregate { count } } }`,
    undefined,
    { revalidate: 300 }
  );
  return data?.assetsConnection?.aggregate?.count ?? null;
}

type Stat = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
};

const TABS = [
  {
    title: "Content",
    href: "/admin/content",
    blurb: "Edit films, team, sponsors, and page copy. Publishing in Hygraph updates the live site within seconds.",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    blurb: "Visitor numbers, performance, search rankings, and YouTube channel metrics — all the dashboards in one place.",
  },
  {
    title: "Brand",
    href: "/admin/brand",
    blurb: "Logos, fonts, the OpenGraph card, and the colour palette. Click anything to download.",
  },
];

export default async function AdminHomePage() {
  const [films, team, sponsorCount, assetCount] = await Promise.all([
    getFilms(),
    getTeam(),
    fetchSponsorCount(),
    fetchAssetCount(),
  ]);

  const stats: Stat[] = [
    {
      label: "Films",
      value: String(films.length),
      hint: "Published",
      href: `${HYGRAPH_BASE}/content/f49b54ba54c64928bd20a4b5f24d94bb`,
    },
    {
      label: "Team",
      value: String(team.length),
      hint: "Members",
      href: `${HYGRAPH_BASE}/content/8015e91bca2e49fcaac93fbe886c9b36`,
    },
    {
      label: "Sponsors",
      value: sponsorCount != null ? String(sponsorCount) : "—",
      hint: sponsorCount != null ? "In CMS" : "CMS offline",
      href: `${HYGRAPH_BASE}/content/ca529d3f15a34d4a989399cff6b4ca80`,
    },
    {
      label: "Assets",
      value: assetCount != null ? String(assetCount) : "—",
      hint: assetCount != null ? "Images, videos" : "CMS offline",
      href: `${HYGRAPH_BASE}/assets`,
    },
  ];

  return (
    <div className="admin-hub">
      <header className="admin-hub-header">
        <div>
          <span className="admin-eyebrow">Dashboard</span>
          <h1 className="admin-hub-title">Welcome back.</h1>
          <p className="admin-hub-blurb">
            Everyday operations of cultrepo.com — content, analytics, brand. Anything you publish in
            Hygraph updates the live site automatically.
          </p>
        </div>
      </header>

      {/* Stats row */}
      <section className="admin-section admin-stats-section">
        <ul className="admin-stat-grid">
          {stats.map((s) => {
            const Inner = (
              <>
                <span className="admin-stat-label">{s.label}</span>
                <span className="admin-stat-value">{s.value}</span>
                {s.hint ? <span className="admin-stat-hint">{s.hint}</span> : null}
              </>
            );
            return (
              <li key={s.label} className="admin-stat">
                {s.href ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="admin-stat-card">
                    {Inner}
                    <span className="admin-stat-arrow" aria-hidden>↗</span>
                  </a>
                ) : (
                  <div className="admin-stat-card">{Inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Tabs as feature cards */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Where to go</h2>
          <p className="admin-section-blurb">Three tabs, four jobs.</p>
        </div>
        <ul className="admin-tab-grid">
          {TABS.map((t) => (
            <li key={t.href} className="admin-tab-li">
              <Link href={t.href} className="admin-tab-card">
                <span className="admin-tab-label">{t.title}</span>
                <p className="admin-tab-blurb">{t.blurb}</p>
                <span className="admin-tab-arrow" aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Production */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Production</h2>
          <p className="admin-section-blurb">Where the site lives and how it ships.</p>
        </div>
        <AdminCardGrid items={PRODUCTION_LINKS} />
      </section>

      <footer className="admin-hub-footer">
        <span>Need help? <a href="mailto:cam@layertwodesign.com">cam@layertwodesign.com</a></span>
        <span className="admin-hub-footer-mono">v1 · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
