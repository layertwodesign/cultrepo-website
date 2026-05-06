import Link from "next/link";
import type { LinkItem, Preview } from "@/app/admin/_data";

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
      <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}>Aa</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 400 }}>Aa</span>
    </div>
  );
}

export default function AdminCardGrid({ items }: { items: LinkItem[] }) {
  const hasPreview = items.some((i) => i.preview);
  return (
    <ul className={`admin-card-grid${hasPreview ? " admin-card-grid-with-preview" : ""}`}>
      {items.map((item) => {
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
              <span className="admin-card-arrow" aria-hidden>{arrow}</span>
            </Anchor>
          </li>
        );
      })}
    </ul>
  );
}
