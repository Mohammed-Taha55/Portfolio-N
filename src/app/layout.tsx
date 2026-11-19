import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import RouteScroll from "@/components/route-scroll";
import SiteAnalytics from "@/components/site-analytics";
import { JsonLd, personJsonLd } from "@/lib/json-ld";
import { HOME_DESCRIPTION, HOME_TITLE, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

/* next/font self-hosts each family at build time, subsets it to latin,
   sets font-display: swap and generates a size-adjusted fallback face,
   so the swap from system font to Geist moves no text. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/* Mono only appears in the lab and small labels below the fold, so it
   is not preloaded: no second font file on the homepage critical path. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

/* Light-only site: tell the browser the page supports just the light
   color scheme, so OS-level dark mode never re-themes form controls,
   scrollbars, or UA defaults anywhere - including the swap widget. */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fafcfd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <JsonLd data={personJsonLd} />
        {/* without JS nothing would release the deferred images */}
        <noscript>
          <style>{"[data-after-load] img{display:block!important}"}</style>
        </noscript>
        <Nav />
        <RouteScroll />
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
