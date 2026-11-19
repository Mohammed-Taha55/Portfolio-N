import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { FadeIn } from "@/components/fade-in";
import WorkImage from "@/components/work-image";
import OriginTag from "@/components/origin-tag";
import Compare from "@/components/case/compare";
// import Fact from "@/components/case/fact";
import CaseNav from "@/components/case/case-nav";
import {
  KIND_LABEL,
  ORIGIN_LABEL,
  WORK,
  getCase,
  neighbours,
  type CaseStudy,
  type Decision,
} from "@/content/work";
import { JsonLd, PERSON_ID } from "@/lib/json-ld";
import { asset, placeholderOf, slotFor } from "@/lib/images";
import AfterLoad from "@/components/after-load";
import { pageMeta, SITE_NAME, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

/* Seven known pages, all prerendered to static HTML at build time:
   fully crawlable, and Next prefetches static routes in full. */
export const dynamicParams = false;

export function generateStaticParams() {
  // Case studies with `custom` own their route (e.g. /work/nova), so
  // they must not also be generated here.
  return WORK.filter((c) => !c.custom).map((c) => ({ slug: c.slug }));
}

const describe = (c: CaseStudy) =>
  `${c.name} · ${KIND_LABEL[c.kind].toLowerCase()} ${ORIGIN_LABEL[c.origin].toLowerCase()}`;

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) return {};
  return pageMeta(
    describe(c),
    c.summary,
    `/work/${c.slug}`,
    `${c.name}: ${KIND_LABEL[c.kind].toLowerCase()} ${ORIGIN_LABEL[c.origin].toLowerCase()} · ${SITE_NAME}`,
    {
      url: `/img/${c.slug}/share.jpg`,
      width: 1200,
      height: 630,
      alt: c.poster.alt,
    },
    "article",
  );
}

/* ---- layout primitives ---------------------------------------------
   One 12-column grid. Three vertical edges carry everything:
   col 1 (labels, titles), col 5 (reading text, ~65ch) and col 9 (facts). */

function Section({
  id,
  title,
  split = false,
  children,
}: {
  id: string;
  title: string;
  /** label in the left columns, content from column 5 */
  split?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-24 md:mt-36">
      <div className={cn(split && "md:grid md:grid-cols-12 md:gap-x-8")}>
        <h2
          id={id}
          className="font-mono text-[13px] font-normal tracking-wide text-neutral-500 uppercase md:col-span-4 md:text-[14px]"
        >
          {title}
        </h2>
        <div className={cn("mt-6", split ? "md:col-span-7 md:col-start-5 md:mt-0" : "md:mt-8")}>
          {children}
        </div>
      </div>
    </section>
  );
}

function Figure({ shot, index, n }: { shot: Decision; index: number; n: number }) {
  const num = String(index + 1).padStart(2, "0");
  const slot = slotFor(shot);
  return (
    <figure>
      {slot === "stage" ? (
        // zoomed crop: full-width grey band, the crop spans it edge to
        // edge inside an even inset. Hairline border, no shadow.
        <div className="bg-neutral-900/[0.035] p-4 sm:p-8 md:p-12">
          <AfterLoad {...placeholderOf(shot.image)}>
            <WorkImage image={shot.image} alt={shot.alt} sizes="stage" />
          </AfterLoad>
        </div>
      ) : (
        <AfterLoad {...placeholderOf(shot.image)}>
          <WorkImage image={shot.image} alt={shot.alt} sizes="full" />
        </AfterLoad>
      )}
      <figcaption className="mt-10 wd:mt-14 wd:grid wd:grid-cols-12 wd:gap-x-8">
        <h3 className="flex items-baseline gap-3 text-[17px] leading-snug font-normal tracking-[-0.01em] text-neutral-900 md:text-[19px] wd:col-span-4">
          <span className="font-mono text-[13px] font-normal text-neutral-500 tabular-nums">
            {num}/{String(n).padStart(2, "0")}
          </span>
          <span className="text-balance">{shot.title}</span>
        </h3>
        <p className="mt-2 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-400 md:text-[18px] wd:col-span-7 wd:col-start-5 wd:mt-0">
          {shot.body}
        </p>
      </figcaption>
    </figure>
  );
}

const box = (key: Decision["image"]) => {
  const a = asset(key);
  return { ratio: a.width / a.height, color: a.color };
};

