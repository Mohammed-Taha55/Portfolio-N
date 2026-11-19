"use client";

import { useEffect, useRef } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
} from "motion/react";
import { ArrowUpRightIcon, SealCheckIcon } from "@phosphor-icons/react";
import type { Social } from "@/constants/socials";
import { cn } from "@/lib/utils";

/**
 * The animated half of the social hover card. Loaded lazily (idle time
 * after `load`, or the first pointer/focus on the badges) so Motion
 * never sits on the homepage's critical path. The interaction state
 * lives in social-tooltip.tsx and arrives here as props.
 */

const AVATAR = "/avatar/dp-128.webp";

/* Strong ease-out (Emil Kowalski): fast start, so the card answers the
   pointer on the very first frame. Enter 180ms, exit 120ms - leaving is
   always quicker than arriving. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const ENTER = { duration: 0.18, ease: EASE_OUT };
const EXIT = { duration: 0.12, ease: EASE_OUT };
/* The glide between icons is a critically damped spring (bounce 0): it
   keeps its velocity when the pointer changes its mind mid-flight, so a
   fast sweep back and forth reads as one object chasing the cursor,
   never as a restart. ~200ms to settle across one 44px step. */
const GLIDE = { type: "spring", visualDuration: 0.2, bounce: 0 } as const;

export type Placement = "top" | "bottom";

export interface CardTarget {
  /** card left, relative to the badge group */
  x: number;
  /** spring there (pointer, card already up) or jump (first open, keyboard) */
  glide: boolean;
  /** bumps on every request so the same x can be re-applied */
  seq: number;
}

/**
 * All three profiles are stacked in one grid cell and cross-fade by
 * opacity (+ a 2px blur that hides the double image mid-fade). The card
 * therefore never changes size and never re-mounts while it travels.
 * Radii are concentric: shell 20 = header 13 + padding 6 + border 1.
 */
function Card({ socials, active }: { socials: Social[]; active: Social }) {
  return (
    <div className="w-[248px] rounded-[20px] border border-transparent bg-white p-1.5 shadow-float [corner-shape:squircle]">
      {/* header: the badge's own face colour, so the card visibly belongs
          to the icon it points at */}
      <div className="relative h-[68px] overflow-hidden rounded-[13px] [corner-shape:squircle]">
        {socials.map((s) => {
          const Icon = s.icon;
          const on = s.label === active.label;
          return (
            <div
              key={s.label}
              className={cn(
                "absolute inset-0 flex items-start justify-between px-3 py-2.5 text-white transition-opacity duration-150 ease-out",
                on ? "opacity-100" : "opacity-0",
              )}
              style={{
                backgroundColor: s.skin.bg,
                boxShadow: `inset 0 0 0 1px ${s.skin.edge}, inset 0 1px 0 0 rgba(255,255,255,0.35)`,
                backgroundImage:
                  "radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.16), transparent 60%)",
              }}
            >
              <span className="flex items-center gap-1.5 text-[13px] leading-none font-medium text-white/95">
                <Icon className="size-3.5" />
                {s.platform}
              </span>
              <ArrowUpRightIcon weight="bold" className="size-3.5 text-white/70" />
            </div>
          );
        })}
      </div>

      <div className="px-2.5 pb-2.5">
        {/* same person on every platform: the portrait never cross-fades */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={AVATAR}
          alt=""
          width={44}
          height={44}
          draggable={false}
          className="relative -mt-[22px] size-11 rounded-full bg-neutral-200 object-cover ring-[3px] ring-white select-none"
        />

        <div className="mt-2 grid">
          {socials.map((s) => {
            const on = s.label === active.label;
            const p = s.profile;
            return (
              <div
                key={s.label}
                className={cn(
                  "col-start-1 row-start-1 min-w-0 transition-[opacity,filter] duration-150 ease-out",
                  on ? "opacity-100 blur-[0px]" : "opacity-0 blur-[2px]",
                )}
              >
                <p className="flex items-center gap-1 text-[15px] leading-5 font-semibold tracking-[-0.01em] text-neutral-900">
                  <span className="truncate">{p.name}</span>
                  {p.verified ? (
                    <SealCheckIcon weight="fill" className="size-[15px] shrink-0 text-blue-500" />
                  ) : null}
                </p>
                <p className="truncate text-[13px] leading-5 text-neutral-500">{p.handle}</p>
                <p className="mt-2.5 flex items-baseline gap-3 text-[13px] leading-none">
                  {p.stats.map((stat) => (
                    <span key={stat.label} className="flex items-baseline gap-1">
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {stat.value}
                      </span>
                      <span className="text-neutral-500">{stat.label}</span>
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SocialCard({
  socials,
  active,
  open,
  target,
  placement,
  origin,
  instant,
  reduce,
  onExitComplete,
}: {
  socials: Social[];
  active: Social;
  open: boolean;
  target: CardTarget;
  placement: Placement;
  origin: number;
  instant: boolean;
  reduce: boolean;
  onExitComplete: () => void;
}) {
  const x = useMotionValue(target.x);
  const glide = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    glide.current?.stop();
    if (target.glide && !reduce) glide.current = animate(x, target.x, GLIDE);
    else x.jump(target.x);
  }, [target, reduce, x]);

  useEffect(() => () => glide.current?.stop(), []);

  // Reduced motion: no travel, no scale - opacity only.
  const fromY = reduce ? 0 : placement === "top" ? 4 : -4;
  const fromScale = reduce ? 1 : 0.97;

  return (
    <motion.div
      aria-hidden
      style={{ x }}
      className={cn(
        "pointer-events-none absolute left-0 z-30 w-[248px]",
        placement === "top" ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]",
      )}
    >
      <AnimatePresence onExitComplete={onExitComplete}>
        {open && (
          <motion.div
            key="card"
            initial={instant ? false : { opacity: 0, scale: fromScale, y: fromY }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: ENTER }}
            exit={{
              opacity: 0,
              scale: reduce ? 1 : 0.98,
              y: fromY / 2,
              transition: EXIT,
            }}
            style={{
              transformOrigin: `${origin}px ${placement === "top" ? "100%" : "0%"}`,
            }}
          >
            <Card socials={socials} active={active} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
