"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

/**
 * BluePlayer2 - light skeuomorphic media player. Second of two players:
 * `blue-player.tsx` is the original pebble build and stays untouched; this
 * is the wide pill from SkeuoMediaPlayerLight, adapted for the about page.
 *
 * Where it differs from the source component
 *   - Album art is the real poster (`/music/blue-poster-320.webp`), not the
 *     generated underwater SVG, and the record's hub disc and spindle are
 *     removed - the art is left clean inside the bezel.
 *   - The clock is the actual audio element: the same 30s BLUE preview the
 *     first player streams, looped. Duration and position come from the
 *     file, so the readout runs 0:00 -> 0:30 instead of the demo 1:27/5:42.
 *   - Transport presses fire the site's `/sounds/click.mp3`, like the first
 *     player, so the page keeps one tactile vocabulary.
 *   - Type is Geist (the site face) rather than the source's Inter/system
 *     stack, which is not loaded here.
 *   - Rendered through `useFitScale` at 75% of the about column (see
 *     `PLAYER_FIT`), so the fixed 780x255 artboard stays an inset object
 *     instead of a full-bleed bar.
 *   - Transport slots use uniform padding, so `rounded-full` gives a true
 *     circle; the source's wider X padding produced an ellipse whose top and
 *     bottom edges read as flat.
 *
 * Layer order (mandatory per skill)
 *   1. scene  ->  2. raised shell  ->  3. inset zones  ->  4. raised objects
 *   ->  5. readouts (text, icons, perforations)
 *
 * Foundations    light scene, shell #f1f1f1 -> #e0e0e0, light from the top
 *                on every layer
 *   §1 Raised      pill shell: white insets + three-layer soft black lift
 *   §2 Inset       album well, button slots, track, speaker well and face,
 *                  on bases darker than the shell
 *   §3 Popping     transport caps, slider thumb, speaker rim (raised recipe);
 *                  the crisp stack only on play, the hero control
 *   Learned rules  one inset slot per button, cap flush on the Y-axis with the
 *                  spare room on the X-axis; children reuse the shell gradient
 *   Interaction    grab / grabbing cursors, active:scale-[0.97], spring fill,
 *                  130-150ms transitions
 *   Glow           restrained accent glow on the thumb and, only while
 *                  playing, on the play icon
 */

/* ==========================================================================
   1. Theme tokens: the dark build's palette, flipped to light
   Every colour and shadow is a CSS custom property, so the player can be
   retuned from here. Each stack keeps the skill's layers, offsets and blur;
   only colours and alphas flip. § numbers refer to the skill's Core
   Material Recipes.
   ========================================================================== */

/** React's CSSProperties has no index signature for `--*`, so widen it. */
type ThemeTokens = CSSProperties & Record<`--${string}`, string>;

