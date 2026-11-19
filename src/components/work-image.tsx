import { preload } from "react-dom";
import type { ImageKey } from "@/content/images.generated";
import { asset, fallbackOf, SIZES, srcSetOf, type SizesKey } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Every case-study raster goes through here, so every one of them:
 *  - carries its intrinsic width/height (no layout shift, ever),
 *  - paints its dominant colour + a 16px blur underneath until the
 *    real bytes decode (no empty gap, ever),
 *  - ships an exact srcset of the prebuilt WebP widths.
 * `priority` is for the LCP image only: eager, fetchpriority=high and a
 * <link rel=preload> hoisted into <head> during SSR. Everything else is
 * native lazy loading.
 */
export default function WorkImage({
  image,
  alt,
  sizes,
  priority = false,
  decorative = false,
  className,
}: {
  image: ImageKey;
  alt: string;
  sizes: SizesKey;
  priority?: boolean;
  /** inside a link that already names it: keep alt for crawlers, hide from AT */
  decorative?: boolean;
  className?: string;
}) {
  const a = asset(image);
  const srcSet = srcSetOf(a);
  const src = fallbackOf(a);

  if (priority) {
    preload(src, {
      as: "image",
      imageSrcSet: srcSet,
      imageSizes: SIZES[sizes],
      fetchPriority: "high",
    });
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- prebuilt WebP widths, no optimizer needed
    <img
      src={src}
      srcSet={srcSet}
      sizes={SIZES[sizes]}
      width={a.width}
      height={a.height}
      alt={alt}
      aria-hidden={decorative || undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "auto" : "async"}
      draggable={false}
      style={{
        backgroundColor: a.color,
        backgroundImage: `url(${a.blur})`,
        backgroundSize: "cover",
      }}
      className={cn(
        "block h-auto w-full select-none outline outline-1 -outline-offset-1 outline-black/10",
        className,
      )}
    />
  );
}
