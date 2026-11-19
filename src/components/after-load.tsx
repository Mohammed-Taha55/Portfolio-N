"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const subscribe = (cb: () => void) => {
  window.addEventListener("load", cb);
  return () => window.removeEventListener("load", cb);
};

/**
 * Below-the-fold images wait for the window `load` event.
 *
 * Native lazy loading starts every image within ~1250px of the viewport
 * on first paint, so on a slow phone the next six posters share the
 * line with the hero and the JS. Until `load`, the <img> stays in the
 * HTML (crawlable, with its srcset) but is display:none; the box keeps
 * the image's exact ratio, colour and blur, so nothing moves when it
 * appears. After `load` it's plain native lazy loading again. On a
 * client-side navigation the document is already loaded, so this is a
 * no-op.
 */
export default function AfterLoad({
  ratio,
  color,
  blur,
  className,
  children,
}: {
  ratio: number;
  color: string;
  blur: string;
  className?: string;
  children: ReactNode;
}) {
  const loaded = useSyncExternalStore(
    subscribe,
    () => document.readyState === "complete",
    () => false,
  );

  return (
    <div
      data-after-load=""
      className={cn(!loaded && "[&_img]:hidden", className)}
      style={
        loaded
          ? undefined
          : {
              aspectRatio: ratio,
              backgroundColor: color,
              backgroundImage: `url(${blur})`,
              backgroundSize: "cover",
            }
      }
    >
      {children}
    </div>
  );
}
