import type { Metadata } from "next";
import { preload } from "react-dom";
import PageShell from "@/components/page-shell";
import GalleryGrid from "@/components/gallery-grid";
import GalleryView from "@/components/gallery-view";
import { GALLERY } from "@/content/gallery.generated";
import { fallbackOf, srcSetOf } from "@/lib/image-urls";
import { JsonLd, PERSON_ID } from "@/lib/json-ld";
import { pageMeta, SITE_NAME, SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "A gallery of interface design by Negativ (Rohit Mehta): landing pages, dashboards, mobile screens and design explorations. Click any image to open it full size.";

export const metadata: Metadata = pageMeta(
  "Gallery",
  DESCRIPTION,
  "/gallery",
  `${SITE_NAME} · Gallery`,
  {
    url: "/gallery/og.jpg",
    width: 1200,
    height: 630,
    alt: "Interface screens from the Negativ gallery",
  },
);

export default function GalleryPage() {
  const first = GALLERY[0];

  // The first tile is the LCP element. One preload with the exact
  // srcset the grid will use means the browser picks the same candidate
  // it is about to render - no second request. The sizes list is a
  // simple viewport approximation on purpose: the preload scanner reads
  // it before layout, and a plain list resolves to the same candidate
  // as the grid's exact calc() list at every common width.
  preload(fallbackOf(first), {
    as: "image",
    imageSrcSet: srcSetOf(first),
    imageSizes: "(min-width: 1024px) 384px, 45vw",
    fetchPriority: "high",
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "@id": `${SITE_URL}/gallery#gallery`,
      name: "Design gallery",
      description: DESCRIPTION,
      url: `${SITE_URL}/gallery`,
      about: { "@id": PERSON_ID },
      creator: { "@id": PERSON_ID },
      image: GALLERY.map((item) => ({
        "@type": "ImageObject",
        contentUrl: `${SITE_URL}/gallery/${item.slug}-${item.widths[item.widths.length - 1]}.webp`,
        thumbnailUrl: `${SITE_URL}/gallery/${item.slug}-${item.widths[0]}.webp`,
        width: item.width,
        height: item.height,
        caption: item.alt,
        creator: { "@id": PERSON_ID },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Gallery", item: `${SITE_URL}/gallery` },
      ],
    },
  ];

  return (
    <PageShell active="gallery">
      <JsonLd data={jsonLd} />
      <section
        aria-labelledby="gallery-heading"
        className="w-full pt-16 pb-8 sm:pt-24 sm:pb-16 md:pt-32"
      >
        <header className="pb-8 sm:pb-10">
          {/* Kept for the outline and crawlers, hidden from the page. */}
          <h1 id="gallery-heading" className="sr-only">
            Gallery
          </h1>
          <p className="max-w-[58ch] text-[15px] leading-relaxed text-neutral-500">
            A running collection of interfaces, explorations and details.
            Click any image to open it full size.
          </p>
        </header>

        <GalleryView items={GALLERY}>
          <GalleryGrid />
        </GalleryView>
      </section>
    </PageShell>
  );
}
