import WorkImage from "@/components/work-image";
import AfterLoad from "@/components/after-load";
import type { ImageKey } from "@/content/images.generated";
import { placeholderOf } from "@/lib/images";
import { Caption } from "./longform";

export interface Frame {
  image: ImageKey;
  /** "Iteration 1" ... "Final" */
  label: string;
  alt: string;
  /** what changed on this step: one line */
  changed: string;
  /** why: one line, in the designer's voice */
  why: string;
}

/**
 * Iterations in order, each phone annotated with what changed and why.
 *
 * md and up: one row of six, so the whole sequence reads at a glance.
 * Below md: a scroll-snap row that bleeds to the screen edges. The
 * scroller is its own focusable region (keyboard users can arrow
 * through it) and is exactly the viewport's width, so the page itself
 * never scrolls sideways.
 */
export default function Filmstrip({
  frames,
  label,
  caption,
}: {
  frames: Frame[];
  label: string;
  caption: string;
}) {
  return (
    <figure>
      <div
        role="region"
        aria-label={label}
        tabIndex={0}
        className="-mx-4 overflow-x-auto px-4 pb-2 outline-none [scroll-padding-inline:16px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500 sm:-mx-8 sm:px-8 sm:[scroll-padding-inline:32px] md:mx-0 md:overflow-visible md:px-0 md:pb-0"
      >
        <ol className="flex snap-x snap-mandatory gap-4 md:grid md:snap-none md:grid-cols-6">
          {frames.map((f) => (
            <li key={f.image} className="w-[240px] shrink-0 snap-start md:w-auto">
              <p className="font-mono text-[11px] tracking-wide text-neutral-500 uppercase">
                {f.label}
              </p>
              <AfterLoad {...placeholderOf(f.image)} className="phone-clip mt-2 overflow-hidden">
                <WorkImage image={f.image} alt={f.alt} sizes="film" className="phone-clip" />
              </AfterLoad>
              <p className="mt-3 text-[14px] leading-snug text-pretty text-neutral-900">
                {f.changed}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-pretty text-neutral-600">{f.why}</p>
            </li>
          ))}
        </ol>
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
}
