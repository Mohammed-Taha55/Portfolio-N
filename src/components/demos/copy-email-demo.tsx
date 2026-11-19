"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function CopyEmailDemo() {
  const [copied, setCopied] = useState(false);
  const email = "email.rohitmehta@gmail.com";
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 border border-neutral-900/10 bg-white px-4">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(email).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="flex w-full max-w-xs cursor-pointer items-center justify-between gap-2 border border-neutral-900/10 bg-neutral-100 px-4 py-3 font-mono text-xs text-neutral-600 transition hover:border-neutral-900/25 active:scale-[0.98]"
      >
        <span className="truncate">{email}</span>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center transition-colors",
            copied ? "bg-emerald-500 text-white" : "bg-neutral-100 text-neutral-500",
          )}
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </span>
      </button>
      <p className="font-mono text-[15px] tracking-wide text-neutral-500 uppercase">
        {copied ? "copied ✓" : "click to copy"}
      </p>
    </div>
  );
}
