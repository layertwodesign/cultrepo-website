import Link from "next/link";

const COLORS = [
  { name: "Background", hex: "#0D110F", role: "Primary site background" },
  { name: "Surface", hex: "#1A1E19", role: "Dark green for CTAs and chips" },
  { name: "Surface raised", hex: "#282C26", role: "Hover state, raised cards" },
  { name: "Border", hex: "#454940", role: "Grey-6 — borders, dividers" },
  { name: "Muted", hex: "#6E7366", role: "Secondary text, icons" },
  { name: "Text", hex: "#FAFFFF", role: "Primary text, white" },
  { name: "Accent", hex: "#87FF38", role: "Brand green — buttons, links" },
];

const FONTS = [
  {
    name: "TT Interphases Pro",
    role: "Display + UI",
    weights: "300 / 400 / 500 / 600 / 700",
    use: "Headlines, body text, button labels.",
  },
  {
    name: "TT Interphases Pro Mono",
    role: "Labels, code, small caps",
    weights: "400 / 700",
    use: "Eyebrows, ticker, status pills, footers.",
  },
];

export default function AdminBrandPage() {
  return (
    <div className="admin-hub">
      <header className="admin-hub-header">
        <div>
          <span className="admin-eyebrow">Brand</span>
          <h1 className="admin-hub-title">Reference</h1>
          <p className="admin-hub-blurb">
            Colors and typography used on cultrepo.com. Bring these along when you post about CultRepo
            outside the site.
          </p>
        </div>
        <Link href="/admin" className="admin-logout">← Back</Link>
      </header>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Colors</h2>
          <p className="admin-section-blurb">Click any swatch to copy its hex.</p>
        </div>
        <ul className="admin-color-grid">
          {COLORS.map((c) => (
            <li key={c.hex} className="admin-color">
              <span className="admin-color-swatch" style={{ background: c.hex }} aria-hidden />
              <div className="admin-color-meta">
                <span className="admin-color-name">{c.name}</span>
                <span className="admin-color-hex">{c.hex}</span>
                <span className="admin-color-role">{c.role}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Typography</h2>
          <p className="admin-section-blurb">Both weights of the family ship with the site.</p>
        </div>
        <ul className="admin-type-list">
          {FONTS.map((f) => (
            <li key={f.name} className="admin-type-row">
              <div className="admin-type-meta">
                <span className="admin-type-name">{f.name}</span>
                <span className="admin-type-role">{f.role}</span>
                <span className="admin-type-weights">Weights: {f.weights}</span>
                <span className="admin-type-use">{f.use}</span>
              </div>
              <div className="admin-type-sample">
                <span style={{ fontFamily: f.name.includes("Mono") ? "var(--font-interphases-mono)" : "var(--font-interphases)" }}>
                  Cult.Repo · 0123456789
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
