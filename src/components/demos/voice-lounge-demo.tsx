"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HashStraightIcon, SpeakerHighIcon, SpeakerXIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Voice lounge - Discord-style voice channel tile, popover-style     */
/*                                                                     */
/*  Closed: header + stack pill (trigger). Click it and a panel grows  */
/*  FROM the stack into the member list; click a row (or the stack     */
/*  again) and it collapses back. Hovering any pill shows the muted    */
/*  hover wash + pointer.                                              */
/*                                                                     */
/*  Motion (popover family: one surface, one motion):                   */
/*  - Trigger press: scales to 0.96 while held, springs back - the     */
/*    press IS the feedback, no separate hover animation.              */
/*  - Panel: single surface scaling 0.92 -> 1 from the stack's corner */
/*    (top-left origin) + fade + blur-through (8px -> 0), on a snappy  */
/*    spring with a whisper of bounce. Items inside are already laid   */
/*    out and just fade up 4px on a tiny stagger - nothing flies,      */
/*    nothing is layout-animated, so stretch is impossible by          */
/*    construction (no layout/layoutId anywhere in this file).         */
/*  - Close: faster reverse - fade + scale back, no bounce, no blur.   */
/* ------------------------------------------------------------------ */

interface Member {
  id: string;
  name: string;
  avatar: string;
  muted: boolean;
}

const MEMBERS: Member[] = [
  { id: "v4", name: "negativ v4", avatar: "/pfps/negativ-v4.webp", muted: false },
  { id: "v3", name: "negativ v3", avatar: "/pfps/negativ-v3.webp", muted: false },
  { id: "v2", name: "negativ v2", avatar: "/pfps/negativ-v2.webp", muted: false },
  { id: "v1", name: "negativ v1", avatar: "/pfps/negativ-v1.webp", muted: true },
];

/* Panel open: snappy spring, whisper of bounce, blur-through. */
const PANEL_OPEN = {
  type: "spring",
  visualDuration: 0.38,
  bounce: 0.22,
} as const;
/* Panel close: quick fade + settle, spring-free so the ghost never
   overlaps the returning stack. */
const PANEL_CLOSE = { duration: 0.14, ease: [0.32, 0.72, 0, 1] } as const;
/* Rows inside: already laid out, fade + 4px rise, 35ms stagger. */
const ROW_IN = (i: number) => ({
  duration: 0.22,
  ease: [0.32, 0.72, 0, 1] as const,
  delay: 0.05 + i * 0.035,
});

const MUTED = "text-[#696969]";
const AVATAR = "size-8 rounded-full object-cover ring-1 ring-white";

function SpeakerGlyph({ muted }: { muted: boolean }) {
  const Icon = muted ? SpeakerXIcon : SpeakerHighIcon;
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center", MUTED)}>
      <Icon className="size-4" weight="fill" />
    </span>
  );
}

function Pill({
  label,
  onToggle,
  children,
}: {
  label: string;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      /* Press grows (inverse): the press itself scales the pill -
         release springs it back. whileTap, transform-only. */
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", visualDuration: 0.25, bounce: 0.3 }}
      className={cn(
        "flex h-8 cursor-pointer items-center gap-2.5 rounded-full pr-3 outline-none select-none",
        "transition-colors duration-150 hover:bg-neutral-900/[0.06]",
        "focus-visible:ring-2 focus-visible:ring-neutral-900/20",
      )}
    >
      {children}
    </motion.div>
  );
}

export default function VoiceLoungeDemo() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="flex min-h-160 w-full items-center justify-center bg-white py-20">
      <div className="select-none">
        {/* channel header - static anchor, never animates */}
        <div className="flex items-center gap-2">
          <HashStraightIcon className="size-5 text-neutral-900" weight="bold" />
          <span className="text-[20px] leading-5 font-semibold tracking-tight text-neutral-900">
            general-chat
          </span>
        </div>

        <div className="relative mt-3">
          <AnimatePresence initial={false} mode="popLayout">
            {!open ? (
              /* Closed: the stack pill - also the trigger. */
              <motion.div
                key="stack"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              >
                <Pill label="Expand voice channel" onToggle={toggle}>
                  <SpeakerGlyph muted={false} />
                  <div className="flex items-center">
                    {MEMBERS.map((m, i) => (
                      <span key={m.id} className={cn("shrink-0", i > 0 && "-ml-3")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.avatar} alt="" draggable={false} className={AVATAR} />
                      </span>
                    ))}
                  </div>
                </Pill>
              </motion.div>
            ) : (
              /* Open: ONE surface growing from the stack's corner.
                 Origin top-left = grows down-right out of the stack.
                 Blur-through masks the crossfade so it reads as one
                 continuous surface, not stack-then-list. */
              <motion.div
                key="panel"
                initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, transition: PANEL_CLOSE }}
                transition={PANEL_OPEN}
                className="flex origin-top-left flex-col gap-1"
              >
                {MEMBERS.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={ROW_IN(i)}
                  >
                    <Pill label={`Collapse ${m.name}`} onToggle={toggle}>
                      <SpeakerGlyph muted={m.muted} />
                      <span className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.avatar} alt={m.name} draggable={false} className={AVATAR} />
                      </span>
                      <span className={cn("text-[15px] leading-5 font-medium whitespace-nowrap", MUTED)}>
                        {m.name}
                      </span>
                    </Pill>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
