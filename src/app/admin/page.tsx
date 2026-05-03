import Link from "next/link";

const HYGRAPH_BASE =
  "https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb";

const VERCEL_PROJECT =
  "https://vercel.com/layertwo/cultrepo-website";

type LinkItem = {
  label: string;
  href: string;
  hint?: string;
  external?: boolean;
};

type Section = {
  title: string;
  blurb: string;
  items: LinkItem[];
};

const SECTIONS: Section[] = [
  {
    title: "Edit site content",
    blurb:
      "Every editable surface lives in Hygraph. Publish there and the live site updates within seconds.",
    items: [
      { label: "Films", href: `${HYGRAPH_BASE}/content/film`, hint: "Add/edit films + assets", external: true },
      { label: "Team", href: `${HYGRAPH_BASE}/content/teamMember`, hint: "Headshots, bios", external: true },
      { label: "Sponsors", href: `${HYGRAPH_BASE}/content/sponsor`, hint: "Logos + names", external: true },
      { label: "About page", href: `${HYGRAPH_BASE}/content/aboutPage`, hint: "Hero, story, stats, CTA", external: true },
      { label: "Sponsorship page", href: `${HYGRAPH_BASE}/content/sponsorshipPage`, hint: "Hero copy + form recipient", external: true },
      { label: "Site settings", href: `${HYGRAPH_BASE}/content/siteSettings`, hint: "Featured film, social URLs", external: true },
      { label: "Asset library", href: `${HYGRAPH_BASE}/assets`, hint: "Upload images, videos", external: true },
    ],
  },
  {
    title: "Analytics & SEO",
    blurb:
      "Visitor numbers, performance, and how people find the site.",
    items: [
      { label: "Vercel Web Analytics", href: `${VERCEL_PROJECT}/analytics`, hint: "Traffic, top pages, referrers", external: true },
      { label: "Speed Insights", href: `${VERCEL_PROJECT}/speed-insights`, hint: "Core Web Vitals (LCP, INP, CLS)", external: true },
      { label: "Google Search Console", href: "https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.cultrepo.com%2F", hint: "Search rankings, indexing", external: true },
      { label: "Google Analytics 4", href: "https://analytics.google.com/", hint: "If/when wired up", external: true },
      { label: "YouTube Studio", href: "https://studio.youtube.com/", hint: "Channel metrics", external: true },
    ],
  },
  {
    title: "Brand kit",
    blurb:
      "Logos, fonts, color tokens, and the OpenGraph card. Use these when posting about CultRepo anywhere.",
    items: [
      { label: "Wordmark (SVG)", href: "/logo-wordmark.svg", hint: "Vector — scales infinitely", external: true },
      { label: "Ghost (SVG)", href: "/ghost.svg", hint: "Vector mascot", external: true },
      { label: "Ghost (PNG)", href: "/ghost.png", hint: "For places SVG isn't supported", external: true },
      { label: "OpenGraph card", href: "/opengraph-image.png", hint: "1200×630, share preview", external: true },
      { label: "Color & font reference", href: "/admin/brand", hint: "Palette + typography spec" },
    ],
  },
  {
    title: "Production",
    blurb: "Where the site lives and how to ship.",
    items: [
      { label: "Vercel project", href: VERCEL_PROJECT, hint: "Deploys, domains, env vars", external: true },
      { label: "GitHub repo", href: "https://github.com/layertwodesign/cultrepo-website", hint: "Source code", external: true },
      { label: "Hygraph webhooks", href: `${HYGRAPH_BASE}/settings/webhooks`, hint: "Revalidation hooks", external: true },
    ],
  },
];

export default function AdminHubPage() {
  return (
    <div className="admin-hub">
      <header className="admin-hub-header">
        <div>
          <span className="admin-eyebrow">CultRepo</span>
          <h1 className="admin-hub-title">Admin</h1>
          <p className="admin-hub-blurb">
            One place for the everyday operations of cultrepo.com — content, analytics, and brand.
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="admin-logout">Sign out</button>
        </form>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className="admin-section">
          <div className="admin-section-head">
            <h2 className="admin-section-title">{section.title}</h2>
            <p className="admin-section-blurb">{section.blurb}</p>
          </div>
          <ul className="admin-card-grid">
            {section.items.map((item) => {
              const Anchor = item.external ? "a" : Link;
              const externalProps = item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};
              return (
                <li key={item.label} className="admin-card-li">
                  <Anchor href={item.href} {...externalProps} className="admin-card">
                    <span className="admin-card-label">{item.label}</span>
                    {item.hint ? <span className="admin-card-hint">{item.hint}</span> : null}
                    <span className="admin-card-arrow" aria-hidden>
                      {item.external ? "↗" : "→"}
                    </span>
                  </Anchor>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <footer className="admin-hub-footer">
        <span>Need help? <a href="mailto:cam@layertwodesign.com">cam@layertwodesign.com</a></span>
        <span className="admin-hub-footer-mono">v1 · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
