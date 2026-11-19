"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type { Social } from "@/constants/socials";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { whenIdle } from "@/lib/warm";
import type { CardTarget, Placement } from "./social-card";

/* The animated card (and Motion with it) is a separate chunk: fetched in
   idle time after `load`, or on the first pointer/focus on the badges,
   whichever comes first. It is never on the critical path. */
const loadCard = () => import("./social-card");
const SocialCard = dynamic(loadCard, { ssr: false });

/* ---- timing ---------------------------------------------------------- */
const SHOW_DELAY = 90; // hover intent before the FIRST open only
const HIDE_GRACE = 120; // leave the group, come back within this: no close

/* ---- geometry -------------------------------------------------------- */
const CARD_W = 248;
const EDGE = 12; // keep this far from the viewport sides

interface Api {
  enter: (social: Social, el: HTMLElement, via: "pointer" | "focus") => void;
  leaveGroup: () => void;
  enterGroup: () => void;
  closeNow: () => void;
}

const Ctx = createContext<Api | null>(null);

/**
 * One hover card for the whole badge row.
 *
 * - The card lives inside the group (absolutely positioned), not in a
 *   portal: it scrolls with the page for free and needs no listeners.
 * - Hover is tracked on the GROUP, whose box includes the gaps between
 *   icons. Crossing a gap never fires a leave, so there is nothing to
 *   flicker - that box is the hover bridge. Leaving the group starts a
 *   120ms grace before closing.
 * - Only the first open waits for intent and plays the entrance. While
 *   open, moving to another icon springs the same element there.
 * - Keyboard focus opens instantly with no animation (keyboard actions
 *   are never animated); Escape dismisses; touch never sees the card.
 */
export function SocialTooltipLayer({
  socials,
  children,
}: {
  socials: Social[];
  children: ReactNode;
}) {
  const reduce = usePrefersReducedMotion();
  const groupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Social>(socials[0]);
  const [placement, setPlacement] = useState<Placement>("top");
  const [origin, setOrigin] = useState(CARD_W / 2);
  const [instant, setInstant] = useState(false);
  const [target, setTarget] = useState<CardTarget>({ x: 0, glide: false, seq: 0 });

  const openRef = useRef(false);
  const xRef = useRef(0);
  /** true from open until the exit animation has fully finished */
  const visibleRef = useRef(false);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const clear = (t: React.RefObject<number | null>) => {
    if (t.current !== null) {
      window.clearTimeout(t.current);
      t.current = null;
    }
  };

  // warm the card chunk once the page has finished loading
  useEffect(() => {
    let cancel: (() => void) | undefined;
    const go = () => {
      cancel = whenIdle(() => void loadCard());
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      cancel?.();
      window.removeEventListener("load", go);
    };
  }, []);

  /** Card x (relative to the group) that centres it on `el`, clamped. */
  const measure = useCallback((el: HTMLElement) => {
    const group = groupRef.current;
    if (!group) return null;
    const g = group.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const centre = r.left + r.width / 2;
    const maxLeft = window.innerWidth - EDGE - CARD_W;
    const left = Math.min(Math.max(centre - CARD_W / 2, EDGE), Math.max(EDGE, maxLeft));
    return {
      x: Math.round(left - g.left),
      origin: Math.round(centre - left),
      placement: (g.top > 190 ? "top" : "bottom") as Placement,
    };
  }, []);

  const show = useCallback(
    (social: Social, el: HTMLElement, via: "pointer" | "focus") => {
      const m = measure(el);
      if (!m) return;
      setActive(social);
      const alreadyUp = visibleRef.current && openRef.current;
      // Edge-clamped neighbours share a position: don't restart a spring
      // for a rounding difference.
      if (alreadyUp && Math.abs(xRef.current - m.x) < 1) return;
      xRef.current = m.x;
      // glide while the card is (still) on screen; jump when it appears
      // fresh or when the keyboard moved it
      const glide = visibleRef.current && via === "pointer";
      setTarget((t) => ({ x: m.x, glide, seq: t.seq + 1 }));
      if (alreadyUp) return;
      setOrigin(m.origin);
      setPlacement(m.placement);
      setInstant(via === "focus");
      openRef.current = true;
      visibleRef.current = true;
      setOpen(true);
    },
    [measure],
  );

  const api = useMemo<Api>(
    () => ({
      enter(social, el, via) {
        clear(hideTimer);
        if (openRef.current || via === "focus") {
          clear(showTimer);
          show(social, el, via);
          return;
        }
        clear(showTimer);
        showTimer.current = window.setTimeout(() => show(social, el, via), SHOW_DELAY);
      },
      enterGroup() {
        clear(hideTimer);
        void loadCard();
      },
      leaveGroup() {
        clear(showTimer);
        clear(hideTimer);
        if (!openRef.current) return;
        hideTimer.current = window.setTimeout(() => {
          openRef.current = false;
          setOpen(false);
        }, HIDE_GRACE);
      },
      closeNow() {
        clear(showTimer);
        clear(hideTimer);
        openRef.current = false;
        setOpen(false);
      },
    }),
    [show],
  );

  // Escape dismisses without moving focus (WCAG 1.4.13)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") api.closeNow();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, api]);

  useEffect(
    () => () => {
      clear(showTimer);
      clear(hideTimer);
    },
    [],
  );

  return (
    <Ctx.Provider value={api}>
      <div
        ref={groupRef}
        /* z-30 so the card clears anything beside it in the same
           stacking context; the page that uses the badges is
           responsible for lifting the whole block above later
           sections (see app/page.tsx). */
        className="relative z-30 inline-flex"
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") api.enterGroup();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") api.leaveGroup();
        }}
        onFocus={() => void loadCard()}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) api.closeNow();
        }}
      >
        {children}
        <SocialCard
          socials={socials}
          active={active}
          open={open}
          target={target}
          placement={placement}
          origin={origin}
          instant={instant}
          reduce={reduce}
          onExitComplete={() => {
            visibleRef.current = false;
          }}
        />
      </div>
    </Ctx.Provider>
  );
}

/* ---- trigger --------------------------------------------------------- */

const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Wraps one badge. Reports pointer / keyboard intent to the group. */
export default function SocialTooltip({
  social,
  children,
}: {
  social: Social;
  children: ReactNode;
}) {
  const api = useContext(Ctx);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="inline-flex"
      onPointerEnter={(e) => {
        if (e.pointerType === "touch" || !canHover() || !ref.current) return;
        api?.enter(social, ref.current, "pointer");
      }}
      onPointerDown={(e) => {
        // a click opens the profile: get the card out of the way
        if (e.pointerType !== "touch") api?.closeNow();
      }}
      onFocus={(e) => {
        if (!ref.current || !(e.target as Element).matches(":focus-visible")) return;
        api?.enter(social, ref.current, "focus");
      }}
    >
      {children}
    </span>
  );
}
