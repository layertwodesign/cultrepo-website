import AdminCardGrid from "@/components/AdminCardGrid";
import { ANALYTICS_LINKS } from "@/app/admin/_data";

export default function AdminAnalyticsPage() {
  return (
    <div className="admin-hub">
      <header className="admin-hub-header">
        <div>
          <span className="admin-eyebrow">Analytics</span>
          <h1 className="admin-hub-title">Numbers</h1>
          <p className="admin-hub-blurb">
            Visitor traffic, performance, and discovery — all the dashboards that matter for
            cultrepo.com, in one place. Each opens in a new tab.
          </p>
        </div>
      </header>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Site &amp; SEO</h2>
          <p className="admin-section-blurb">
            Vercel keeps the realtime traffic and Core Web Vitals; Search Console shows what Google
            sees.
          </p>
        </div>
        <AdminCardGrid items={ANALYTICS_LINKS} />
      </section>
    </div>
  );
}
