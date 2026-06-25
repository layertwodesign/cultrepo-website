import type { Metadata } from "next";
import { Inter, Fragment_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

const SITE_TITLE =
  "CultRepo | Documenting the People Building World-Shaping Tech";
const SITE_DESCRIPTION =
  "CultRepo documents the people building world-shaping tech. Long-form films about the people behind open source, infrastructure, and emerging systems.";
const SITE_URL = "https://www.cultrepo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | CultRepo",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "CultRepo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@cultrepo",
    creator: "@cultrepo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fragmentMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.google.com" />
      </head>
      <body>
        {/* Pre-paint: hide the hamburger on the homepage until the intro
            finishes. Runs synchronously during HTML parse — before the nav is
            even parsed — so there is no flash of the menu over the loading
            screen. HomePageClient's effect clears `intro-running` once the
            intro completes, and this never adds it on return visits (same
            sessionStorage flag) or on non-home routes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(location.pathname==='/'&&sessionStorage.getItem('cultrepo-intro-seen')!=='1')document.body.classList.add('intro-running')}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
