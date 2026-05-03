/**
 * Shared link sets / palette used across the admin tabs.
 * Lives at /admin/_data.ts (the leading underscore opts out of routing).
 */

export const HYGRAPH_BASE =
  "https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb";

export const VERCEL_PROJECT =
  "https://vercel.com/layertwo/cultrepo-website";

export type Preview =
  | { kind: "image"; src: string; bg?: string; fit?: "contain" | "cover"; padded?: boolean }
  | { kind: "palette"; colors: string[] }
  | { kind: "fonts" };

export type LinkItem = {
  label: string;
  href: string;
  hint?: string;
  external?: boolean;
  download?: string | boolean;
  preview?: Preview;
};

// Per Figma brand guide
export const PALETTE = [
  "#0D110F",
  "#1A1E19",
  "#282C26",
  "#454940",
  "#6E7366",
  "#ADB0A0",
  "#D8D8CA",
  "#F7F2E4",
  "#FAFFFF",
  "#87FF38",
];

export const CONTENT_LINKS: LinkItem[] = [
  { label: "Films", href: `${HYGRAPH_BASE}/content/f49b54ba54c64928bd20a4b5f24d94bb`, hint: "Add/edit films + assets", external: true },
  { label: "Team", href: `${HYGRAPH_BASE}/content/8015e91bca2e49fcaac93fbe886c9b36`, hint: "Headshots, bios", external: true },
  { label: "Sponsors", href: `${HYGRAPH_BASE}/content/ca529d3f15a34d4a989399cff6b4ca80`, hint: "Logos + names", external: true },
  { label: "About page", href: `${HYGRAPH_BASE}/content/266e5d1629ea4a1c98ac2cf5f3d7a299`, hint: "Hero, story, stats, CTA", external: true },
  { label: "Sponsorship page", href: `${HYGRAPH_BASE}/content/6a2865781fbc491f92cbf477ab370804`, hint: "Hero copy + form recipient", external: true },
  { label: "Site settings", href: `${HYGRAPH_BASE}/content/cea3a89ae6154522a562f4caa728f1c9`, hint: "Featured film, social URLs", external: true },
  { label: "Asset library", href: `${HYGRAPH_BASE}/assets`, hint: "Upload images and videos", external: true },
];

export const ANALYTICS_LINKS: LinkItem[] = [
  { label: "Vercel Web Analytics", href: `${VERCEL_PROJECT}/analytics`, hint: "Traffic, top pages, referrers", external: true },
  { label: "Speed Insights", href: `${VERCEL_PROJECT}/speed-insights`, hint: "Core Web Vitals (LCP, INP, CLS)", external: true },
  { label: "Google Search Console", href: "https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.cultrepo.com%2F", hint: "Search rankings, indexing", external: true },
  { label: "Google Analytics 4", href: "https://analytics.google.com/", hint: "If/when wired up", external: true },
  { label: "YouTube Studio", href: "https://studio.youtube.com/", hint: "Channel metrics", external: true },
];

export const PRODUCTION_LINKS: LinkItem[] = [
  { label: "Vercel project", href: VERCEL_PROJECT, hint: "Deploys, domains, env vars", external: true },
  { label: "GitHub repo", href: "https://github.com/layertwodesign/cultrepo-website", hint: "Source code", external: true },
  { label: "Hygraph webhooks", href: `${HYGRAPH_BASE}/settings/webhooks`, hint: "Revalidation hooks", external: true },
];

export const BRAND_LINKS: LinkItem[] = [
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
];
