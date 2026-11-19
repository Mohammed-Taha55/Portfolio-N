"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabId = "home" | "lab" | "gallery" | "about";

export const TABS: {
  id: TabId;
  label: string;
  href: string;
}[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "lab", label: "Lab", href: "/lab" },
  { id: "gallery", label: "Gallery", href: "/gallery" },
  { id: "about", label: "About", href: "/about" },
];

/* Press feedback: CSS scale on :active, 150ms strong ease-out. A
   transition (not a keyframe) so a quick tap reverses cleanly. */
const PRESS = "transition-[scale] duration-150 ease-out active:scale-[0.97]";

/* minimal light key - translucent white face, hairline dark border,
   top inner light, faint bottom depth, soft diffused drop.
   outer extent capped at ~10px so it always fits the nav padding
   and never gets sliced by the scroll container.
   static - no shadow change on hover. */
// const KEY_LIGHT_SHADOW =
//   "inset 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.9), inset 0 -1px 1px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.06), 0 4px 10px -4px rgba(0,0,0,0.1)";

const KEY_LIGHT_SHADOW =
  "inset 0 0 0 1px rgba(255,255,255,1), inset 0 1px 0 0 rgba(255,255,255,0.9), inset 0 -1px 1px 0 rgba(0,0,0,0.04)";

/* active face drop - same cap: fully inside the nav padding */
const KEY_ACTIVE_SHADOW =
  "0 4px 12px -4px rgba(0,0,0,0.3), 0 1px 3px 0 rgba(0,0,0,0.2)";

const KEY_SHAPE = "rounded-xl [corner-shape:squircle]";

/* Expo-style ease-out for the 350ms crossfade - most of the fade lands
   in the first ~100ms so the dock answers instantly, then a long soft
   tail settles it instead of snapping. Same curve + duration both ways
   so the outgoing and incoming faces melt through each other.
   Opacity only: GPU-cheap, and the global reduced-motion rule
   collapses it to a snap. */
const FADE_EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const FADE_MS = "duration-[350ms]";

