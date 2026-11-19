"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  ArrowUpIcon,
  CaretDownIcon,
  CheckIcon,
  GlobeIcon,
  ImageIcon,
  MicrophoneIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Siteforge - AI website prompt bar                                  */
/*                                                                     */
/*  House rules, per the brief:                                        */
/*  - squircle corners on EVERYTHING ([corner-shape:squircle] rides    */
/*    alongside every radius - rounded-[inherit] alone would not carry */
/*    the corner shape to inner layers)                                */
/*  - 0.5px borders (border-[0.5px]) throughout                        */
/*  - phosphor icons only, neutral-50/100 + white tints, no 3D emoji   */
/*  - send button reuses the Book-a-call blue gradient + inset gloss,  */
/*    outer drop shadows stripped                                       */
/* ------------------------------------------------------------------ */

const SQUIRCLE = "[corner-shape:squircle]";
const HAIRLINE = "border-[0.5px] border-neutral-200";
/* pill treatment - neutral gradient wash + near-invisible 0.5px edge */
const PILL = "border-[0.5px] border-neutral-200 bg-white";

const CHIP_SHADOW = "0 1px 1px 0 rgba(0,0,0,0.04)";

/* Book-a-call gloss, inset layers only - no outer drops */
const SEND_INSET_SHADOW =
  "inset 0 1px 0 0 rgba(255,255,255,0.4), inset 4px 4px 4px 0 rgba(255,255,255,0.06), inset -4px 4px 4px 0 rgba(255,255,255,0.06), inset 6px 6px 6px 0 rgba(255,255,255,0.04), inset -6px 6px 6px 0 rgba(255,255,255,0.04), inset 8px 8px 8px 0 rgba(255,255,255,0.02), inset -8px 8px 8px 0 rgba(255,255,255,0.02)";

interface Attachment {
  id: string;
  name: string;
  kind: "image" | "doc";
}

const MAX_FILES = 10;

/* Scroll-triggered edge fades for the chip rail. The right fade shows
   only while content overflows to the right; the left fade shows only
   after scrolling rightward, and vanishes again at the left edge.
   Single rAF-throttled scroll/resize reader writing two booleans - no
   observers, no layout reads per frame, no re-render churn. */
function useRailEdges(dep: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atLeft, setAtLeft] = useState(true);
  const [atRight, setAtRight] = useState(true);
  const raf = useRef(0);
  /* Re-binds whenever the chip count changes: the scroller mounts
     conditionally and its scrollWidth settles after layout, so a
     mount-once reader misses the exact moment overflow first appears.
     ResizeObserver catches content + box changes; scroll + window
     resize cover the rest. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const read = () => {
      raf.current = 0;
      setAtLeft(el.scrollLeft <= 1);
      setAtRight(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    const schedule = () => {
      if (!raf.current) raf.current = requestAnimationFrame(read);
    };
    read();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [dep]);
  return { scrollerRef, showLeft: !atLeft, showRight: !atRight };
}

const SEED_ATTACHMENTS: Attachment[] = [
  { id: "a1", name: "hero-mockup.png", kind: "image" },
  { id: "a2", name: "brief.pdf", kind: "doc" },
  { id: "a3", name: "palette.png", kind: "image" },
];

const MODELS = ["Siteforge 1.0", "Siteforge Pro", "Siteforge Fast"] as const;

/* Rail motion language (Emil's rules): entering/exiting runs a fast
   ease-out tween - exits especially stay spring-free, because a
   springy ghost overlaps the slide and reads as "stuck". Sibling
   movement rides a short no-bounce spring on the same tick (popLayout
   vacates the slot instantly), so shrink + slide share one clock. */
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const CHIP_TWEEN = { duration: 0.18, ease: EASE_OUT } as const;
const CHIP_LAYOUT_SPRING = {
  type: "spring",
  visualDuration: 0.25,
  bounce: 0,
} as const;
/* Shell spring - the bar's height follows on a touch slower clock so
   the chips lead and the container catches up, no snap. */
