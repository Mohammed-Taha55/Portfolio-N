import { WORK, type CaseStudy } from "@/content/work";
import { slotFor, warmTarget } from "@/lib/images";
import { cn } from "@/lib/utils";
import PosterLink from "../poster-link";

/* Active number copies the "Book a call" CTA face: sky-500 → blue-500
   gradient with the same inner-light stack, no outer drop. */
const CTA_SHADOW =
  "inset 0 1px 0 0 rgba(255,255,255,0.4), inset 4px 4px 4px 0 rgba(255,255,255,0.06), inset -4px 4px 4px 0 rgba(255,255,255,0.06), inset 6px 6px 6px 0 rgba(255,255,255,0.04), inset -6px 6px 6px 0 rgba(255,255,255,0.04), inset 8px 8px 8px 0 rgba(255,255,255,0.02), inset -8px 8px 8px 0 rgba(255,255,255,0.02)";

const PRESS = "transition-[scale] duration-150 ease-out active:scale-[0.97]";

/**
 * Centered numeric pagination: prev arrow + 1..7 + next arrow in one
 * row. The active number wears the "Book a call" blue; the rest are
 * quiet neutral keys. Hovering a number warms that case study's hero.
 */
function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={dir === "next" ? "rotate-180" : undefined}
    >
      <path d="M13 8H3M7 4 3 8l4 4" />
    </svg>
  );
}

const KEY =
  "flex h-9 min-w-9 items-center justify-center rounded-xl border px-2.5 text-[14px] font-medium outline-none select-none [corner-shape:squircle] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

/* End arrows read as navigation, not pages: borderless ghost icons in a
   softer grey, same size and rhythm as the number keys. */
const ARROW_KEY =
  "flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 outline-none select-none transition-colors duration-150 ease-out hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

export default function CaseNav({
  prev,
  next,
  index,
  total,
}: {
  prev: CaseStudy;
  next: CaseStudy;
  index: number;
  total: number;
}) {
  void total;
  return (
    <nav
      aria-label="More case studies"
      className="mt-28 flex justify-center pb-16 md:mt-36 md:pb-20"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <PosterLink
          href={`/work/${prev.slug}`}
          label={`Previous case study: ${prev.name}`}
          hero={warmTarget(prev.poster.image, "full")}
          rest={[]}
          className={cn(ARROW_KEY, PRESS)}
        >
          <Arrow dir="prev" />
        </PosterLink>

        {WORK.map((c, i) => {
          const isActive = i === index;
          return (
            <PosterLink
              key={c.slug}
              href={`/work/${c.slug}`}
              label={`Case study ${i + 1}: ${c.name}`}
              hero={warmTarget(c.poster.image, slotFor(c.poster))}
              rest={[]}
              className={cn(
                KEY,
                PRESS,
                isActive
                  ? "border-blue-600 bg-linear-to-b from-sky-500 to-blue-500 text-white"
                  : "border-neutral-900/10 bg-white text-neutral-500 transition-colors duration-150 ease-out hover:border-neutral-900/25 hover:text-neutral-900",
              )}
              style={isActive ? { boxShadow: CTA_SHADOW } : undefined}
            >
              {isActive ? (
                <span aria-current="page">{i + 1}</span>
              ) : (
                <span>{i + 1}</span>
              )}
            </PosterLink>
          );
        })}

        <PosterLink
          href={`/work/${next.slug}`}
          label={`Next case study: ${next.name}`}
          hero={warmTarget(next.poster.image, "full")}
          rest={[]}
          className={cn(ARROW_KEY, PRESS)}
        >
          <Arrow dir="next" />
        </PosterLink>
      </div>
    </nav>
  );
}
