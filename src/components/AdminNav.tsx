"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Dashboard", match: (p: string) => p === "/admin" },
  { href: "/admin/content", label: "Content", match: (p: string) => p.startsWith("/admin/content") },
  { href: "/admin/analytics", label: "Analytics", match: (p: string) => p.startsWith("/admin/analytics") },
  { href: "/admin/brand", label: "Brand", match: (p: string) => p.startsWith("/admin/brand") },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="admin-nav">
      <div className="admin-nav-inner">
        <Link href="/admin" className="admin-nav-mark" aria-label="Admin home">
          <span className="admin-nav-mark-glyph" aria-hidden />
          <span className="admin-nav-mark-text">CultRepo · Admin</span>
        </Link>

        <nav className="admin-nav-tabs" aria-label="Admin sections">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`admin-nav-tab${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-nav-actions">
          <Link href="/" className="admin-nav-link" target="_blank" rel="noopener noreferrer">
            View site ↗
          </Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="admin-nav-logout">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
