import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Entrance for first paint: opacity + 12px rise + 4px blur, 300ms
 * ease-out (see `.enter` in globals.css).
 *
 * Pure CSS on purpose. The old Motion version server-rendered every
 * wrapped block at opacity 0 and only revealed it once JS hydrated, so
 * the headline and grid were invisible for the whole JS download. A CSS
 * animation starts on the very first frame, runs off the main thread,
 * and needs no client bundle - this file is a Server Component.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** seconds, kept from the old API */
  delay?: number;
  as?: "div" | "section" | "header" | "li" | "footer";
}) {
  return (
    <Tag
      className={cn("enter", className)}
      style={delay ? ({ "--enter-delay": `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
