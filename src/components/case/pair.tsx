import WorkImage from "@/components/work-image";
import AfterLoad from "@/components/after-load";
import type { ImageKey } from "@/content/images.generated";
import { placeholderOf } from "@/lib/images";
import { Caption } from "./longform";

export interface PairShot {
  image: ImageKey;
  alt: string;
  /** "Version one", "Iteration 5", "Final" */
  label: string;
}

/**
 * The same region of two screens, side by side: the evidence for one
 * decision. Both crops come from the same part of the phone, so the eye
 * compares like with like. Top-aligned rather than stretched, because
 * the two versions genuinely take different heights. Stacked below md.
 */
export default function Pair({
  before,
  after,
  caption,
}: {
  before: PairShot;
  after: PairShot;
  caption: string;
}) {
  return (
    <figure className="mt-10">
      <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-4">
        {[before, after].map((shot) => (
          <div key={shot.image}>
            <p className="mb-2 font-mono text-[12px] tracking-wide text-neutral-500 uppercase">
              {shot.label}
            </p>
            <AfterLoad
              {...placeholderOf(shot.image)}
              className="overflow-hidden rounded-[12px] [corner-shape:squircle]"
            >
              <WorkImage
                image={shot.image}
                alt={shot.alt}
                sizes="pair"
                className="rounded-[12px] [corner-shape:squircle]"
              />
            </AfterLoad>
          </div>
        ))}
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
}
