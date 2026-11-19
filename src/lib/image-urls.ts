/**
 * Pure URL helpers shared by server and client. Deliberately free of
 * the generated manifest, so client code that imports these never pulls
 * the blur data URIs into its bundle.
 */

export interface WarmTarget {
  base: string;
  widths: readonly number[];
  sizes: string;
}

type Files = Pick<WarmTarget, "base" | "widths">;

export const srcSetOf = (a: Files): string =>
  a.widths.map((w) => `${a.base}-${w}.webp ${w}w`).join(", ");

/** `src` fallback for browsers without srcset: the ~1080px file. */
export const fallbackOf = (a: Files): string => {
  const w = a.widths.find((x) => x >= 1080) ?? a.widths[a.widths.length - 1];
  return `${a.base}-${w}.webp`;
};

/**
 * `sizes` for every image slot on the site. Each value mirrors the CSS
 * width of its slot exactly; the prefetcher reuses the same strings, so
 * the file it warms is the file the page will ask for.
 * Page well: 1200px max, 16px gutters (<640px), 32px gutters (>=640px).
 */
export const SIZES = {
  /** case-study images: the full well */
  full: "(min-width: 1264px) 1200px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 32px)",
  /** homepage posters and compare columns: half the well, 32px gap */
  half: "(min-width: 1264px) 584px, (min-width: 768px) calc(50vw - 48px), (min-width: 640px) calc(100vw - 64px), calc(100vw - 32px)",
  /** a single phone screen, centred inside its own full-width band */
  phone: "(min-width: 1200px) 420px, (min-width: 640px) 380px, min(calc(100vw - 64px), 320px)",
  /** filmstrip: six phones in a row from md, a snap-scroller below it */
  film: "(min-width: 1264px) 187px, (min-width: 768px) calc((100vw - 144px) / 6), 240px",
  /** before/after close-ups: two across the reading column, stacked below md */
  pair: "(min-width: 1264px) 438px, (min-width: 768px) calc(37.5vw - 44px), calc(100vw - 32px)",
  /** zoomed crops inside the full-width grey band (48 / 32 / 16px inset) */
  stage: "(min-width: 1264px) 1104px, (min-width: 768px) calc(100vw - 160px), (min-width: 640px) calc(100vw - 128px), calc(100vw - 64px)",
  /** prev/next thumbnails */
  thumb: "(min-width: 768px) 160px, 112px",
  /** gallery columns: 3 at/above lg, 2 below, 24/16px gaps */
  gallery:
    "(min-width: 1264px) 384px, (min-width: 1024px) calc((100vw - 112px) / 3), (min-width: 768px) calc((100vw - 88px) / 2), (min-width: 640px) calc((100vw - 80px) / 2), calc((100vw - 48px) / 2)",
  /** full-screen preview: the padded viewport, so 2x screens get 2400 */
  lightbox:
    "(min-width: 768px) calc(100vw - 96px), (min-width: 640px) calc(100vw - 64px), calc(100vw - 32px)",
} as const;

export type SizesKey = keyof typeof SIZES;
