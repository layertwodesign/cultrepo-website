import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "us-west-2.cdn.hygraph.com" },
      { protocol: "https", hostname: "us-west-2.graphassets.com" },
      { protocol: "https", hostname: "media.graphassets.com" },
      // YouTube thumbnails for the film-page player facade.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
  async headers() {
    // The grain tile loads on every page. /public files aren't fingerprinted,
    // so cache for a day and revalidate in the background, not forever.
    // (/_next/static is already immutable; routes are left alone.)
    const assets = [
      {
        source: "/noise-tile.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
    // Staging copies set SITE_NOINDEX=1 so review links stay out of search results.
    if (process.env.SITE_NOINDEX !== "1") return assets;
    return [
      ...assets,
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async redirects() {
    return [
      // Map cultrepo.com (Webflow) /documentaries/* slugs to the new /films/*.
      // Slug remaps come first; the catch-all below handles unchanged slugs.
      { source: "/documentaries/ember-js", destination: "/films/emberjs", permanent: true },
      { source: "/documentaries/kubernetes-part-1", destination: "/films/kubernetes", permanent: true },
      { source: "/documentaries/kubernetes-part-2", destination: "/films/kubernetes", permanent: true },
      { source: "/documentaries/node-js", destination: "/films/nodejs", permanent: true },
      { source: "/documentaries/react-js", destination: "/films/react", permanent: true },
      { source: "/documentaries/vue-js", destination: "/films/vuejs", permanent: true },
      { source: "/documentaries/:slug", destination: "/films/:slug", permanent: true },

      // Mini-docs don't have a 1:1 equivalent — send to the YouTube channel.
      { source: "/minidocs/:slug*", destination: "https://www.youtube.com/@cultrepo", permanent: true },

      // Old standalone pages → new equivalents
      { source: "/subscribe", destination: "/", permanent: true },
      { source: "/sponsor", destination: "/sponsorship", permanent: true },
      { source: "/team", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