/* ---- page ------------------------------------------------------------ */

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) notFound();
  const { prev, next, index, total } = neighbours(c.slug);
  const url = `${SITE_URL}/work/${c.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${url}#work`,
      name: c.title,
      headline: c.title,
      abstract: c.summary,
      url,
      image: `${SITE_URL}/img/${c.slug}/share.jpg`,
      genre: KIND_LABEL[c.kind],
      keywords: [KIND_LABEL[c.kind], ORIGIN_LABEL[c.origin], "UX design", "UI design", "case study"],
      about: { "@type": "Thing", name: c.name },
      creator: { "@id": PERSON_ID },
      author: { "@id": PERSON_ID },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Work", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: c.name, item: url },
      ],
    },
  ];

  return (
    <PageShell active="home">
      <JsonLd data={jsonLd} />
      <article className="pt-20 sm:pt-28">
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
            <p className="text-[15px] text-neutral-500">{KIND_LABEL[c.kind]}</p>
            {/* titles are written to fit one line on desktop, two on phones */}
            <h1 className="mt-3 text-[1.875rem] leading-[1.1] font-medium tracking-[-0.03em] text-balance text-neutral-900 sm:text-[2.5rem] wd:text-[3.25rem]">
              {c.title}
            </h1>
          </FadeIn>
        </header>

        <div className="enter-media mt-10 md:mt-14" style={{ "--enter-delay": "90ms" } as CSSProperties}>
          <WorkImage image={c.poster.image} alt={c.poster.alt} sizes="full" priority />
        </div>

        {/* Summary and origin sit on one row: text left, badge right,
            optically aligned to the first line. */}
        <div className="mt-6 flex items-start justify-between gap-6 md:mt-8">
          <p className="max-w-[60ch] flex-1 text-[18px] leading-normal text-pretty text-neutral-400 md:text-[20px]">
            {c.summary}
          </p>
          <OriginTag origin={c.origin} size="md" className="mt-[3px] shrink-0" />
          {/* Project facts hidden for now — re-enable when Role, Tools
              and Year are filled in.
          <dl className="mt-3 divide-y divide-neutral-900/[0.07] text-[14px]">
            <Fact label="Type" value={KIND_LABEL[c.kind]} />
            <Fact label="Role" value={c.facts.role} />
            <Fact label="Tools" value={c.facts.tools} />
            <Fact label="Year" value={c.facts.year} />
          </dl>
          */}
        </div>

        <Section id="overview" title="Overview" split>
          <dl className="flex flex-col gap-8">
            {c.context.map((item) => (
              <div key={item.label}>
                <dt className="text-[16px] text-neutral-900 md:text-[18px]">{item.label}</dt>
                <dd className="mt-1.5 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-400 md:text-[18px]">
                  {item.body}
                  {item.bullets ? (
                    <ul className="mt-3 flex flex-col gap-2">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex gap-3">
                          <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-neutral-400" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {c.problems ? (
          <Section id="problems" title="What wasn’t working">
            <ol className="grid gap-x-8 gap-y-8 md:grid-cols-2 md:gap-y-10">
              {c.problems.map((p, i) => (
                <li key={p.title} className="flex gap-4">
                  <span className="font-mono text-[13px] leading-6 text-neutral-500 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[16px] leading-6 font-normal text-neutral-900 md:text-[18px]">{p.title}</h3>
                    <p className="mt-1 max-w-[52ch] text-[15px] leading-normal text-pretty text-neutral-400 md:text-[18px]">
                      {p.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        {c.compare ? (
          <section aria-label="Before and after comparison" className="mt-24 md:mt-36">
            <Compare
              beforeBox={box(c.compare.before.image)}
              afterBox={box(c.compare.after.image)}
              before={<WorkImage image={c.compare.before.image} alt={c.compare.before.alt} sizes="half" />}
              after={<WorkImage image={c.compare.after.image} alt={c.compare.after.alt} sizes="half" />}
            />
          </section>
        ) : null}

        <Section id="decisions" title={c.kind === "landing" ? "Key decisions" : "Close-ups"}>
          <div className="flex flex-col gap-20 wd:gap-28">
            {c.decisions.map((d, i) => (
              <Figure key={d.image} shot={d} index={i} n={c.decisions.length} />
            ))}
          </div>
        </Section>

        <Section id="next" title="What I’d test next" split>
          <ol className="flex flex-col gap-4">
            {c.next.map((item, i) => (
              <li key={item} className="flex gap-4 text-[16px] leading-normal text-pretty text-neutral-400 md:text-[18px]">
                <span className="font-mono text-[13px] leading-6 text-neutral-500 tabular-nums md:leading-7">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="max-w-[60ch]">{item}</span>
              </li>
            ))}
          </ol>
        </Section>
      </article>

      <CaseNav prev={prev} next={next} index={index} total={total} />
    </PageShell>
  );
}
