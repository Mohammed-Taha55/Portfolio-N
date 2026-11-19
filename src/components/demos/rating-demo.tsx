"use client";

import { useState } from "react";
import { StarIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function RatingDemo() {
  const [rating, setRating] = useState(4);
  const [hover, setHover] = useState(0);
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 border border-neutral-900/10 bg-white">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
            aria-label={`Rate ${star}`}
            className="cursor-pointer transition-[scale] active:scale-[0.98]"
          >
            <StarIcon
              className={cn(
                "size-7 transition-colors",
                (hover || rating) >= star ? "text-amber-400" : "text-neutral-700",
              )}
              weight={(hover || rating) >= star ? "fill" : "regular"}
            />
          </button>
        ))}
      </div>
      <p className="font-mono text-[15px] tracking-wide text-neutral-500 uppercase">
        {rating}.0 / 5 stars
      </p>
    </div>
  );
}