const THEME: ThemeTokens = {
  /* 1 · Scene: very light, with a soft vignette --------------------------- */
  "--mp-scene":
    "radial-gradient(130% 110% at 50% 40%, #f6f6f6 0%, #f3f3f3 55%, #ebebeb 100%)",

  /* 2 · Raised material: shell, transport caps, speaker rim -------------- */
  "--mp-raised-from": "#f1f1f1",
  "--mp-raised-to": "#e0e0e0",
  /* §1 Raised Shell and §3 Popping Objects, flipped */
  "--mp-raised-shadow":
    "inset 0 1px 0.5px #ffffffcc, inset 0 1px 2px #ffffff, 0 10px 10px -9px #00000033, 0 20px 20px -14px #00000029, 0 0 6px 0 #0000001f",
  /* §1 crisp stack, flipped; reserved for the hero control (play) */
  "--mp-raised-shadow-crisp":
    "inset 0 0.5px 0 #ffffffcc, inset 0 1px 0.5px #ffffff, 0 10px 10px -9px #00000033, 0 20px 20px -14px #00000029, 0 0 6px 0 #0000001f",
  /* Pressed: same layer order so it interpolates; the lift drops and the top
     inset darkens as the cap sinks into its slot. */
  "--mp-raised-shadow-pressed":
    "inset 0 1px 0.5px #ffffff80, inset 0 2px 4px #0000001f, 0 4px 5px -4px #00000033, 0 8px 10px -8px #00000024, 0 0 3px 0 #0000001f",
  "--mp-raised-hover":
    "linear-gradient(to bottom, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 65%)",

  /* 3 · Inset material: album well, button slots, track, speaker well + face */
  /* §2 Inset Surface, flipped */
  "--mp-inset-lip": "0 0.5px 0 #ffffff",
  "--mp-inset-depth": "inset 0 2px 6px #00000025",
  /* Bases: a step darker than the shell so every cavity reads as carved */
  "--mp-well-bg": "#d4d4d4",
  "--mp-slot-bg": "#d6d6d6",
  "--mp-track-bg": "#c6c6c6",
  "--mp-speaker-face": "#e4e4e4",

  /* 5 · Readouts ----------------------------------------------------------- */
  "--mp-text-strong": "#0b0f14",
  "--mp-text-muted": "#666666", /* 4.7:1 on the shell (WCAG AA) */
  "--mp-text-shadow": "0 1px 0 rgba(255, 255, 255, 0.7)",
  "--mp-icon": "#0b0f14",
  "--mp-icon-filter": "drop-shadow(0 1px 0 rgba(255, 255, 255, 0.75))",
  /* Restrained, state-aware glow: the play icon lights up only while playing */
  "--mp-icon-filter-active":
    "drop-shadow(0 1px 0 rgba(255, 255, 255, 0.75)) drop-shadow(0 0 6px rgba(26, 122, 232, 0.4))",

  /* Accent ------------------------------------------------------------------ */
  "--mp-accent-from": "#0a63d6",
  "--mp-accent-to": "#1a7ae8",
  "--mp-thumb-bg":
    "radial-gradient(circle closest-side, #0a2440 0%, #0d3159 40%, rgba(13, 49, 89, 0) 44%), linear-gradient(to bottom, #168ae6, #0a66d2)",
  "--mp-thumb-shadow":
    "inset 0 1px 0.5px #ffffff1a, inset 0 1px 2px #ffffff35, 0 10px 10px -9px #00000033, 0 20px 20px -14px #00000029, 0 0 6px 0 #0000001f, 0 0 8px 0 #1a7ae840",
  "--mp-focus": "#1a7ae8",

  /* Speaker perforations ---------------------------------------------------- */
  "--mp-hole":
    "radial-gradient(circle at 50% 78%, #2c2c2c 0%, #0c0c0c 55%, #050505 100%)",
  "--mp-hole-shadow": "inset 0 1px 1px #000000d9, 0 0.5px 0 #fffffff2",

  /* Chrome bezel + album glass: polished metal mirrors the bright scene --- */
  "--mp-chrome":
    "conic-gradient(from 0deg, #585858 0deg, #636363 40deg, #8d8d8d 84deg, #d0d0d0 118deg, #9b9b9b 150deg, #a9a9a9 180deg, #cecece 212deg, #9d9d9d 244deg, #868686 272deg, #5e5e5e 306deg, #585858 360deg)",
  "--mp-chrome-turn":
    "radial-gradient(circle closest-side, rgba(255, 255, 255, 0) 91.5%, rgba(255, 255, 255, 0.24) 95%, rgba(255, 255, 255, 0) 98.5%)",
  "--mp-chrome-edge": "inset 0 0 0 1px rgba(0, 0, 0, 0.3)",
  "--mp-art-edge": "0 0 0 1.5px #050608, 0 1.5px 0 1.5px rgba(255, 255, 255, 0.5)",
  "--mp-art-fallback": "#031b3a",
  "--mp-glass-sheen":
    "linear-gradient(160deg, rgba(255, 255, 255, 0.13) 0%, rgba(255, 255, 255, 0.03) 36%, rgba(255, 255, 255, 0) 52%)",
  "--mp-glass-shadow":
    "inset 0 2px 6px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(0, 0, 0, 0.3)",

  /* Motion ------------------------------------------------------------------ */
  "--mp-spring": "cubic-bezier(0.34, 1.4, 0.64, 1)",
};

