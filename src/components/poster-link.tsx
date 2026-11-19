"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WarmTarget } from "@/lib/image-urls";
import { canSpeculate, isWarm, timeout, warm, warmSequence, whenIdle } from "@/lib/warm";

/** Longest we will ever hold a click while the hero finishes decoding. */
const CLICK_BUDGET_MS = 300;

/**
 * Homepage poster link. The markup inside is server-rendered; this only
 * adds the loading strategy for the case study behind it:
 *
 *  1. visible  -> Next prefetches the route (RSC + JS) on its own;
 *                 we warm the case-study hero at low priority.
 *  2. idle     -> same as visible, for posters still below the fold.
 *  3. intent   -> hover / focus / touch: hero at high priority, then the
 *                 rest of the page's images one by one at low priority.
 *  4. click    -> if the hero hasn't decoded yet, hold the navigation up
 *                 to 300ms for it, then go regardless. Modified clicks
 *                 (new tab etc.) never reach onNavigate.
 */
export default function PosterLink({
  href,
  label,
  hero,
  rest,
  className,
  style,
  children,
}: {
  href: string;
  /** only when the visible content can't name the link itself */
  label?: string;
  hero: WarmTarget;
  rest: WarmTarget[];
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);
  const restStarted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canSpeculate()) return;

    let cancelIdle: (() => void) | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          warm(hero, "low");
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    // Wait for the homepage's own images first, then use idle time.
    const onLoad = () => {
      cancelIdle = whenIdle(() => warm(hero, "low"));
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    io.observe(el);
    return () => {
      io.disconnect();
      cancelIdle?.();
      window.removeEventListener("load", onLoad);
    };
  }, [hero]);

  const intent = () => {
    router.prefetch(href);
    const h = warm(hero, "high");
    if (!restStarted.current) {
      restStarted.current = true;
      void h.ready.then(() => warmSequence(rest));
    }
  };

  return (
    <Link
      ref={ref}
      href={href}
      aria-label={label}
      className={className}
      style={style}
      onPointerEnter={intent}
      onFocus={intent}
      onTouchStart={intent}
      onNavigate={(e) => {
        if (isWarm(hero)) return;
        e.preventDefault();
        void Promise.race([warm(hero, "high").ready, timeout(CLICK_BUDGET_MS)]).then(() =>
          router.push(href),
        );
      }}
    >
      {children}
    </Link>
  );
}
