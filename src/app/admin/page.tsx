import Link from "next/link";

const HYGRAPH_BASE =
  "https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb";

const VERCEL_PROJECT =
  "https://vercel.com/layertwo/cultrepo-website";

type Preview =
  | { kind: "image"; src: string; bg?: string; fit?: "contain" | "cover"; padded?: boolean }
  | { kind: "palette"; colors: string[] }
  | { kind: "fonts" };

type LinkItem = {
  label: string;
  href: string;
  hint?: string;
  external?: boolean;
  download?: string | boolean;
  preview?: Preview;
};

type Section = {
  title: string;
  blurb: string;
  items: LinkItem[];
};

// Per Figma brand guide: 4 brand swatches + 6 greys.
const PALETTE = [
  "#0D110F", // Black
  "#1A1E19", // Dark Green
  "#282C26", // Grey 6
  "#454940", // Grey 5
  "#6E7366", // Grey 4
  "#ADB0A0", // Grey 3
  "#D8D8CA", // Grey 2
  "#F7F2E4", // Grey 1
  "#FAFFFF", // White
  "#87FF38", // Green
];

const SECTIONS: Section[] = [
  {
    title: "Edit site content",
    blurb:
      "Every editable surface lives in Hygraph. Publish there and the live site updates within seconds.",
    items: [
      { label: "Films", href: `${HYGRAPH_BASE}/content/f49b54ba54c64928bd20a4b5f24d94bb`, hint: "Add/edit films + assets", external: true },
      { label: "Team", href: `${HYGRAPH_BASE}/content/8015e91bca2e49fcaac93fbe886c9b36`, hint: "Headshots, bios", external: true },
      { label: "Sponsors", href: `${HYGRAPH_BASE}/content/ca529d3f15a34d4a989399cff6b4ca80`, hint: "Logos + names", external: true },
      { label: "About page", href: `${HYGRAPH_BASE}/content/266e5d1629ea4a1c98ac2cf5f3d7a299`, hint: "Hero, story, stats, CTA", external: true },
      { label: "Sponsorship page", href: `${HYGRAPH_BASE}/content/6a2865781fbc491f92cbf477ab370804`, hint: "Hero copy + form recipient", external: true },
      { label: "Site settings", href: `${HYGRAPH_BASE}/content/cea3a89ae6154522a562f4caa728f1c9`, hint: "Featured film, social URLs", external: true },
      { label: "Asset library", href: `${HYGRAPH_BASE}/assets`, hint: "Upload images and videos", external: true },
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
      "Logos, fonts, color tokens, and the OpenGraph card. Click to download.",
    items: [
      {
        label: "Brand pack (.zip)",
        href: "/cultrepo-brand.zip",
        hint: "Wordmark + ghost + OG card, all in one",
        download: "cultrepo-brand.zip",
        preview: { kind: "image", src: "/opengraph-image.png", fit: "cover" },
      },
      {
        label: "Fonts (.zip)",
        href: "/cultrepo-fonts.zip",
        hint: "Interphases Pro + Mono — 7 weights",
        download: "cultrepo-fonts.zip",
        preview: { kind: "fonts" },
      },
      {
        label: "Wordmark (SVG)",
        href: "/logo-wordmark.svg",
        hint: "Vector — scales infinitely",
        download: "cultrepo-wordmark.svg",
        preview: { kind: "image", src: "/logo-wordmark.svg", bg: "#1A1E19", fit: "contain", padded: true },
      },
      {
        label: "Ghost (SVG)",
        href: "/ghost.svg",
        hint: "Vector mascot",
        download: "cultrepo-ghost.svg",
        preview: { kind: "image", src: "/ghost.svg", bg: "#87FF38", fit: "contain", padded: true },
      },
      {
        label: "Ghost (PNG)",
        href: "/ghost.png",
        hint: "For places SVG isn't supported",
        download: "cultrepo-ghost.png",
        preview: { kind: "image", src: "/ghost.png", bg: "#87FF38", fit: "contain", padded: true },
      },
      {
        label: "OpenGraph card",
        href: "/opengraph-image.png",
        hint: "1200×630, share preview",
        download: "cultrepo-og.png",
        preview: { kind: "image", src: "/opengraph-image.png", fit: "cover" },
      },
      {
        label: "Color & font reference",
        href: "/admin/brand",
        hint: "Palette + typography spec",
        preview: { kind: "palette", colors: PALETTE },
      },
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

function CardPreview({ preview }: { preview: Preview }) {
  if (preview.kind === "image") {
    const style: React.CSSProperties = preview.bg ? { background: preview.bg } : {};
    return (
      <div className={`admin-card-preview${preview.padded ? " admin-card-preview-padded" : ""}`} style={style}>
        <img
          src={preview.src}
          alt=""
          className="admin-card-preview-img"
          style={{ objectFit: preview.fit ?? "cover" }}
        />
      </div>
    );
  }
  if (preview.kind === "palette") {
    return (
      <div className="admin-card-preview admin-card-preview-palette">
        {preview.colors.map((c) => (
          <span key={c} className="admin-card-palette-swatch" style={{ background: c }} />
        ))}
      </div>
    );
  }
  return (
    <div className="admin-card-preview admin-card-preview-fonts">
      <span style={{ fontFamily: "var(--font-interphases)", fontWeight: 600 }}>Aa</span>
      <span style={{ fontFamily: "var(--font-interphases-mono)", fontWeight: 400 }}>Aa</span>
    </div>
  );
}

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
          <ul className={`admin-card-grid${section.items.some((i) => i.preview) ? " admin-card-grid-with-preview" : ""}`}>
            {section.items.map((item) => {
              const isDownload = Boolean(item.download);
              const Anchor: React.ElementType = isDownload || item.external ? "a" : Link;
              const externalProps = item.external && !isDownload
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};
              const downloadProps = isDownload
                ? { download: typeof item.download === "string" ? item.download : true }
                : {};
              const arrow = isDownload ? "↓" : item.external ? "↗" : "→";
              return (
                <li key={item.label} className="admin-card-li">
                  <Anchor href={item.href} {...externalProps} {...downloadProps} className="admin-card">
                    {item.preview ? <CardPreview preview={item.preview} /> : null}
                    <div className="admin-card-body">
                      <span className="admin-card-label">{item.label}</span>
                      {item.hint ? <span className="admin-card-hint">{item.hint}</span> : null}
                    </div>
                    <span className="admin-card-arrow" aria-hidden>
                      {arrow}
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
