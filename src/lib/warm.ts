"use client";

import { fallbackOf, srcSetOf, type WarmTarget } from "@/lib/image-urls";

/**
 * Image warming for case studies.
 *
 * A detached `new Image()` given the page's exact `srcset` + `sizes`
 * makes the browser pick the same candidate the case-study page will
 * pick, download it and (with `decode()`) rasterise it. The element is
 * kept alive in a module-level map so the decoded bitmap stays in the
 * memory cache until the page needs it - the hero then paints on the
 * first frame after navigation.
 */

interface Entry {
  img: HTMLImageElement;
  ready: Promise<void>;
  done: boolean;
}

const cache = new Map<string, Entry>();

const keyOf = (t: WarmTarget) => `${t.base}|${t.sizes}`;

export function warm(target: WarmTarget, priority: "high" | "low" = "low"): Entry {
  const key = keyOf(target);
  const hit = cache.get(key);
  if (hit) {
    // a low-priority warm that's still in flight can be upgraded
    if (priority === "high" && !hit.done) hit.img.fetchPriority = "high";
    return hit;
  }
  const img = new Image();
  img.fetchPriority = priority;
  img.decoding = "async";
  // sizes before srcset: the candidate is chosen when srcset is set
  img.sizes = target.sizes;
  img.srcset = srcSetOf(target);
  img.src = fallbackOf(target);
  const entry: Entry = {
    img,
    done: false,
    ready: img
      .decode()
      .catch(() => undefined)
      .then(() => {
        entry.done = true;
      }),
  };
  cache.set(key, entry);
  return entry;
}

export const isWarm = (target: WarmTarget): boolean =>
  cache.get(keyOf(target))?.done ?? false;

/** Warm the rest one at a time, so they never compete with each other. */
export async function warmSequence(targets: WarmTarget[]): Promise<void> {
  for (const t of targets) await warm(t, "low").ready;
}

/** Respect Save-Data and very slow connections: warm only on intent there. */
export function canSpeculate(): boolean {
  const c = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !/(^|-)2g$/.test(c.effectiveType ?? "");
}

export const whenIdle = (fn: () => void, timeout = 2500): (() => void) => {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 400);
  return () => clearTimeout(id);
};

export const timeout = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
