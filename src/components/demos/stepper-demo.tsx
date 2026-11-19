"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";

export default function StepperDemo() {
  const [count, setCount] = useState(2);
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 border border-neutral-900/10 bg-white">
      <div className="flex items-center gap-4 border border-neutral-900/10 bg-neutral-100 p-1.5">
        <button
          aria-label="Decrease"
          onClick={() => setCount((c) => Math.max(0, c - 1))}
          className="flex size-9 cursor-pointer items-center justify-center bg-neutral-100 text-neutral-700 transition-[scale] hover:bg-neutral-200 active:scale-[0.98]"
        >
          <MinusIcon className="size-4" />
        </button>
        <span
          key={count}
          className="animate-tab-in w-8 text-center font-mono text-xl font-semibold text-neutral-900 tabular-nums"
        >
          {count}
        </span>
        <button
          aria-label="Increase"
          onClick={() => setCount((c) => Math.min(9, c + 1))}
          className="flex size-9 cursor-pointer items-center justify-center bg-white text-neutral-900 transition-[scale] hover:bg-neutral-200 active:scale-[0.98]"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      <p className="font-mono text-[15px] tracking-wide text-neutral-500 uppercase">
        qty stepper
      </p>
    </div>
  );
}
