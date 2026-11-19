import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/fade-in";
import WorkImage from "@/components/work-image";
import OriginTag from "@/components/origin-tag";
import AfterLoad from "@/components/after-load";
import { isTodo, type Origin, type Todo } from "@/content/work";
import type { ImageKey } from "@/content/images.generated";
import { placeholderOf } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the long-form case studies (NOVA, Fintech home).
 *
 * The template case studies label their sections ("Overview"). These
 * pages argue, so a heading is a claim and is set like one: numbered in
 * the left columns, the claim at reading size, body text from column 4.
 * All Server Components: nothing here needs the client.
 */

/* ---- types ------------------------------------------------------------ */

export interface SectionRef {
  id: string;
  /** what the jump list shows: short */
  nav: string;
  /** what the page shows: a claim, never a label */
  heading: string;
}

/** A decision story: an optional claim, the argument, and its cost. */
export interface StoryData {
  title?: string;
  body: string[];
  /** the trade-off, set in italics and in its own voice */
  gave?: string;
}

/* ---- text ------------------------------------------------------------- */

/** Reading text. neutral-600, not the template's neutral-400: these are
    ten-minute reads, and 400 on paper is about 3:1. */
export function P({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-500 md:text-[18px]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** The trade-off, in its own voice: a margin note, not part of the argument. */
export function Gave({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-[65ch] border-l-2 border-neutral-900/10 pl-4 text-[16px] leading-normal text-pretty text-neutral-500 italic md:text-[18px]">
      {children}
    </p>
  );
}

export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <figcaption
      className={cn(
        "mt-3 max-w-[65ch] text-[14px] leading-normal text-pretty text-neutral-500 md:text-[16px]",
        className,
      )}
    >
      {children}
    </figcaption>
  );
}

export function Paras({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((para) => (
        <P key={para.slice(0, 48)}>{para}</P>
      ))}
    </div>
  );
}

export function Story({ d }: { d: StoryData }) {
  return (
    <div>
      {d.title ? (
        <h3 className="mb-2 max-w-[65ch] text-[16px] leading-normal font-medium text-balance text-neutral-900 md:text-[18px]">
          {d.title}
        </h3>
      ) : null}
      <Paras items={d.body} />
      {d.gave ? <Gave>{d.gave}</Gave> : null}
    </div>
  );
}

export function Stories({ items }: { items: StoryData[] }) {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      {items.map((d, i) => (
        <Story key={d.title ?? i} d={d} />
      ))}
    </div>
  );
}

/** A dashed amber marker in development, gone from production builds. */
export function Pending({ value }: { value: Todo | string }) {
  if (!isTodo(value) || process.env.NODE_ENV === "production") return null;
  return <span className="todo">TODO: {value.todo}</span>;
}

/* ---- structure --------------------------------------------------------- */

