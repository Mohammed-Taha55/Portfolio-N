"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { SIZES } from "@/lib/image-urls";
import { fullSrcOf, type GalleryItem } from "@/lib/gallery";
import { canSpeculate, warm, warmSequence, whenIdle } from "@/lib/warm";

const targetOf = (item: GalleryItem, sizes: string) => ({
  base: item.base,
  widths: item.widths,
  sizes,
});

const gridTarget = (item: GalleryItem) => targetOf(item, SIZES.gallery);
const lightboxTarget = (item: GalleryItem) => targetOf(item, SIZES.lightbox);

/** Which gallery item a click/hover landed on, if any. */
function indexOf(target: EventTarget | null): number | null {
  const el = (target as HTMLElement | null)?.closest?.<HTMLElement>(
    "[data-gallery-index]",
  );
  if (!el) return null;
  const index = Number(el.dataset.galleryIndex);
  return Number.isInteger(index) ? index : null;
}

function Lightbox({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        // Only the close button is focusable: keep focus in the dialog.
        event.preventDefault();
        closeRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const onBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-lightbox-image]")) return;
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      onClick={onBackdrop}
      className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain bg-black/85 p-4 sm:p-8 md:p-12"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close image"
        className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:top-6 sm:right-6 md:top-8 md:right-8"
      >
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>

      <div className="pointer-events-none flex h-full w-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- prebuilt WebP widths, no optimizer needed */}
        <img
          data-lightbox-image=""
          src={fullSrcOf(item)}
          srcSet={item.widths.map((w) => `${item.base}-${w}.webp ${w}w`).join(", ")}
          sizes={SIZES.lightbox}
          width={item.width}
          height={item.height}
          alt={item.alt}
          fetchPriority="high"
          decoding="async"
          draggable={false}
          style={{
            backgroundColor: item.color,
            backgroundImage: `url(${item.blur})`,
            backgroundSize: "cover",
          }}
          className="pointer-events-auto block h-auto max-h-full w-auto max-w-full object-contain select-none"
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Gallery behaviour only: click a tile to open the full-size image,
 * click the backdrop or press Escape to close, and warm the first 12
 * grid files plus the full-size file behind whatever the pointer is
 * near. The grid itself is server-rendered (see gallery-grid.tsx), and
 * every tile still works as a plain link without JS.
 */
export default function GalleryView({
  items,
  children,
}: {
  items: readonly GalleryItem[];
  children: ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  // Bring the first screen in at low priority, one file at a time, once
  // the page has loaded and the browser is idle. Save-Data and 2G skip
  // it; native loading="lazy" still fills the grid in as you scroll.
  useEffect(() => {
    if (!canSpeculate()) return;
    let cancelIdle: (() => void) | undefined;
    const run = () => {
      cancelIdle = whenIdle(() => {
        void warmSequence(items.slice(0, 12).map(gridTarget));
      }, 1500);
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
    return () => {
      cancelIdle?.();
      window.removeEventListener("load", run);
    };
  }, [items]);

  useEffect(() => {
    if (openIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      opener.current?.focus({ preventScroll: true });
    };
  }, [openIndex]);

  const close = useCallback(() => setOpenIndex(null), []);

  const onClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const target = indexOf(event.target);
    if (target === null) return;
    event.preventDefault();
    opener.current = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-gallery-index]",
    );
    setOpenIndex(target);
  };

  // Pointer/focus/touch intent: fetch the full-size file before the
  // click lands, so the lightbox opens sharp on the first frame.
  const onIntent = (event: { target: EventTarget | null }) => {
    const index = indexOf(event.target);
    if (index === null) return;
    warm(lightboxTarget(items[index]), "high");
  };

  const open = openIndex === null ? null : items[openIndex];

  return (
    <div
      onClick={onClick}
      onPointerOver={onIntent}
      onFocusCapture={onIntent}
      onTouchStart={onIntent}
      className="w-full"
    >
      {children}
      {open && <Lightbox key={open.slug} item={open} onClose={close} />}
    </div>
  );
}
