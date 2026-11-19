"use client";

import { useState } from "react";
import { HeartIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function LikeButtonDemo() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(128);
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 border border-neutral-900/10 bg-white">
      <button
        onClick={() => {
          setLiked((v) => !v);
          setCount((c) => (liked ? c - 1 : c + 1));
        }}
        className={cn(
          "flex cursor-pointer items-center gap-2 px-5 py-2.5 font-mono text-[15px] tracking-wide uppercase transition-[scale] duration-200 active:scale-[0.98]",
          liked ? "bg-red-500 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
        )}
      >
        <HeartIcon className="size-4" weight={liked ? "fill" : "regular"} />
        <span className="tabular-nums">{count}</span>
      </button>
      <p className="font-mono text-[15px] tracking-wide text-neutral-500 uppercase">
        like toggle
      </p>
    </div>
  );
}
