import type { GalleryAsset } from "@/content/gallery-types";

/** What the lightbox needs; keeps blur/colour out of the client bundle. */
export type GalleryItem = GalleryAsset;

/** The manifest item plus its stable position in the gallery order. */
export interface GalleryEntry extends GalleryItem {
  index: number;
}

/**
 * Shortest-column masonry, in source order.
 *
 * Item 1, 2 and 3 land in columns 1, 2 and 3 because all columns start
 * empty; the next item always goes to the shortest column, with ties
 * going to the leftmost one. That keeps the first images left-to-right
 * on the top row (the numbered order) while the rest pack like
 * Pinterest. Heights are relative (`height / width`), so the same
 * distribution works at every viewport width.
 */
export function distribute<T extends { width: number; height: number }>(
  items: readonly T[],
  columns: number,
): T[][] {
  const cols = Array.from({ length: columns }, () => ({
    items: [] as T[],
    height: 0,
  }));

  for (const item of items) {
    let shortest = 0;
    for (let i = 1; i < columns; i += 1) {
      if (cols[i].height < cols[shortest].height) shortest = i;
    }
    cols[shortest].items.push(item);
    cols[shortest].height += item.height / item.width;
  }

  return cols.map((col) => col.items);
}

export const widestOf = (item: Pick<GalleryAsset, "widths">): number =>
  item.widths[item.widths.length - 1];

/** The no-JS destination: the largest file, so a direct open stays sharp. */
export const fullSrcOf = (item: Pick<GalleryAsset, "base" | "widths">): string =>
  `${item.base}-${widestOf(item)}.webp`;