/* ==========================================================================
   2. Source media
   ========================================================================== */

/** BLUE - Billie Eilish. Same iTunes 30s preview the first player streams. */
const PREVIEW_URL =
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/29/55/12/29551211-8ee4-c75f-3cbe-95c1a7eaa6fe/mzaf_15864137434256663479.plus.aac.p.m4a";
/** iTunes previews are 30s; seeded so the readout is sane before metadata. */
const PREVIEW_SECONDS = 30;
const POSTER = "/music/blue-poster-320.webp";
const CLICK_SFX = "/sounds/click.mp3";
const VOLUME = 0.6;

/* ==========================================================================
   3. Geometry (1x)
   ========================================================================== */

const PLAYER = { width: 780, height: 255 };

const SPEAKER = {
  size: 192, // well diameter
  lip: 1.5, // visible well edge around the rim
  rim: 3, // embossed rim width
  hole: 5, // perforation diameter
  rings: 6, // rings around the centre hole
  ringGap: 12, // radial spacing between rings, ~25% wider than the pitch
  pitch: 9.6, // target arc spacing between neighbouring holes
};
const FACE_RADIUS = SPEAKER.size / 2 - SPEAKER.lip - SPEAKER.rim;

/**
 * Transport row (skill: Nested Inset + Popping Button). Each cap sits in its
 * own inset slot. Padding is uniform on both axes, so every slot is exactly
 * the cap plus 2 x pad and `rounded-full` resolves to a true circle - the
 * source's wider X padding made an ellipse, which read as a flat top edge.
 * 2 x (56 + 12) + (84 + 12) + 2 x 10 = 252, centred under the 270 slider.
 */
const TRANSPORT = { small: 56, play: 84, pad: 6, gap: 10 };

/* ==========================================================================
   4. Scoped styles (skill materials, exact geometry, states, motion)
   ========================================================================== */

