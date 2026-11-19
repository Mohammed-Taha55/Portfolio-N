/** One generated raster: every width on disk plus what it needs to load cleanly. */
export interface ImageAsset {
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
}
