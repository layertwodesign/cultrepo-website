import AdminCardGrid from "@/components/AdminCardGrid";
import { BRAND_LINKS } from "@/app/admin/_data";

const BRAND_COLORS = [
  {
    name: "Green",
    hex: "#87FF38",
    rgb: "rgb(135, 255, 56)",
    role: "Primary brand accent — buttons, focus states, links",
  },
  {
    name: "White",
    hex: "#FAFFFF",
    rgb: "rgb(250, 255, 255)",
    role: "Primary text, on-dark surfaces",
  },
  {
    name: "Black",
    hex: "#0D110F",
    rgb: "rgb(13, 17, 15)",
    role: "Primary background of every page",
  },
  {
    name: "Dark Green",
    hex: "#1A1E19",
    rgb: "rgb(26, 30, 25)",
    role: "Cards, chips, secondary CTA fills",
  },
];

const GREYS = [
  { name: "Grey 1", hex: "#F7F2E4", role: "Lightest neutral — rarely used on dark theme" },
  { name: "Grey 2", hex: "#D8D8CA", role: "Light neutral fill (placeholder backgrounds)" },
  { name: "Grey 3", hex: "#ADB0A0", role: "Mid neutral — disabled states" },
  { name: "Grey 4", hex: "#6E7366", role: "Secondary text, hint copy, icons" },
  { name: "Grey 5", hex: "#454940", role: "Primary border colour, dividers" },
  { name: "Grey 6", hex: "#282C26", role: "Hover surface, raised cards" },
];

const FONTS = [
  {
    name: "TT Interphases Pro",
    role: "Display + UI",
    weights: "300 / 400 / 500 / 600 / 700",
    use: "Headlines, body text, button labels.",
    fontFamilyVar: "var(--font-interphases)",
  },
  {
    name: "TT Interphases Pro Mono",
    role: "Labels, code, small caps",
    weights: "400 / 700",
    use: "Eyebrows, ticker, status pills, footers.",
    fontFamilyVar: "var(--font-interphases-mono)",
  },
];

function ColorTile({ color }: { color: { name: string; hex: string; role: string; rgb?: string } }) {
  return (
    <li className="admin-color">
      <span className="admin-color-swatch" style={{ background: color.hex }} aria-hidden />
      <div className="admin-color-meta">
        <span className="admin-color-name">{color.name}</span>
        <span className="admin-color-hex">{color.hex}</span>
        {color.rgb ? <span className="admin-color-role">{color.rgb}</span> : null}
        <span className="admin-color-role">{color.role}</span>
      </div>
    </li>
  );
}

export default function AdminBrandPage() {
  return (
    <div className="admin-hub">
      <header className="admin-hub-header">
        <div>
          <span className="admin-eyebrow">Brand</span>
          <h1 className="admin-hub-title">Brand kit</h1>
          <p className="admin-hub-blurb">
            Logos, fonts, the OpenGraph card, and the colour palette — values match the Figma brand
            guide. Click any download to save the file with a clean filename.
          </p>
        </div>
      </header>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Downloads</h2>
          <p className="admin-section-blurb">
            One-click downloads for every brand asset. Bundle archives at the top, individual files below.
          </p>
        </div>
        <AdminCardGrid items={BRAND_LINKS} />
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Brand colors</h2>
          <p className="admin-section-blurb">
            The four core swatches. Green is the only saturated accent in the system.
          </p>
        </div>
        <ul className="admin-color-grid">
          {BRAND_COLORS.map((c) => (
            <ColorTile key={c.hex} color={c} />
          ))}
        </ul>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Greys</h2>
          <p className="admin-section-blurb">
            Six neutrals from light to dark. On the live site we use Grey 4 (secondary text),
            Grey 5 (borders), and Grey 6 (raised surfaces) most often.
          </p>
        </div>
        <ul className="admin-color-grid">
          {GREYS.map((c) => (
            <ColorTile key={c.hex} color={c} />
          ))}
        </ul>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-title">Typography</h2>
          <p className="admin-section-blurb">
            Both families ship with the site and are bundled in the Fonts (.zip) on the admin home.
          </p>
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
                <span style={{ fontFamily: f.fontFamilyVar }}>Cult.Repo · 0123456789</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
