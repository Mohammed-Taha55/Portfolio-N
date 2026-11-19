/** Canonical site facts every page's metadata builds on. */

import type { Metadata } from "next";

export const SITE_URL = "https://negativ.in";
export const SITE_NAME = "Negativ's Portfolio";
export const PERSON_NAME = "Negativ";
export const PERSON_REAL_NAME = "Rohit Mehta";

export const HOME_TITLE = `${SITE_NAME} · Designer who ships code`;
export const HOME_DESCRIPTION = `${PERSON_NAME} (${PERSON_REAL_NAME}), a designer who ships code. Landing page and dashboard case studies: Umami, See.io, takeUforward, Novq, Nuvex, Opsec, RunGTM.`;

/* One card for every link preview: the portrait, the name and the role
   on the site's off-white. 1200x630 is the size X, Slack, iMessage and
   LinkedIn all crop predictably. Pages that build their own openGraph
   object REPLACE the layout's wholesale, so the image has to live here
   and be spread into every page - leaving it only in the root layout
   silently drops it from every route that sets its own title. */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${PERSON_NAME}, a designer who ships code`,
} as const;

export interface ShareImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export const pageMeta = (
  page: string,
  description: string,
  path: string,
  title = `${SITE_NAME} · ${page}`,
  image: ShareImage = OG_IMAGE,
  type: "website" | "article" = "website",
): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    type,
    locale: "en_US",
    siteName: SITE_NAME,
    title,
    description,
    url: path,
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [{ url: image.url, alt: image.alt }],
  },
});