const STYLES = `
.mp-root {
  width: ${PLAYER.width}px;
  height: ${PLAYER.height}px;
  flex: none;
  font-family: var(--font-geist-sans), "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.mp-root *, .mp-root *::before, .mp-root *::after { box-sizing: border-box; }

/* 2 · Raised shell */
.mp-shell {
  padding: 0 26px 0 20px;
  background: linear-gradient(to bottom, var(--mp-raised-from), var(--mp-raised-to));
  box-shadow: var(--mp-raised-shadow);
}

/* 3 · Inset zone: album well -> chrome bezel -> art */
.mp-album {
  flex: none;
  width: 215px;
  height: 215px;
  padding: 1.5px;
  background: var(--mp-well-bg);
  box-shadow: var(--mp-inset-lip), var(--mp-inset-depth);
}
.mp-bezel {
  padding: 9.5px;
  background: var(--mp-chrome-turn), var(--mp-chrome);
  box-shadow: var(--mp-chrome-edge);
}
.mp-art {
  isolation: isolate;
  background: var(--mp-art-fallback);
  box-shadow: var(--mp-art-edge);
}
.mp-glass {
  background: var(--mp-glass-sheen);
  box-shadow: var(--mp-glass-shadow);
}

/* Info column: line boxes are fixed so the rhythm holds in any font */
.mp-info {
  flex: none;
  width: 270px;
  min-width: 0;
  margin-left: 32px;
  padding-top: 36px;
}
.mp-title,
.mp-artist { margin: 0; }
.mp-title {
  font-size: 22px;
  line-height: 28px;
  letter-spacing: -0.01em;
  color: var(--mp-text-strong);
}
.mp-artist {
  margin-top: 3.5px;
  font-size: 17px;
  line-height: 22px;
  font-weight: 400;
  color: var(--mp-text-muted);
}

/* 3 · Inset track  ->  4 · raised thumb */
.mp-slider {
  height: 20px;
  margin-top: 11.5px;
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}
.mp-slider::before { content: ""; position: absolute; inset: -6px -9px; } /* larger hit area */
.mp-slider.is-dragging { cursor: grabbing; }
.mp-track {
  top: 7px;
  height: 6px;
  background: var(--mp-track-bg);
  box-shadow: var(--mp-inset-lip);
}
/* The depth sits above the fill, so the blue reads as poured into the groove */
.mp-track::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(--mp-inset-depth);
  pointer-events: none;
}
.mp-fill {
  background: linear-gradient(90deg, var(--mp-accent-from), var(--mp-accent-to));
  transition: width 240ms var(--mp-spring);
}
.mp-thumb {
  top: 10px;
  width: 15px;
  height: 15px;
  margin: -7.5px 0 0 -7.5px;
  background: var(--mp-thumb-bg);
  box-shadow: var(--mp-thumb-shadow);
  transition: left 240ms var(--mp-spring), transform 120ms ease-out;
}
.mp-slider.is-dragging .mp-fill { transition: none; }
.mp-slider.is-dragging .mp-thumb { transition: transform 120ms ease-out; transform: scale(1.1); }
.mp-slider:focus-visible .mp-thumb { outline: 2px solid var(--mp-focus); outline-offset: 2px; }

.mp-times {
  margin-top: 1.5px;
  font-size: 15px;
  line-height: 18px;
  color: var(--mp-text-muted);
}
.mp-title,
.mp-artist,
.mp-times { text-shadow: var(--mp-text-shadow); }

/* 3 · One inset slot per transport button (skill: Nested Inset + Popping
   Button). The cap is flush on the Y-axis and the spare room sits on the
   X-axis; overflow keeps each cap's lift shadow inside its own well. */
.mp-controls {
  gap: ${TRANSPORT.gap}px;
  height: ${TRANSPORT.play + TRANSPORT.pad * 2}px;
  margin-top: 0.5px;
}
.mp-slot {
  position: relative;
  flex: none;
  padding: ${TRANSPORT.pad}px;
  overflow: hidden;
  background: var(--mp-slot-bg);
  box-shadow: var(--mp-inset-lip), var(--mp-inset-depth);
}
.mp-slot--sm {
  width: ${TRANSPORT.small + TRANSPORT.pad * 2}px;
  height: ${TRANSPORT.small + TRANSPORT.pad * 2}px;
}
.mp-slot--play {
  width: ${TRANSPORT.play + TRANSPORT.pad * 2}px;
  height: ${TRANSPORT.play + TRANSPORT.pad * 2}px;
  top: -3px; /* the hero control sits a touch higher, as in the reference */
}

/* 4 · Popping caps: §3 raised recipe on the shell's own gradient */
.mp-btn {
  --mp-btn-shadow: var(--mp-raised-shadow);
  flex: none;
  height: 100%; /* flush on the Y-axis */
  aspect-ratio: 1 / 1;
  margin: 0;
  padding: 0;
  border: 0;
  background: linear-gradient(to bottom, var(--mp-raised-from), var(--mp-raised-to));
  box-shadow: var(--mp-btn-shadow);
  color: var(--mp-icon);
  font: inherit;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 130ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 130ms ease-out;
}
.mp-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--mp-raised-hover);
  opacity: 0;
  transition: opacity 150ms ease-out;
  pointer-events: none;
}
.mp-btn > * { /* icons sit above the hover sheen */
  position: relative;
  filter: var(--mp-icon-filter);
  transition: filter 140ms ease-out;
}
@media (hover: hover) {
  .mp-btn:hover::before { opacity: 1; }
}
.mp-btn:active { transform: scale(0.97); box-shadow: var(--mp-raised-shadow-pressed); }
.mp-btn:focus-visible { outline: 2px solid var(--mp-focus); outline-offset: 2px; }
.mp-btn--play { --mp-btn-shadow: var(--mp-raised-shadow-crisp); }

/* 5 · Icon transitions */
.mp-swap { display: block; width: 32px; height: 32px; }
.mp-swap > svg { position: absolute; inset: 0; transition: opacity 140ms ease-out, transform 140ms ease-out; }
.mp-swap > .mp-ico-pause { opacity: 0; transform: scale(0.6); }
.mp-btn--play[data-playing="true"] .mp-ico-play { opacity: 0; transform: scale(0.6); }
.mp-btn--play[data-playing="true"] .mp-ico-pause { opacity: 1; transform: none; }
.mp-btn--play[data-playing="true"] > .mp-swap { filter: var(--mp-icon-filter-active); }
.mp-vol-arc { transform-origin: 12px 10px; transition: opacity 140ms ease-out, transform 140ms ease-out; }
.mp-btn[data-muted="true"] .mp-vol-arc { opacity: 0; transform: scale(0.6); }

/* 3 · Speaker well  ->  4 · embossed rim  ->  3 · inset face  ->  5 · perforations */
.mp-speaker {
  flex: none;
  width: ${SPEAKER.size}px;
  height: ${SPEAKER.size}px;
  padding: ${SPEAKER.lip}px;
  overflow: hidden; /* the rim's lift shadow stays inside its well */
  background: var(--mp-well-bg);
  box-shadow: var(--mp-inset-lip), var(--mp-inset-depth);
}
.mp-speaker-rim {
  padding: ${SPEAKER.rim}px;
  background: linear-gradient(to bottom, var(--mp-raised-from), var(--mp-raised-to));
  box-shadow: var(--mp-raised-shadow);
}
.mp-speaker-face {
  background: var(--mp-speaker-face);
  box-shadow: var(--mp-inset-lip), var(--mp-inset-depth);
}
.mp-hole {
  width: ${SPEAKER.hole}px;
  height: ${SPEAKER.hole}px;
  margin: -${SPEAKER.hole / 2}px 0 0 -${SPEAKER.hole / 2}px;
  background: var(--mp-hole);
  box-shadow: var(--mp-hole-shadow);
}

@media (prefers-reduced-motion: reduce) {
  .mp-root *, .mp-root *::before, .mp-root *::after { transition-duration: 1ms !important; }
}
`;

