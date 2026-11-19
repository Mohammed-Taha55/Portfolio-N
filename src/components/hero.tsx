"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { FadeIn } from "./fade-in";
import SocialBadges from "./social-badges";

/** Page paper, so the cloth fully occludes the name under it. */
const PAPER = "#fafcfd";

/* Settle after a drag or tap: the iOS drawer curve. A CSS transition,
   so grabbing the cloth mid-settle retargets from where it is. */
const SETTLE = "translate 380ms cubic-bezier(0.32, 0.72, 0, 1)";

const clampNum = (x: number, a: number, b: number): number =>
  x < a ? a : x > b ? b : x;

/**
 * NameMask: "Negativ" is an opaque cloth over the real name "Rohit".
 * Both words share one clipped grid cell so Rohit never moves - grab
 * anywhere on the name and pull down: the cloth follows your pointer
 * 1:1 and parks fully out of view. Pull up from anywhere on the name
 * (the window itself is the handle, so nothing needs to peek) or tap
 * to toggle. Rohit has no animation.
 *
 * The drag writes `translate` straight to the element (no re-render per
 * pointer move), and release hands off to a CSS transition - no
 * animation library on the homepage's critical path.
 */
function NameMask() {
  const [open, setOpen] = useState(false);
  const maskRef = useRef<HTMLSpanElement>(null);
  const pressRef = useRef<{ x: number; y: number; t: number; startY: number } | null>(null);
  const openRef = useRef(false);
  const travelRef = useRef(64);
  const yRef = useRef(0);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const measure = (): void => {
      // park fully clear: cloth height plus a hair so no pixels peek
      const h = (maskRef.current?.offsetHeight ?? 62) + 2;
      travelRef.current = h;
    };
    measure();
    if (typeof document !== "undefined" && document.fonts) {
      void document.fonts.ready.then(() => measure()).catch(() => undefined);
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const place = (y: number, animated: boolean): void => {
    const el = maskRef.current;
    yRef.current = y;
    if (!el) return;
    el.style.transition = animated && !reduce ? SETTLE : "none";
    el.style.translate = `0 ${y}px`;
  };

  const go = (next: boolean): void => {
    openRef.current = next;
    setOpen(next);
    place(next ? travelRef.current : 0, true);
  };
  const settle = (y: number): void => {
    const t = travelRef.current;
    const next = openRef.current ? y > t * 0.55 : y > t * 0.35;
    go(next);
  };

  return (
    <span
      role="switch"
      aria-checked={open}
      aria-label={open ? "Cover real name" : "Reveal my real name"}
      title={open ? "Drag up to cover" : "Drag down to reveal"}
      tabIndex={0}
      onPointerDown={(e) => {
        // freeze any settle in progress exactly where it is
        const el = maskRef.current;
        const live = el ? parseFloat(getComputedStyle(el).translate.split(" ")[1] ?? "0") : 0;
        const startY = Number.isFinite(live) ? live : yRef.current;
        place(startY, false);
        pressRef.current = {
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
          startY,
        };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      }}
      onPointerMove={(e) => {
        const p = pressRef.current;
        if (!p || e.buttons === 0) return;
        place(clampNum(p.startY + (e.clientY - p.y), 0, travelRef.current), false);
      }}
      onPointerUp={(e) => {
        const p = pressRef.current;
        pressRef.current = null;
        if (!p) return;
        const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
        // a true tap (not a drag): toggle the cloth
        if (moved < 8 && performance.now() - p.t < 500) go(!openRef.current);
        else settle(yRef.current);
      }}
      onPointerCancel={() => {
        pressRef.current = null;
        settle(yRef.current);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go(!openRef.current);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          go(true);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          go(false);
        }
      }}
      className="inline-grid cursor-grab touch-pan-x overflow-hidden align-baseline pb-[0.16em] -mb-[0.16em] outline-none select-none focus-visible:ring-2 focus-visible:ring-sky-500 active:cursor-grabbing"
    >
      {/* real name: always here, never animated */}
      <span aria-hidden={!open} className="col-start-1 row-start-1">
        Rohit
      </span>
      {/* alias: the cloth - opaque, purely visual, the window handles input */}
      <span
        ref={maskRef}
        aria-hidden
        style={{ backgroundColor: PAPER }}
        className="pointer-events-none col-start-1 row-start-1"
      >
        Negativ
      </span>
    </span>
  );
}

/**
 * Hero: Rachel-style intro row. Headline first, social badges after.
 * At/above md the badges sit in a horizontal row beside the headline,
 * bottom-aligned and pushed to the right end. Below md they sit in a
 * row under the headline.
 */
export default function Hero({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-8 pt-[10vh] pb-8 md:grid-cols-[1fr_auto] md:gap-6 md:items-end md:pt-[20vh] wd:pt-[26vh]",
        className,
      )}
    >
      {/* left: headline */}
      <FadeIn className="flex w-full flex-col gap-4">
        <h1 className="max-w-180 font-brawler font-normal text-neutral-600 tracking-tight leading-[1.06] text-balance">
          I&apos;m <NameMask />
          <br /> a designer who ships code
        </h1>
      </FadeIn>

      {/* right: badges - row beside the headline at/above md, row
          beneath it below md. pb nudges the buttons up so their bottom
          edge sits on the heading's visual baseline instead of the
          line-box bottom (descender + half-leading). */}
      <FadeIn delay={0.08} className="flex w-full flex-col justify-end">
        <SocialBadges className="flex-row items-center md:justify-end md:pb-1.5 wd:pb-2" />
      </FadeIn>
    </div>
  );
}
