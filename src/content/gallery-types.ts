/** One generated gallery raster: every width on disk plus its preview data. */
export interface GalleryAsset {
  /** Stable id, also the file prefix. */
  slug: string;
  /** Path without the `-<width>.webp` suffix. */
  base: string;
  /** Intrinsic size of the largest file - drives width/height attrs. */
  width: number;
  height: number;
  /** Widths that exist on disk, ascending. */
  widths: readonly number[];
  /** Dominant colour, painted behind the image while it loads. */
  color: string;
  /** 16px-wide WebP data URI, stretched behind the image as a blur. */
  blur: string;
  /** Written by hand in scripts/build-gallery.mjs. */
  alt: string;
}