/* ==========================================================================
   5. Helpers
   ========================================================================== */

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const round2 = (value: number): number => Math.round(value * 100) / 100;

/** 87 -> "1:27", 3725 -> "1:02:05" */
function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/**
 * Concentric perforations: a centre hole plus rings whose hole count is
 * proportional to their circumference. Alternate rings are rotated by half a
 * pitch so the pattern doesn't form radial spokes.
 */
function buildSpeakerHoles({
  rings,
  ringGap,
  pitch,
}: {
  rings: number;
  ringGap: number;
  pitch: number;
}): { x: number; y: number }[] {
  const holes = [{ x: 0, y: 0 }];
  for (let ring = 1; ring <= rings; ring += 1) {
    const radius = ring * ringGap;
    const count = Math.round((2 * Math.PI * radius) / pitch);
    const phase = ring % 2 === 0 ? Math.PI / count : 0;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + phase + (i / count) * 2 * Math.PI;
      holes.push({
        x: round2(radius * Math.cos(angle)),
        y: round2(radius * Math.sin(angle)),
      });
    }
  }
  return holes;
}

const SPEAKER_HOLES = buildSpeakerHoles(SPEAKER);

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Rendered at three quarters of the column it sits in, so the pill reads
    as an inset object on the about page. 1 would be full column width. */
const PLAYER_FIT = 0.75;

/** Scales fixed-size content down so it always fits its container. */
function useFitScale(
  ref: RefObject<HTMLElement | null>,
  contentWidth: number,
  fit = 1,
): number {
  const [scale, setScale] = useState(1);
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = (): void =>
      setScale(Math.min(1, (el.clientWidth * fit) / contentWidth));
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, contentWidth, fit]);
  return scale;
}

/* ==========================================================================
   6. Icons (inline SVG, near-black via currentColor)
   ========================================================================== */

function PrevIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.25" width="2.6" height="17.5" rx="1" fill="currentColor" />
      <path
        d="M17.75 2.25 L6.25 10 L17.75 17.75 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Play and pause stacked; CSS cross-fades them from the button's data-playing. */
