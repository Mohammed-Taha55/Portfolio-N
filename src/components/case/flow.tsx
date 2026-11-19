import type { FlowStep } from "@/content/nova";
import { cn } from "@/lib/utils";

/**
 * The core loop, drawn in code rather than exported as an image: it is
 * six words and two marks, it has to reflow from one column on a phone
 * to one row on a laptop, and a screenshot of a diagram is the one
 * picture on a case study that can never be read at 360px.
 *
 * The two checkpoints are the whole point of the drawing, so they are
 * the only things with a fill, a ring and a label.
 */
export default function Flow({ steps }: { steps: FlowStep[] }) {
  return (
    <div>
      <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch md:gap-0">
        {steps.map((step, i) => (
          <li key={step.name} className="flex items-stretch gap-2 md:flex-1 md:gap-0">
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col justify-start rounded-xl border px-3 py-2.5 [corner-shape:squircle] md:px-2.5",
                step.checkpoint
                  ? "border-pink-300 bg-pink-50"
                  : "border-neutral-900/10 bg-white",
              )}
            >
              {step.checkpoint ? (
                <span className="font-mono text-[11px] tracking-wide text-pink-700 uppercase">
                  {step.checkpoint.label}
                </span>
              ) : (
                <span aria-hidden className="font-mono text-[11px] tracking-wide text-neutral-500 uppercase">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span
                className={cn(
                  "mt-1 text-[15px] leading-snug",
                  step.checkpoint ? "text-pink-900" : "text-neutral-900",
                )}
              >
                {step.name}
              </span>
              <span
                className={cn(
                  "mt-1 text-[13px] leading-snug text-pretty",
                  // neutral-500 is 4.34:1 on pink-50 and 4.74:1 on white
                  step.checkpoint ? "text-neutral-600" : "text-neutral-500",
                )}
              >
                {step.note}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span
                aria-hidden
                className="flex shrink-0 items-center justify-center self-center px-1 text-neutral-500 md:px-1.5"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="rotate-90 md:rotate-0"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <dl className="mt-8 grid gap-6 md:grid-cols-2 md:gap-8">
        {steps
          .filter((s) => s.checkpoint)
          .map((s) => (
            <div key={s.name} className="border-t border-neutral-900/10 pt-4">
              <dt className="flex items-baseline gap-2.5">
                <span className="font-mono text-[12px] tracking-wide text-pink-700 uppercase">
                  {s.checkpoint!.label}
                </span>
                <span className="text-[16px] text-neutral-900 md:text-[18px]">
                  {s.checkpoint!.asks}
                </span>
              </dt>
              <dd className="mt-1.5 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
                {s.checkpoint!.costs}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
