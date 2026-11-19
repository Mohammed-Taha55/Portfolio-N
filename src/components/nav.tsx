"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Dock, { type TabId } from "./dock";

function tabForPath(pathname: string): TabId | null {
  if (pathname === "/" || pathname.startsWith("/work")) return "home";
  if (pathname.startsWith("/lab")) return "lab";
  if (pathname.startsWith("/gallery")) return "gallery";
  if (pathname.startsWith("/about")) return "about";
  return null;
}

/**
 * Rendered once in the root layout so the dock stays mounted across
 * route changes - the active key's face then cross-fades instead of
 * snapping. Active tab is derived from the URL (case studies live
 * under Home).
 *
 * Scroll behaviour: slides out while scrolling down, back the moment
 * you scroll up, always visible near the top. A small dead zone keeps
 * it from flickering on touch jitter / rubber-banding.
 *
 * Plain CSS transition on `translate` (iOS drawer curve, 280ms): it
 * retargets mid-flight like a spring, runs off the main thread, and
 * keeps the animation library out of every page's shared bundle.
 */
export default function Nav() {
  const pathname = usePathname();
  const active = tabForPath(pathname ?? "/");
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    last.current = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last.current;
        last.current = y;
        if (y < 80) setHidden(false);
        else if (dy > 6) setHidden(true);
        else if (dy < -2) setHidden(false);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // (a route change scrolls to the top, and y < 80 brings the dock back)

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center-safe px-4 transition-[translate] duration-[280ms] ease-drawer sm:top-4",
        hidden ? "-translate-y-[140%]" : "translate-y-0",
      )}
    >
      <Dock active={active} className="pointer-events-auto max-w-full" />
    </header>
  );
}
