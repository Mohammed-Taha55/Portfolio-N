"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const smoothOK = () =>
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

function scrollToHash(hash: string) {
  const el = document.getElementById(hash);
  if (!el) return false;
  el.scrollIntoView({ behavior: smoothOK() ? "smooth" : "auto", block: "start" });
  return true;
}

/**
 * Owns all scrolling in JS so the CSS `scroll-behavior` can stay `auto`:
 * route changes then always snap instantly (no animated scroll-up), while
 * real anchor jumps (#work, #blue-player, /#work) still glide smoothly.
 *
 * Why not CSS `scroll-behavior: smooth`? The browser applies it to *every*
 * scroll - including the scroll-to-top Next performs on each navigation.
 * Snapping back afterwards from an effect is a race the effect can lose
 * (production commits instantly, so the glide plays visibly; dev is slow
 * enough to mask it). With smooth removed from CSS there is no race:
 * instant is the default, smooth only happens where this file does it.
 */
export default function RouteScroll() {
  const pathname = usePathname();
  const router = useRouter();

  // Anchor clicks: same-page hashes scroll in place; cross-page hashes
  // navigate without Next's scroll handling and let the pathname effect
  // below glide to the target after the commit.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement).closest?.("a[href]");
      if (!anchor) return;
      const raw = anchor.getAttribute("href");
      if (!raw) return;
      const url = new URL(raw, window.location.href);
      if (url.hash.length < 2 || url.origin !== window.location.origin) return;
      const hash = decodeURIComponent(url.hash.slice(1));
      e.preventDefault();
      if (url.pathname === window.location.pathname) {
        if (scrollToHash(hash)) history.pushState(null, "", `#${hash}`);
      } else {
        router.push(`${url.pathname}${url.search}#${hash}`, { scroll: false });
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // Route changes: no hash -> already at top (nothing animates there);
  // hash -> glide to it after paint (covers /#work and direct hash loads).
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.length < 2) {
      window.scrollTo(0, 0);
      return;
    }
    const id = requestAnimationFrame(() =>
      scrollToHash(decodeURIComponent(hash.slice(1))),
    );
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
