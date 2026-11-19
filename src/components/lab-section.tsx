"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FadeIn } from "./fade-in";
import { LAB_ENTRIES } from "./lab-entries";

/**
 * /lab showcase - Rachel-style 2-column card grid at/above 1200px,
 * single column below. Each card links to its /lab/[slug] detail
 * page where the live component runs full-size.
 */

export function LabHeading() {
  return (
    <FadeIn className="grid grid-cols-1 gap-12 pb-8 lg:grid-cols-2 lg:gap-6">
      <h1 className="max-w-[700px] text-neutral-900">
        Small pieces, <span className="italic">engineered</span> properly.
      </h1>
      <div className="flex w-full flex-col justify-end">
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-500">
          Every demo is live. Real state, real interaction, no mocks. Go
          ahead, poke them.
        </p>
      </div>
    </FadeIn>
  );
}

/* The shipped pieces, in showcase order. Add a slug here and its card
   appears - the layout doesn't care how many there are. */
const FEATURED = [
  "siteforge-prompt",
  "flux-swap",
  // "voice-lounge",
  "skimmer-run",
  "delivery-tracking-table",
] as const;

/* Every featured entry ships a recorded /lab/<slug>.webm preview -
   live-canvas demos included. Cards go straight to the poster still
   only on a real load error (see Preview fallback). */

/* Poster-first preview: the 0.1s webp still shows instantly while the
   .webm streams in the background. The video element mounts hidden but
   rendered (never display:none - that stalls preload) and only takes
   over + plays once it can play through without stalling. Falls back to
   the still, then to a quiet placeholder - the card can never render
   broken. Fallback happens ONLY on a real load error, never on a timer,
   so a slow-but-healthy video is left alone to buffer & play. */
function Preview({ slug, name }: { slug: string; name: string }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Fast networks finish buffering before hydration attaches
     onCanPlayThrough - catch that case on mount. */
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 4) {
      setReady(true);
      v.play().catch(() => undefined);
    }
  }, []);

  if (failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-neutral-100">
        <span className="font-mono text-[13px] tracking-wide text-neutral-400">
          {name}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* still: visible until the video is ready, then unmounted */}
      {!ready && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/lab/${slug}.webp`}
          alt={`${name} preview`}
          loading="eager"
          decoding="async"
          draggable={false}
          className="aspect-video w-full object-cover"
        />
      )}
      <video
        ref={videoRef}
        poster={`/lab/${slug}.webp`}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        onCanPlayThrough={() => {
          setReady(true);
          videoRef.current?.play().catch(() => undefined);
        }}
        onError={() => setFailed(true)}
        className={cn(
          "w-full bg-neutral-100 object-cover",
          ready ? "aspect-video" : "invisible absolute inset-0 aspect-video",
        )}
      >
        <source
          src={`/lab/${slug}.webm`}
          type='video/webm; codecs="vp9"'
          onError={() => setFailed(true)}
        />
      </video>
    </>
  );
}

export default function LabSection({ className }: { className?: string }) {
  const entries = FEATURED.map(
    (slug) => LAB_ENTRIES.find((e) => e.slug === slug)!,
  ).filter(Boolean);
  const left = entries.filter((_, i) => i % 2 === 0);
  const right = entries.filter((_, i) => i % 2 === 1);

  const column = (items: typeof entries) => (
    <div className="flex flex-col gap-8">
      {items.map(({ slug, name, meta }) => (
        <FadeIn key={slug}>
          <Link href={`/lab/${slug}`} className="group block">
            <div className="flex flex-col gap-2">
              <div className="relative overflow-hidden rounded-xl border border-neutral-900/10 bg-white">
                <Preview slug={slug} name={name} />
                <div className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-300 ease-in-out group-hover:bg-white/20" />
              </div>
              <div className="flex items-center gap-1.5 text-[14px]">
                <p className="min-w-0 truncate font-sans font-medium text-neutral-900">
                  {name}
                </p>
                <span aria-hidden className="shrink-0 text-neutral-300">
                  /
                </span>
                <p className="shrink-0 font-sans text-neutral-500">{meta}</p>
              </div>
            </div>
          </Link>
        </FadeIn>
      ))}
    </div>
  );

  return (
    <section className={cn(className)}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 wd:grid-cols-2">
        {column(left)}
        {column(right)}
      </div>
    </section>
  );
}
