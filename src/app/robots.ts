import type { MetadataRoute } from "next";
import { SITE_URL, isSiteNoIndex } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Staging copies stay crawlable on purpose: crawlers must fetch pages to see
  // the X-Robots-Tag noindex header (next.config.ts). Blocking them here would
  // let already-linked review URLs linger in results.
  if (isSiteNoIndex) {
    return { rules: { userAgent: "*", allow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