function PlayPauseIcon() {
  return (
    <span className="mp-swap" aria-hidden="true">
      {/* Triangle sits ~2px right of centre for optical balance, as in the reference */}
      <svg className="mp-ico-play" width="32" height="32" viewBox="0 0 32 32" focusable="false">
        <path
          d="M7.25 2.25 L29.25 16 L7.25 29.75 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="mp-ico-pause" width="32" height="32" viewBox="0 0 32 32" focusable="false">
        <rect x="6" y="3.5" width="7" height="25" rx="2" fill="currentColor" />
        <rect x="19" y="3.5" width="7" height="25" rx="2" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Speaker with two sound-wave arcs; CSS removes the arcs when data-muted is true. */
function VolumeIcon() {
  return (
    <svg width="24" height="20" viewBox="0 0 24 20" aria-hidden="true" focusable="false">
      <path
        d="M2.25 7 H6 L11.5 2.25 V17.75 L6 13 H2.25 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        className="mp-vol-arc"
        d="M14.75 6.75 A4.25 4.25 0 0 1 14.75 13.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className="mp-vol-arc"
        d="M17.7 2.7 A9.25 9.25 0 0 1 17.7 17.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ==========================================================================
   7. SkeuoMediaPlayer
   ========================================================================== */

export function SkeuoMediaPlayer({
  title = "Blue",
  artist = "Billie Eilish",
  albumArt = POSTER,
  className,
}: {
  title?: string;
  artist?: string;
  albumArt?: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  /* pending scrub position in seconds; null means "not dragging" */
  const dragRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [duration, setDuration] = useState(PREVIEW_SECONDS);
  const [dragging, setDragging] = useState(false);
  const [scrub, setScrub] = useState(0);

  const total = duration > 0 ? duration : PREVIEW_SECONDS;
  const time = clamp(dragging ? scrub : audioTime, 0, total);
  const percent = `${total > 0 ? (time / total) * 100 : 0}%`;

  useEffect(() => {
    const audio = new Audio(PREVIEW_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME;
    audioRef.current = audio;

    const onTime = (): void => {
      if (dragRef.current === null) setAudioTime(audio.currentTime);
    };
    const onMeta = (): void => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    /* playback state follows the element itself: no stale-closure drift */
    const onPlay = (): void => setPlaying(true);
    const onPause = (): void => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    const click = new Audio(CLICK_SFX);
    click.preload = "auto";
    click.volume = 0.35;
    clickRef.current = click;

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
      click.pause();
      clickRef.current = null;
    };
  }, []);

  const playClick = (): void => {
    const el = clickRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => undefined);
  };

  const togglePlay = (): void => {
    playClick();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  };

  const restart = (): void => {
    playClick();
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setAudioTime(0);
  };

  const toggleMute = (): void => {
    playClick();
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  /* ---- Progress slider: pointer drag (mouse + touch) and keyboard ---- */

  const timeFromClientX = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const { left, width } = track.getBoundingClientRect();
    if (width <= 0) return 0;
    return clamp((clientX - left) / width, 0, 1) * total;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault(); // no text selection or scroll while scrubbing
    const el = event.currentTarget;
    el.focus({ preventScroll: true });
    try {
      el.setPointerCapture(event.pointerId);
    } catch {
      /* noop */
    }
    const next = timeFromClientX(event.clientX);
    dragRef.current = next;
    setScrub(next);
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragRef.current === null) return;
    const next = timeFromClientX(event.clientX);
    dragRef.current = next;
    setScrub(next);
  };

  /* Commit once, on release: live-seeking on every move thrashes the decoder. */
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const pending = dragRef.current;
    if (pending === null) return;
    dragRef.current = null;
    setDragging(false);
    const el = event.currentTarget;
    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = clamp(pending, 0, total);
    setAudioTime(audio.currentTime);
  };

  const seekBy = (next: number): void => {
    const t = clamp(next, 0, total);
    if (audioRef.current) audioRef.current.currentTime = t;
    setAudioTime(t);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = time + 5;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = time - 5;
        break;
      case "PageUp":
        next = total;
        break;
      case "PageDown":
        next = 0;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = total;
        break;
      default:
        return;
    }
    event.preventDefault();
    seekBy(next);
  };

  return (
    <div
      className={cn("mp-root relative", className)}
      style={THEME}
      role="group"
      aria-label="Media player"
    >
      {/* Static stylesheet constant; no user input reaches it. */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 2 · Raised shell */}
      <div className="mp-shell relative flex h-full items-center rounded-full">
        {/* 3 · Album well -> chrome bezel -> art */}
        <div className="mp-album rounded-full">
          <div className="mp-bezel h-full w-full rounded-full">
            <div
              className="mp-art relative h-full w-full overflow-hidden rounded-full"
              role="img"
              aria-label={`Album art for ${title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="mp-art-media absolute inset-0 block h-full w-full object-cover"
                src={albumArt}
                alt=""
                draggable={false}
              />
              <span className="mp-glass pointer-events-none absolute inset-0 rounded-full" />
            </div>
          </div>
        </div>

        {/* Info + transport */}
        <div className="mp-info flex flex-col self-stretch">
          <p className="mp-title truncate font-bold">{title}</p>
          <p className="mp-artist truncate">{artist}</p>

          {/* 3 · Inset track -> 4 · raised thumb */}
          <div
            className={`mp-slider relative${dragging ? " is-dragging" : ""}`}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${formatTime(time)} of ${formatTime(total)}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={handleKeyDown}
          >
            <div ref={trackRef} className="mp-track absolute inset-x-0 overflow-hidden rounded-full">
              <div className="mp-fill h-full rounded-full" style={{ width: percent }} />
            </div>
            <div className="mp-thumb pointer-events-none absolute rounded-full" style={{ left: percent }} />
          </div>

          <div className="mp-times flex justify-between tabular-nums">
            <span>{formatTime(time)}</span>
            <span>{formatTime(total)}</span>
          </div>

          {/* 3 · One inset slot per button -> 4 · popping cap -> 5 · icon */}
          <div className="mp-controls flex items-center justify-center">
            <div className="mp-slot mp-slot--sm flex items-center justify-center rounded-full">
              <button
                type="button"
                className="mp-btn relative grid place-items-center rounded-full"
                aria-label="Restart track"
                onClick={restart}
              >
                <PrevIcon />
              </button>
            </div>
            <div className="mp-slot mp-slot--play flex items-center justify-center rounded-full">
              <button
                type="button"
                className="mp-btn mp-btn--play relative grid place-items-center rounded-full"
                aria-label={playing ? "Pause" : "Play"}
                data-playing={playing}
                onClick={togglePlay}
              >
                <PlayPauseIcon />
              </button>
            </div>
            <div className="mp-slot mp-slot--sm flex items-center justify-center rounded-full">
              <button
                type="button"
                className="mp-btn relative grid place-items-center rounded-full"
                aria-label={muted ? "Unmute" : "Mute"}
                data-muted={muted}
                onClick={toggleMute}
              >
                <VolumeIcon />
              </button>
            </div>
          </div>
        </div>

        {/* 3 · Speaker well -> 4 · embossed rim -> 3 · inset face -> 5 · perforations */}
        <div className="mp-speaker ml-auto rounded-full" aria-hidden="true">
          <div className="mp-speaker-rim h-full w-full rounded-full">
            <div className="mp-speaker-face relative h-full w-full rounded-full">
              {SPEAKER_HOLES.map((hole, index) => (
                <span
                  key={index}
                  className="mp-hole absolute rounded-full"
                  style={{ left: FACE_RADIUS + hole.x, top: FACE_RADIUS + hole.y }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   8. BluePlayer2: the player scaled to fit the about column
   ========================================================================== */

export default function BluePlayer2({ className }: { className?: string }) {
  const fitRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(fitRef, PLAYER.width, PLAYER_FIT);

  return (
    /* the bio's "blue" link points here, so the anchor lives on the wrapper */
    <div
      id="blue-player"
      ref={fitRef}
      className={cn("w-full scroll-mt-24", className)}
    >
      <div
        className="mx-auto"
        style={{ width: PLAYER.width * scale, height: PLAYER.height * scale }}
      >
        <div
          style={{
            width: PLAYER.width,
            height: PLAYER.height,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <SkeuoMediaPlayer />
        </div>
      </div>
    </div>
  );
}
