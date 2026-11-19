"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Side = "before" | "after";

/** Aspect ratio + colour, so a pane holds its shape before its image. */
export interface Box {
  ratio: number;
  color: string;
}

/**
 * Full-page before/after.
 *
 * md and up: both pages side by side inside ONE scroll frame, so they
 * scroll together and the same section sits at the same height - the
 * comparison needs no JS and no scroll syncing. The frame has a fixed
 * height, so the case study stays skimmable instead of becoming a
 * 4000px detour.
 * Below md: a two-option toggle swaps the page in place. Both images
 * stay mounted in the same grid cell, so switching keeps the scroll
 * position and never re-downloads anything.
 *
 * The two full-page files are the heaviest on the page (~200-500KB).
 * Native lazy loading would start them on first paint (they sit within
 * the browser's ~1250px look-ahead), competing with the hero. So their
 * <img> tags stay in the HTML (crawlable alt + srcset) but are
 * display:none until the frame is 600px away; each pane holds its exact
 * shape and colour meanwhile, so nothing shifts when they arrive.
 */
export default function Compare({
  before,
  after,
  beforeBox,
  afterBox,
}: {
  before: ReactNode;
  after: ReactNode;
  beforeBox: Box;
  afterBox: Box;
}) {
  const [view, setView] = useState<Side>("after");
  const [near, setNear] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pane = (side: Side, node: ReactNode, box: Box) => (
    <div
      id={`${id}-${side}`}
      data-active={view === side}
      style={near ? undefined : { aspectRatio: box.ratio, backgroundColor: box.color }}
      className={cn(
        "relative min-w-0 transition-opacity duration-150 ease-out",
        !near && "[&_img]:hidden",
        "max-md:col-start-1 max-md:row-start-1",
        "max-md:data-[active=false]:invisible max-md:data-[active=false]:opacity-0",
      )}
    >
      {node}
    </div>
  );

  return (
    <figure>
      {/* phone: segmented toggle */}
      <div
        role="radiogroup"
        aria-label="Show page"
        className="mb-4 grid grid-cols-2 rounded-[12px] bg-neutral-900/[0.05] p-1 [corner-shape:squircle] md:hidden"
      >
        {(["before", "after"] as const).map((side) => (
          <button
            key={side}
            type="button"
            role="radio"
            aria-checked={view === side}
            aria-controls={`${id}-${side}`}
            onClick={() => setView(side)}
            className={cn(
              "h-9 rounded-[8px] border text-[14px] transition-[background-color,border-color,color] duration-150 ease-out [corner-shape:squircle] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-blue-500",
              view === side
                ? "border-neutral-900/10 bg-white text-neutral-900"
                : "border-transparent text-neutral-600 hover:text-neutral-900",
            )}
          >
            {side === "before" ? "Before" : "After"}
          </button>
        ))}
      </div>

      {/* Desktop labels sit above their page, centred - never on top of
          the landing page itself. The mobile toggle already labels both. */}
      <div aria-hidden className="mb-3 hidden grid-cols-2 gap-px md:grid">
        <span className="text-center font-mono text-[12px] tracking-wide text-neutral-500 uppercase">
          Before
        </span>
        <span className="text-center font-mono text-[12px] tracking-wide text-neutral-500 uppercase">
          After
        </span>
      </div>

      <div>
        <div
          ref={frame}
          tabIndex={0}
          role="region"
          aria-label="Before and after, full pages. Scroll to compare."
          className="h-[min(78svh,760px)] overflow-y-auto border border-neutral-900/10 bg-neutral-900/[0.035] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
        >
          <div className="grid items-start gap-px md:grid-cols-2">
            {pane("before", before, beforeBox)}
            {pane("after", after, afterBox)}
          </div>
        </div>
      </div>

      <figcaption className="mt-4 text-[14px] text-neutral-500">
        <span className="md:hidden">Switch pages, then scroll inside the frame.</span>
        <span className="max-md:hidden">
          Scroll inside the frame: both pages move together, so each section lines up with its
          counterpart.
        </span>
      </figcaption>
    </figure>
  );
}
