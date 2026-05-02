import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "us-west-2.cdn.hygraph.com" },
      { protocol: "https", hostname: "us-west-2.graphassets.com" },
      { protocol: "https", hostname: "media.graphassets.com" },
    ],
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
