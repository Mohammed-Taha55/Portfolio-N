import type { CSSProperties } from "react";
import { KIND_LABEL, WORK } from "@/content/work";
import { placeholderOf, slotFor, warmTarget } from "@/lib/images";
import AfterLoad from "./after-load";
import { cn } from "@/lib/utils";
import OriginTag from "./origin-tag";
import PosterLink from "./poster-link";
import WorkImage from "./work-image";

/* hover: the image eases up 1.5% inside its clip (500ms strong ease-out),
   press settles it back toward rest over 150ms */
const POSTER_IMG =
  "transition-[scale] duration-500 ease-(--ease-out) group-hover:scale-[1.015] group-active:scale-[1.005] group-active:duration-150";

/** Every image on a case-study page except its hero, in page order. */
function restOf(c: (typeof WORK)[number]) {
  if (c.warm) return c.warm.map((image) => warmTarget(image, "full"));
  const compare = c.compare
    ? [warmTarget(c.compare.before.image, "half"), warmTarget(c.compare.after.image, "half")]
    : [];
  return [...compare, ...c.decisions.map((d) => warmTarget(d.image, slotFor(d)))];
}

/**
 * Seven posters, two per row from 768px, in the design-direction order.
 * All posters share one 5760x4096 ratio, so the grid needs no masonry:
 * every row lines up on its own.
 */
export default function PosterGrid() {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 md:gap-y-16">
      {WORK.map((c, i) => (
        <li
          key={c.slug}
          className="enter-media"
          style={{ "--enter-delay": `${Math.min(i, 3) * 60 + 40}ms` } as CSSProperties}
        >
          <PosterLink
            href={`/work/${c.slug}`}
            hero={warmTarget(c.poster.image, "full")}
            rest={restOf(c)}
            className={cn(
              "group block rounded-[2px] outline-none",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500",
            )}
          >
            <div className="overflow-hidden">
              {i < 2 ? (
                // first row: in view on every layout, loads straight away
                <WorkImage
                  image={c.poster.image}
                  alt={c.poster.alt}
                  sizes="half"
                  priority={i === 0}
                  decorative
                  className={POSTER_IMG}
                />
              ) : (
                <AfterLoad {...placeholderOf(c.poster.image)}>
                  <WorkImage
                    image={c.poster.image}
                    alt={c.poster.alt}
                    sizes="half"
                    decorative
                    className={POSTER_IMG}
                  />
                </AfterLoad>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[15px] text-neutral-900">
                  {c.name}
                </span>
                <span className="truncate text-[14px] text-neutral-500">
                  {KIND_LABEL[c.kind]}
                </span>
                {/* intent cue: slides in on hover, a static arrow is
                    unnecessary on touch where the whole card is the link */}
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="size-3.5 shrink-0 translate-x-[-4px] self-center text-neutral-400 opacity-0 transition-[opacity,translate] duration-200 ease-(--ease-out) group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </p>
              <OriginTag origin={c.origin} />
              {/* link name reads "Umami Landing page Redesign, case study" */}
              <span className="sr-only">, case study</span>
            </div>
          </PosterLink>
        </li>
      ))}
    </ul>
  );
}
