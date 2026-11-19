import { ORIGIN_LABEL, type Origin } from "@/content/work";
import { cn } from "@/lib/utils";

/**
 * Where the work came from. Green marks my own concept, neutral marks a
 * redesign of someone else's live product, violet marks a real client
 * brief. None of them borrow the site's blue, which belongs to the Book
 * a call CTA. All three pass 4.5:1 at 12px.
 */
const TONE: Record<Origin, string> = {
  original: "bg-emerald-500/12 text-emerald-800",
  redesign: "bg-neutral-900/[0.06] text-neutral-600",
  client: "bg-violet-500/12 text-violet-800",
};
export default function OriginTag({
  origin,
  size = "sm",
  className,
}: {
  origin: Origin;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md font-medium whitespace-nowrap [corner-shape:squircle]",
        size === "sm" ? "h-6 px-2 text-[12px]" : "h-7 px-2.5 text-[13px]",
        TONE[origin],
        className,
      )}
    >
      {ORIGIN_LABEL[origin]}
    </span>
  );
}
