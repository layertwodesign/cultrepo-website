import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import NotFoundGhost from "@/components/NotFoundGhost";

export const metadata: Metadata = {
  title: "Page not found",
};

// Root not-found handles both unmatched URLs and notFound() calls inside
// (site), so it brings its own copy of the site chrome.
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundGhost />
    </SiteShell>
  );
}
