import StepperDemo from "./demos/stepper-demo";
import LikeButtonDemo from "./demos/like-demo";
import CopyEmailDemo from "./demos/copy-email-demo";
import RatingDemo from "./demos/rating-demo";
import SkimmerDemo from "./demos/skimmer-run-demo";
import DeliveryTrackingTableDemo from "./demos/delivery-tracking-table-demo";
import SiteforgePromptDemo from "./demos/siteforge-prompt-demo";
import SwapCardDemo from "./demos/swap-card-demo";
// import VoiceLoungeDemo from "./demos/voice-lounge-demo";

/**
 * Single source of truth for lab entries. The /lab grid and the
 * /lab/[slug] detail pages both render from here, so adding a demo
 * means adding one entry - card + route appear together.
 *
 * Recording guide for card preview videos: shoot 4:3 (e.g. 1200×900).
 * Cards render at aspect-[4/3] and `object-cover`, so 4:3 fills the
 * frame edge-to-edge with zero crop. 16:9 would letterbox or lose
 * the top/bottom of the interaction.
 */
export interface LabEntry {
  slug: string;
  name: string;
  meta: string;
  blurb: string;
  Demo: () => React.JSX.Element;
}

export const LAB_ENTRIES: LabEntry[] = [
  {
    slug: "delivery-tracking-table",
    name: "Delivery tracking table",
    meta: "CRM • Readability",
    blurb:
      "A delivery CRM table with a spotlight readout: hover any row and the rest fall back to quiet gray, so the eye rides one deal left-to-right without losing its place. Tabs, search, filters, sorting, pagination, all live.",
    Demo: DeliveryTrackingTableDemo,
  },
  {
    slug: "flux-swap",
    name: "Swap",
    meta: "Web3 • DeFi",
    blurb:
      "A minimal swap card: tabs, pay / receive, flip key, rate, one black action. Strong spring motion, nothing that doesn't matter.",
    Demo: SwapCardDemo,
  },
  {
    slug: "siteforge-prompt",
    name: "Siteforge prompt bar",
    meta: "AI • Input",
    blurb:
      "An AI website-builder prompt bar: attachment rail, model picker, and a blue send key with squircle corners and hairline borders throughout.",
    Demo: SiteforgePromptDemo,
  },
  {
    slug: "quantity-stepper",
    name: "Quantity stepper",
    meta: "State • Commerce",
    blurb: "Bounded 0–9 stepper with tabular numerals and instant feedback.",
    Demo: StepperDemo,
  },
  {
    slug: "like-toggle",
    name: "Like toggle",
    meta: "State • Social",
    blurb: "Optimistic like with a live count that ticks both ways.",
    Demo: LikeButtonDemo,
  },
  {
    slug: "copy-email",
    name: "Copy email",
    meta: "Clipboard • Utility",
    blurb: "One-click clipboard copy with a timed confirmation state.",
    Demo: CopyEmailDemo,
  },
  {
    slug: "star-rating",
    name: "Star rating",
    meta: "Input • Feedback",
    blurb: "Hover-preview rating input with a persistent selection.",
    Demo: RatingDemo,
  },
  // {
  //   slug: "voice-lounge",
  //   name: "Voice lounge",
  //   meta: "Motion • Social",
  //   blurb:
  //     "A Discord-style voice channel tile: hover or tap and the avatar stack breaks apart - each pfp rides a spring to its own row while speaker icons and names pop in staggered, settling small to full.",
  //   Demo: VoiceLoungeDemo,
  // },
  {
    slug: "skimmer-run",
    name: "Skimmer run",
    meta: "WebGL • SVG",
    blurb:
      'An original ground-effect skimmer, the SK-4 "Shearwater", as isometric line art floating over a line-drawn sea while a palm cay drifts past. Move to tilt, hold Space to boost. A seamless 16s loop.',
    Demo: SkimmerDemo,
  },
];