const APPLE_SPRING = {
  type: "spring",
  visualDuration: 0.35,
  bounce: 0.12,
} as const;

function AttachmentChip({
  file,
  onRemove,
}: {
  file: Attachment;
  onRemove: () => void;
}) {
  /* Enter from 0.9 (never from nothing); exit is a 180ms shrink + blur
     that hands off to the siblings' slide in the same tick - the blur
     masks the handoff so it reads as one motion, not fade-then-jump. */
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, filter: "blur(2px)" }}
      transition={{ default: CHIP_TWEEN, layout: CHIP_LAYOUT_SPRING }}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full py-1 pr-1.5 pl-1.5",
        PILL,
        SQUIRCLE,
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full",
          SQUIRCLE,
          file.kind === "image"
            ? "bg-sky-500/10 text-sky-600"
            : "bg-amber-500/10 text-amber-600",
        )}
      >
        <ImageIcon className="size-3.5" weight="duotone" />
      </span>
      <span className="max-w-36 truncate text-sm font-medium text-neutral-800">
        {file.name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="flex size-5 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 active:scale-95 ml-0.5"
      >
        <XIcon className="size-3" weight="bold" />
      </button>
    </motion.span>
  );
}

function ToolbarButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        /* locked square at every width - never crushed, never a
           vertical rectangle; icon steps down instead on tiny screens */
        "flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors active:scale-95 max-[400px]:size-7",
        PILL,
        SQUIRCLE,
        active ? "text-red-500" : "text-neutral-500 hover:text-neutral-800",
      )}
      style={{ boxShadow: CHIP_SHADOW }}
    >
      {children}
    </button>
  );
}

/* Recording voiceprint - 4 bars cycling heights out of phase, the
   standard recording idiom. scaleY only (GPU-cheap), staggered so it
   reads as a live wave, not a blink. */
function VoiceWave() {
  return (
    <motion.span
      aria-hidden
      className="flex h-4 items-center gap-0.5"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={CHIP_TWEEN}
    >
      {/* small → big → small envelope; one shared period with per-bar
          phase offsets so the peak travels left-to-right as a wave */}
      {[0.55, 1, 0.85, 0.55].map((peak, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="h-4 w-0.5 origin-center rounded-full bg-red-500/75"
          animate={{ scaleY: [0.25, peak, 0.25] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.16,
          }}
        />
      ))}
    </motion.span>
  );
}

