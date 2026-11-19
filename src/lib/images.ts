import type { ImageAsset } from "@/content/image-types";
import { IMAGES, type ImageKey } from "@/content/images.generated";
import { SIZES, type SizesKey, type WarmTarget } from "@/lib/image-urls";

export { SIZES, fallbackOf, srcSetOf } from "@/lib/image-urls";
export type { SizesKey, WarmTarget } from "@/lib/image-urls";

export const asset = (key: ImageKey): ImageAsset => IMAGES[key];

/** Box a deferred image holds before it shows: ratio, colour, blur. */
export const placeholderOf = (key: ImageKey) => {
  const a = IMAGES[key];
  return { ratio: a.width / a.height, color: a.color, blur: a.blur };
};

/** One rule for page and prefetcher: which slot a shot renders in. */
export const slotFor = (shot: { image: ImageKey; detail?: boolean }): SizesKey =>
  shot.detail ? "stage" : "full";

/** What the client needs to warm an image: no blur strings, no alt. */
export const warmTarget = (key: ImageKey, sizes: SizesKey): WarmTarget => {
  const { base, widths } = IMAGES[key];
  return { base, widths, sizes: SIZES[sizes] };
};