function DockKey({
  tab,
  isActive,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
}) {
  return (
    <span className={cn("inline-flex shrink-0", PRESS)}>
      <Link
        href={tab.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          /* overflow-hidden on the Link itself: the clipping parent.
             Every layer (faces, backdrop-blur, sheens, ring) is
             hard-cut at the button box - zero paint escapes outside. */
          "group relative flex shrink-0 items-center overflow-hidden px-3.5 py-2.25 text-sm font-medium whitespace-nowrap outline-none select-none sm:px-4",
          KEY_SHAPE,
        )}
      >
        {/* light face - always rendered, so the bg never flashes.
            overflow-hidden hard-clips the blur + gradient to the key
            bounds: crisp edge, nothing bleeds outside. Inset shadows
            only, zero outer drop. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 overflow-hidden bg-linear-to-b from-neutral-50 to-neutral-100/75 border border-gray-300 backdrop-blur-xl transition-[background-color] duration-200 group-hover:bg-white/95",
            KEY_SHAPE,
          )}
          style={{ boxShadow: KEY_LIGHT_SHADOW }}
        />
        {/* dark fill - fades in/out over the light face. The outer drop
            only exists while active: inactive keys provably paint zero
            shadow outside their border. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 overflow-hidden bg-black/[0.56] backdrop-blur-xl transition-opacity",
            KEY_SHAPE,
            FADE_EASE,
            FADE_MS,
            isActive ? "opacity-100" : "opacity-0",
          )}
          style={{ boxShadow: isActive ? KEY_ACTIVE_SHADOW : "none" }}
        >
          {/* top sheen */}
          <span
            aria-hidden
            className={cn("absolute inset-0 opacity-[0.12]", KEY_INNER)}
            style={{
              background:
                "linear-gradient(rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />
          {/* center vignette */}
          <span
            aria-hidden
            className={cn("absolute inset-0 opacity-[0.32]", KEY_INNER)}
            style={{
              background:
                "radial-gradient(65.62% 65.62% at 50% 50%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%)",
            }}
          />
          {/* gradient hairline ring */}
          <span
            aria-hidden
            className={cn("absolute inset-0 p-px opacity-[0.24]", KEY_INNER)}
            style={{
              background:
                "linear-gradient(rgb(255, 255, 255) 0%, rgb(153, 153, 153) 55%, rgb(255, 255, 255) 80%, rgb(153, 153, 153) 95%)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              pointerEvents: "none",
            }}
          />
        </span>
        {/* label - two copies crossfade together with the fill.
            Grid-stacked in one cell: identical metrics, zero shift. */}
        <span className="relative z-10 grid">
          <span
            className={cn(
              "col-start-1 row-start-1 text-neutral-700 transition-opacity",
              FADE_EASE,
              FADE_MS,
              isActive ? "opacity-0" : "opacity-100",
            )}
          >
            {tab.label}
          </span>
          <span
            aria-hidden
            className={cn(
              "col-start-1 row-start-1 text-white/90 transition-opacity",
              FADE_EASE,
              FADE_MS,
              isActive ? "opacity-100" : "opacity-0",
            )}
          >
            {tab.label}
          </span>
        </span>
      </Link>
    </span>
  );
}

/* every layer stacked on a key - face, sheen, vignette, hairline ring -
   must carry the SAME squircle shape. `rounded-[inherit]` only inherits
   border-radius, not corner-shape, so inner layers rendered as plain
   arcs and read as a second, rounder outline inside the key. */
const KEY_INNER = "rounded-xl [corner-shape:squircle]";

/**
 * Floating dock - minimal squircle keys: a persistent translucent light
 * face with a hairline border, top inner light and soft diffused drop.
 * The active key crossfades a dark face with a matching label fade.
 * Labels only, no icons. Mounted once in the root layout so keys
 * fade between routes instead of snapping.
 */
export default function Dock({
  active,
  className,
}: {
  active: TabId | null;
  className?: string;
}) {
  return (
    <nav
      aria-label="Portfolio sections"
      className={cn("dock-in flex items-center gap-1.5 overflow-x-auto p-2 bg-[#fafcf8]/10 backdrop-blur-lg rounded-xl", className)}
    >
      {TABS.map((tab) => (
        <DockKey key={tab.id} tab={tab} isActive={tab.id === active} />
      ))}

      <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-neutral-900/10" />

      {/* CTA - opens the cal.com booking page in a new tab */}
      <span className={cn("shrink-0", PRESS)}>
        <a
          href="https://cal.com/negativ/15min"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex cursor-pointer items-center rounded-xl font-medium border border-blue-600 bg-linear-to-b from-sky-500 to-blue-500 px-3.5 py-2 text-sm whitespace-nowrap text-white outline-none select-none sm:px-4",
            "[corner-shape:squircle]",
          )}
          style={{ boxShadow: CTA_SHADOW }}
        >
          Book a call
        </a>
      </span>
    </nav>
  );
}

/* CTA - sky-500 → blue-500 gradient with the badge gloss stack:
   top inner light, mirrored white inner fills, blue-tinted drops */
// const CTA_SHADOW =
//   "inset 0 1px 0 0 rgba(255,255,255,0.4), inset 4px 4px 4px 0 rgba(255,255,255,0.06), inset -4px 4px 4px 0 rgba(255,255,255,0.06), inset 6px 6px 6px 0 rgba(255,255,255,0.04), inset -6px 6px 6px 0 rgba(255,255,255,0.04), inset 8px 8px 8px 0 rgba(255,255,255,0.02), inset -8px 8px 8px 0 rgba(255,255,255,0.02), 0 1px 2px -0.25px rgba(14,165,233,0.5), 0 2px 4px -0.5px rgba(59,130,246,0.4)";

const CTA_SHADOW =
  "inset 0 1px 0 0 rgba(255,255,255,0.4), inset 4px 4px 4px 0 rgba(255,255,255,0.06), inset -4px 4px 4px 0 rgba(255,255,255,0.06), inset 6px 6px 6px 0 rgba(255,255,255,0.04), inset -6px 6px 6px 0 rgba(255,255,255,0.04), inset 8px 8px 8px 0 rgba(255,255,255,0.02), inset -8px 8px 8px 0 rgba(255,255,255,0.02)";