export function Section({
  id,
  n,
  heading,
  children,
  wide,
}: {
  id: string;
  n: number;
  heading: string;
  children: ReactNode;
  /** full-width content after the text (filmstrips, frames) */
  wide?: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-h`} className="mt-20 scroll-mt-28 md:mt-28" id={id}>
      <h2
        id={`${id}-h`}
        className="flex max-w-[65ch] items-baseline gap-3 text-[16px] leading-snug font-medium text-neutral-900 md:text-[18px]"
      >
        <span aria-hidden className="font-mono text-[13px] font-normal text-neutral-500 tabular-nums">
          {String(n).padStart(2, "0")}
        </span>
        <span className="text-balance">{heading}</span>
      </h2>
      <div className="mt-4 md:mt-5">{children}</div>
      {wide ? <div className="mt-8">{wide}</div> : null}
    </section>
  );
}

/** Back link, kind and the claim-shaped title. */
export function CaseHeader({ kind, title }: { kind: string; title: string }) {
  return (
    <header>
      <FadeIn>
        <Link
          href="/#work"
          className="inline-flex items-center gap-1.5 rounded-md font-mono text-[13px] tracking-wide text-neutral-500 uppercase transition-colors duration-150 ease-out hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 8H3M7 4 3 8l4 4" />
          </svg>
          All work
        </Link>
      </FadeIn>
      <FadeIn delay={0.05} className="mt-8 md:mt-10">
        <p className="text-[15px] text-neutral-500">{kind}</p>
        <h1 className="mt-3 text-[1.875rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance text-neutral-900 sm:text-[2.5rem] wd:text-[3.25rem]">
          {title}
        </h1>
      </FadeIn>
    </header>
  );
}

/** The LCP image: eager, preloaded, with the shared entrance. */
export function Hero({ image, alt }: { image: ImageKey; alt: string }) {
  return (
    <div className="enter-media mt-10 md:mt-14" style={{ "--enter-delay": "90ms" } as CSSProperties}>
      <WorkImage image={image} alt={alt} sizes="full" priority />
    </div>
  );
}

export function Lede({ children, origin }: { children: ReactNode; origin: Origin }) {
  return (
    <div className="mt-6 flex items-start justify-between gap-6 md:mt-8">
      <p className="max-w-[60ch] flex-1 text-[18px] leading-normal text-pretty text-neutral-500 md:text-[20px]">
        {children}
      </p>
      <OriginTag origin={origin} size="md" className="mt-[3px] shrink-0" />
    </div>
  );
}

/** Role and scope: a few short fields, no tool lists, no durations.
    A `todo()` value drops its whole field from production builds. */
export function MetaList({ items }: { items: [string, string | Todo][] }) {
  const shown = items.filter(
    ([, v]) => !(isTodo(v) && process.env.NODE_ENV === "production"),
  );
  return (
    <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-neutral-900/10 pt-6 sm:grid-cols-3 wd:grid-cols-5">
      {shown.map(([label, value]) => (
        <div key={label}>
          <dt className="font-mono text-[13px] tracking-wide text-neutral-500 uppercase">{label}</dt>
          <dd className="mt-1 text-[16px] leading-snug text-pretty text-neutral-900 md:text-[18px]">
            {isTodo(value) ? <Pending value={value} /> : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The 30-second read: every heading, as links. */
export function JumpList({ sections }: { sections: SectionRef[] }) {
  return (
    <nav aria-label="Sections" className="mt-10 border-t border-neutral-900/10 pt-6">
      <h2 className="font-mono text-[13px] tracking-wide text-neutral-500 uppercase">On this page</h2>
      <ol className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
        {sections.map((section, i) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex items-baseline gap-1.5 rounded-lg border border-neutral-900/10 bg-white px-2.5 py-1 text-[14px] text-neutral-600 transition-colors duration-150 ease-out [corner-shape:squircle] hover:border-neutral-900/25 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <span className="font-mono text-[11px] text-neutral-500 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.nav}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** One sentence that stands alone as the principle of the project. */
export function ClosingLine({ children }: { children: ReactNode }) {
  return (
    <section aria-label="In closing" className="mt-20 md:mt-28">
      <p className="max-w-[65ch] text-[16px] leading-normal font-medium text-balance text-neutral-900 md:text-[18px]">
        {children}
      </p>
    </section>
  );
}

/** Small print at the foot of the article: provenance and honesty notes. */
export function PageNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-16 border-t border-dashed border-neutral-900/15 pt-5 text-[14px] leading-normal text-pretty text-neutral-500 md:mt-20">
      {children}
    </p>
  );
}

/* ---- figures ------------------------------------------------------------ */

/** Full-width crop on a coloured ground, with its one-line caption. */
export function Shot({
  image,
  alt,
  caption,
  ground = "#4a4a4a",
}: {
  image: ImageKey;
  alt: string;
  caption: string;
  ground?: string;
}) {
  return (
    <figure className="mt-8">
      <div className="px-4 py-8 sm:px-8 sm:py-10" style={{ backgroundColor: ground }}>
        <AfterLoad {...placeholderOf(image)}>
          <WorkImage image={image} alt={alt} sizes="stage" />
        </AfterLoad>
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
}
