"use client";

import { useState } from "react";
import { BellIcon, CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function ToastDemo() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex aspect-[4/3] flex-col items-center justify-center gap-3 overflow-hidden border border-neutral-900/10 bg-white">
      <button
        onClick={() => {
          setShow(true);
          setTimeout(() => setShow(false), 2200);
        }}
        className="flex cursor-pointer items-center gap-2 bg-white px-5 py-2.5 font-mono text-[15px] tracking-wide text-neutral-900 uppercase transition-[scale] hover:bg-neutral-200 active:scale-[0.98]"
      >
        <BellIcon className="size-4" />
        Notify me
      </button>
      <div
        className={cn(
          "absolute bottom-4 flex items-center gap-2 bg-neutral-900 py-2 pr-4 pl-2 font-mono text-[13px] tracking-wide text-white uppercase transition-all duration-300",
          show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <span className="flex size-5 items-center justify-center bg-emerald-500">
          <CheckIcon className="size-3" weight="bold" />
        </span>
        Saved to your library
      </div>
    </div>
  );
}
