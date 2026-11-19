"use client";

import { SOCIALS, type Social } from "@/constants/socials";
import { cn } from "@/lib/utils";
import SocialTooltip, { SocialTooltipLayer } from "./social-tooltip";

/* layered inner gloss only: top inner light + mirrored white inner
   fills for symmetric glossy depth. No outer drops - the badges sit
   flat and crisp. Static - no change on hover. */
const BADGE_GLOSS =
  "inset 0 1px 0 0 rgba(255,255,255,0.4), inset 4px 4px 4px 0 rgba(255,255,255,0.06), inset -4px 4px 4px 0 rgba(255,255,255,0.06), inset 6px 6px 6px 0 rgba(255,255,255,0.04), inset -6px 6px 6px 0 rgba(255,255,255,0.04), inset 8px 8px 8px 0 rgba(255,255,255,0.02), inset -8px 8px 8px 0 rgba(255,255,255,0.02)";

/**
 * Glossy brand badge - bright fill, 1px darker stroke, white glyph.
 * Full size at/above 1200px (`wd`), 75% below: box, glyph and corner
 * scale together (44/33px box, 20/15px glyph). Press scales to 0.96
 * over 150ms - a CSS transition, so it retargets if released early.
 */
function SocialBadge({ social }: { social: Social }) {
  const Icon = social.icon;
  return (
    <SocialTooltip social={social}>
      <a
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${social.platform}: ${social.profile.handle} (opens in a new tab)`}
        className="flex size-[33px] shrink-0 items-center justify-center rounded-[10px] text-white outline-none transition-[scale] duration-150 ease-out select-none [corner-shape:squircle] [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.96] wd:size-11 wd:rounded-[14px]"
        style={{
          backgroundColor: social.skin.bg,
          border: `1px solid ${social.skin.edge}`,
          boxShadow: BADGE_GLOSS,
        }}
      >
        <Icon className="size-[15px] shrink-0 wd:size-5" />
      </a>
    </SocialTooltip>
  );
}

export default function SocialBadges({ className }: { className?: string }) {
  return (
    <nav aria-label="Social links" className={cn("flex items-center", className)}>
      <SocialTooltipLayer socials={SOCIALS}>
        <ul className="flex items-center gap-3">
          {SOCIALS.map((social) => (
            <li key={social.label} className="flex">
              <SocialBadge social={social} />
            </li>
          ))}
        </ul>
      </SocialTooltipLayer>
    </nav>
  );
}
