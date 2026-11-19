import { PERSON_NAME, PERSON_REAL_NAME, SITE_URL } from "@/lib/site";

/** Same Person entity everywhere, referenced by @id from CreativeWork. */
export const PERSON_ID = `${SITE_URL}/#person`;

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: PERSON_NAME,
  alternateName: PERSON_REAL_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/avatar/dp-768.webp`,
  jobTitle: "Product designer",
  sameAs: [
    "https://github.com/negativ14",
    "https://x.com/rohitmehta_twt",
    "https://www.linkedin.com/in/rohitmehta14",
  ],
};

/**
 * Server-rendered JSON-LD. `<` is escaped so a string in the data can
 * never close the script tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
