"use client";

import SkimmerAnatomyCard from "./skimmer-demo";

/**
 * Skimmer run - SK-4 "Shearwater" ground-effect craft as isometric
 * line art over a line-drawn sea, with a drifting palm cay.
 * Move to tilt, hold Space to boost, Esc to settle. 16s seamless loop.
 */
export default function SkimmerDemo() {
  return (
    <div className="flex min-h-160 w-full items-start justify-center px-4 py-10 md:py-20">
      <div className="w-full max-w-[720px] overflow-hidden rounded-[28px] border-[0.5px] border-neutral-200 bg-[#fafafa] [corner-shape:squircle]">
        <SkimmerAnatomyCard width="100%" height={460} />
      </div>
    </div>
  );
}
