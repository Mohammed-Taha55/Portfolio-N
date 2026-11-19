"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StateItem {
  id: string;
  /** button label: one or two words */
  label: string;
  /** one line under the frame: what to look at in this state */
  caption: string;
  image: ReactNode;
}

/**
 * A screen shown in two or three states, in one place.
 *
 * Same idea as <Compare />, at a smaller scale: every state is rendered
 * into the SAME grid cell, so switching cross-fades in place instead of
 * moving the page under the reader's thumb. The crops are built to one
 * canvas size by scripts/build-images.mjs, so the frames line up to the
 * pixel and nothing shifts between them.
 *
 * All states stay in the DOM and keep their layout box (opacity +
 * visibility, never `display:none`), so the browser fetches every state
 * when the section comes near - the first tap never waits on a download.
 * Inactive panels are `inert`, so they are out of tab order and out of
 * the accessibility tree while hidden.
 *
 * Reduced motion needs no branch here: globals.css clamps every
 * transition to 0.01ms under prefers-reduced-motion, which turns the
 * cross-fade into an instant swap.
 */
export default function States({
  label,
  items,
  /** the ground the crops were built on, extended to the full width */
  ground = "#4a4a4a",
}: {
  label: string;
  items: StateItem[];
  ground?: string;
}) {
  const [active, setActive] = useState(items[0].id);
  const id = useId();
  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <figure>
      <div
        role="group"
        aria-label={label}
        className="mb-4 inline-flex rounded-[12px] bg-neutral-900/[0.05] p-1 [corner-shape:squircle]"
      >
        {items.map((item) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              aria-controls={`${id}-${item.id}`}
              onClick={() => setActive(item.id)}
              className={cn(
                "h-9 min-w-[92px] rounded-[8px] border px-3 text-[14px] transition-[background-color,border-color,color] duration-150 ease-out [corner-shape:squircle] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                on
                  ? "border-neutral-900/10 bg-white text-neutral-900"
                  : "border-transparent text-neutral-600 hover:text-neutral-900",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        className="flex justify-center px-4 py-8 sm:px-8 sm:py-12"
        style={{ backgroundColor: ground }}
      >
        <div className="grid w-full max-w-[320px] sm:max-w-[380px] wd:max-w-[420px]">
          {items.map((item) => (
            <div
              key={item.id}
              id={`${id}-${item.id}`}
              inert={item.id !== active ? true : undefined}
              className={cn(
                "col-start-1 row-start-1 transition-opacity duration-300 ease-out",
                item.id === active ? "opacity-100" : "invisible opacity-0",
              )}
            >
              {item.image}
            </div>
          ))}
        </div>
      </div>

      <figcaption
        aria-live="polite"
        className="mt-4 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-500 md:text-[18px]"
      >
        <span className="text-neutral-900">{current.label}.</span> {current.caption}
      </figcaption>
    </figure>
  );
}