function ModelPicker({
  model,
  onChange,
}: {
  model: (typeof MODELS)[number];
  onChange: (m: (typeof MODELS)[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  /* Outside-click close: a pointerdown outside the whole picker (button
     + menu) collapses it. Covers empty stage clicks that blur alone
     can miss, and beats the blur race on option buttons. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open ]);
  /* In-tree menu: no overflow-hidden ancestor clips it anymore, so a
     plain absolute menu sits exactly at the button - opens downward,
     left-aligned, 6px gap. No measuring, nothing to drift. */
  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={(e) => {
          if (!e.relatedTarget || e.relatedTarget.closest("[data-model-menu]"))
            return;
          setOpen(false);
        }}
        className={cn(
          /* pill yields first: truncates the model name, shrinks the
             globe/caret, then the whole picker compresses - the square
             keys never give up their shape */
          "flex h-7.5 min-w-0 max-w-full cursor-pointer items-center justify-center gap-1.5 rounded-full pr-2.5 pl-3 text-sm font-medium text-neutral-700 transition-colors active:scale-[0.98] max-[400px]:h-7 max-[400px]:gap-1 max-[400px]:pr-2 max-[400px]:pl-2.5 max-[400px]:text-[13px]",
          PILL,
          SQUIRCLE,
        )}
        style={{ boxShadow: CHIP_SHADOW }}
      >
        <GlobeIcon className="size-4 shrink-0 text-neutral-400 max-[400px]:size-3.5" weight="duotone" />
        <span className="min-w-0 flex-1 truncate">{model}</span>
        <CaretDownIcon className="size-3 shrink-0 text-neutral-400 max-[400px]:size-2.5" weight="bold" />
      </button>
      {open && (
        <motion.div
          data-model-menu
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={CHIP_TWEEN}
          className={cn(
            "absolute top-full left-0 z-20 mt-1.5 w-44 rounded-2xl border bg-white p-1",
            HAIRLINE,
            SQUIRCLE,
          )}
          style={{ boxShadow: "0 2px 8px -2px rgba(0,0,0,0.08)" }} 
        >
          {MODELS.map((m) => (
            <button
              key={m}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(m);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1 text-left text-sm transition-colors mb-px",
                SQUIRCLE,
                m === model
                  ? "bg-neutral-100 font-medium text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-100/60",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{m}</span>
              {m === model && (
                <CheckIcon className="size-3.5 shrink-0 text-neutral-700" weight="bold" />
              )}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function SiteforgePromptDemo() {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] =
    useState<Attachment[]>(SEED_ATTACHMENTS);
  const [model, setModel] = useState<(typeof MODELS)[number]>(MODELS[0]);
  const [recording, setRecording] = useState(false);
  /* Over-cap error: message + shake key. Keying the banner remounts it
     so the shake replays on every rejected add, and the timeout
     fades it out after 3s. */
  const [capError, setCapError] = useState(0);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hitCap = () => {
    if (capTimer.current) clearTimeout(capTimer.current);
    setCapError((n) => n + 1);
    capTimer.current = setTimeout(() => {
      setCapError(0);
      capTimer.current = null;
    }, 3000);
  };
  useEffect(
    () => () => {
      if (capTimer.current) clearTimeout(capTimer.current);
    },
    [],
  );
  const { scrollerRef, showLeft, showRight } = useRailEdges(
    attachments.length,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const canSend =
    value.trim().length > 0 || attachments.length > 0 || recording;

  const send = () => {
    if (!canSend) return;
    setRecording(false);
    setValue("");
  };

  /* transparent stage - no bg, no border: centers the bar in a tall
     room. Padding collapses toward zero on tiny screens so the bar
     spends its full 350px on content instead of gutters. */
  return (
    <div className="flex min-h-160 w-full items-center justify-center py-10 transition-colors md:py-20">
      <div className="flex w-full max-w-xl flex-col gap-2 ">
        <LayoutGroup>
          <motion.div
            layout
            transition={APPLE_SPRING}
            className={cn(
              "w-full rounded-[50px] border bg-neutral-100",
              HAIRLINE,
              SQUIRCLE,
            )}
            style={{
              boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.9)",
            }}
          >
            {/* attachment rail - AnimatePresence around the conditional
              mount so 0↔1 chips resize the shell with the same spring
              instead of snapping; popLayout lets a removed chip vacate
              layout immediately while its exit plays, so neighbours
              glide into place instead of jumping */}
            <AnimatePresence initial={false}>
              {attachments.length > 0 && (
                <motion.div
                  key="rail"
                  layout
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={APPLE_SPRING}
                  className="overflow-hidden"
                >
                  <div className="overflow-hidden relative rounded-lg mx-4 mt-0.5">
                    <div
                      ref={scrollerRef}
                      className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5"
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {attachments.map((file) => (
                          <AttachmentChip
                            key={file.id}
                            file={file}
                            onRemove={() =>
                              setAttachments((prev) =>
                                prev.filter((a) => a.id !== file.id),
                              )
                            }
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* edge fades are scroll-driven: right shows only
                        while overflow waits rightward, left shows only
                        after scrolling right - both fade, never snap */}
                    <motion.div
                      aria-hidden
                      className="absolute inset-y-0 right-0 w-12 bg-linear-to-l from-neutral-100 via-neutral-100 to-transparent z-10 pointer-events-none"
                      initial={false}
                      animate={{ opacity: showRight ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                    <motion.div
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-12 bg-linear-to-r from-neutral-100 via-neutral-100 to-transparent z-10 pointer-events-none"
                      initial={false}
                      animate={{ opacity: showLeft ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  </div>
                  {/* over-cap error: shake on entry, gone at 3s */}
                  <AnimatePresence>
                    {capError > 0 && (
                      <motion.p
                        key={capError}
                        role="alert"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={APPLE_SPRING}
                        className="overflow-hidden"
                      >
                        <motion.span
                          initial={{ x: 0 }}
                          animate={{ x: [0, -6, 6, -4, 4, 0] }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="block px-6 pb-2 text-[13px] font-medium text-red-500"
                        >
                          Maximum {MAX_FILES} files allowed.
                        </motion.span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={cn(
                "bg-white m-px rounded-[48px] border-[0.5px] border-neutral-200",
                SQUIRCLE,
              )}
            >
              {/* prompt field */}
              <div className="px-4 pt-3.5 bg-white rounded-[48px]">
                <textarea
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    /* typing claims the turn - a live recording while
                       text lands would fight for the same input */
                    if (recording) setRecording(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={3}
                  placeholder="Describe the site you want…"
                  /* 16px on touch layouts: iOS auto-zooms into any field
                     under 16px on focus - the zoom jump reads as broken
                     layout. Desktop keeps the designed 15px. */
                  className="w-full resize-none bg-transparent text-base leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 sm:text-[15px]"
                />
              </div>

              {/* toolbar - gap + insets tighten under 400px; the spacer
                  is allowed to vanish so keys keep their size */}
              <div className="flex items-center gap-2 px-4 pt-1 pb-3 max-[400px]:gap-1.5 max-[400px]:px-2.5">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    if (picked.length === 0) return;
                    /* cap at MAX_FILES: keep the head of the pick that
                       fits, shake on any overflow (even partial) */
                    const room = Math.max(0, MAX_FILES - attachments.length);
                    if (room <= 0 || picked.length > room) hitCap();
                    const accepted = picked.slice(0, room).map(
                      (f, i): Attachment => ({
                        id: `${Date.now()}-${i}`,
                        name: f.name,
                        kind: f.type.startsWith("image/") ? "image" : "doc",
                      }),
                    );
                    if (accepted.length > 0)
                      setAttachments((prev) => [...prev, ...accepted]);
                  }}
                />
                <ToolbarButton
                  label="Attach files"
                  onClick={() => fileRef.current?.click()}
                >
                  <PlusIcon className="size-4" weight="bold" />
                </ToolbarButton>
                <ToolbarButton
                  label={recording ? "Stop recording" : "Voice input"}
                  active={recording}
                  onClick={() => setRecording((r) => !r)}
                >
                  {recording ? (
                    <VoiceWave />
                  ) : (
                    <MicrophoneIcon className="size-4" weight="duotone" />
                  )}
                </ToolbarButton>
                <ModelPicker model={model} onChange={setModel} />
                {/* spacer pins send to the right end at every width */}
                <div className="min-w-0 flex-1" />
                {/* send - Book-a-call blue, inset gloss only */}
                <button
                  type="button"
                  onClick={send}
                  disabled={!canSend}
                  aria-label="Generate site"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border border-sky-600 bg-linear-to-b from-sky-400 to-sky-500 text-white transition-all active:scale-95 max-[400px]:size-7",
                    SQUIRCLE,
                    canSend
                      ? "cursor-pointer opacity-100"
                      : "cursor-default opacity-40 saturate-50",
                  )}
                  style={{ boxShadow: SEND_INSET_SHADOW }}
                >
                  <ArrowUpIcon className="size-4" weight="bold" />
                </button>
              </div>
            </div>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
}
