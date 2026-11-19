import { GALLERY } from "@/content/gallery.generated";
import { fallbackOf, SIZES, srcSetOf } from "@/lib/image-urls";
import { distribute, fullSrcOf, type GalleryEntry } from "@/lib/gallery";
import { cn } from "@/lib/utils";

/**
 * The grid is server-rendered twice on purpose: 3 columns at lg, 2
 * columns below it. Each layout has its own shortest-column balance,
 * because moving one image between columns changes every column below
 * it. Only one copy is displayed, so the hidden copy never downloads
 * (native lazy loading needs a box) and CSS keeps it out of the a11y
 * tree. No JS is needed to lay the gallery out or open an image: every
 * tile is a plain link to the full WebP.
 */
const ENTRIES: GalleryEntry[] = GALLERY.map((item, index) => ({ ...item, index }));

const COLUMNS_3 = distribute(ENTRIES, 3);
const COLUMNS_2 = distribute(ENTRIES, 2);

function Tile({ item }: { item: GalleryEntry }) {
  const priority = item.index === 0;
  const src = fallbackOf(item);
  const srcSet = srcSetOf(item);

  return (
    <a
      href={fullSrcOf(item)}
      data-gallery-index={item.index}
      aria-haspopup="dialog"
      aria-label={`${item.alt}. Open full-size image`}
      className="group block w-full cursor-zoom-in rounded-[2px] outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- prebuilt WebP widths, no optimizer needed */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={SIZES.gallery}
        width={item.width}
        height={item.height}
        alt={item.alt}
        loading="lazy"
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        draggable={false}
        style={{
          backgroundColor: item.color,
          backgroundImage: `url(${item.blur})`,
          backgroundSize: "cover",
        }}
        className="block h-auto w-full select-none outline outline-1 -outline-offset-1 outline-black/10 transition-[outline-color] duration-200 ease-(--ease-out) group-hover:outline-black/25 group-active:outline-black/35"
      />
    </a>
  );
}

function Columns({
  columns,
  gap,
}: {
  columns: GalleryEntry[][];
  gap: string;
}) {
  return (
    <>
      {columns.map((column, index) => (
        <div
          key={index}
          className={cn("flex min-w-0 flex-1 flex-col", gap)}
        >
          {column.map((item) => (
            <Tile key={item.slug} item={item} />
          ))}
        </div>
      ))}
    </>
  );
}

export default function GalleryGrid() {
  return (
    <div className="w-full">
      {/* lg and up: three columns */}
      <div className="hidden gap-6 lg:flex">
        <Columns columns={COLUMNS_3} gap="gap-6" />
      </div>
      {/* below lg: two columns, including phones */}
      <div className="flex gap-4 md:gap-6 lg:hidden">
        <Columns columns={COLUMNS_2} gap="gap-4 md:gap-6" />
      </div>
    </div>
  );
}
