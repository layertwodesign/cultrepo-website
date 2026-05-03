import AdminCardGrid from "@/components/AdminCardGrid";
import { CONTENT_LINKS, HYGRAPH_BASE } from "@/app/admin/_data";

export default function AdminContentPage() {
  return (
    <div className="admin-hub">
      <header className="admin-hub-header">
        <div>
          <span className="admin-eyebrow">Content</span>
          <h1 className="admin-hub-title">Edit site content</h1>
          <p className="admin-hub-blurb">
            Each card opens directly into the matching content list inside Hygraph. Make a change,
            click <strong>Save & publish</strong>, and the live site picks it up within a few seconds.
          </p>
        </div>
        <a
          href={`${HYGRAPH_BASE}/content`}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-logout"
        >
          Open Hygraph ↗
        </a>
      </header>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Models</h2>
          <p className="admin-section-blurb">
            Each model represents a chunk of the site. Films and Team are lists; About / Sponsorship /
            Site Settings are single records.
          </p>
        </div>
        <AdminCardGrid items={CONTENT_LINKS} />
      </section>
    </div>
  );
}
