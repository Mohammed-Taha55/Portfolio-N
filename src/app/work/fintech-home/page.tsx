import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import WorkImage from "@/components/work-image";
import AfterLoad from "@/components/after-load";
import CaseNav from "@/components/case/case-nav";
import Compare from "@/components/case/compare";
import Filmstrip from "@/components/case/filmstrip";
import Pair from "@/components/case/pair";
import {
  Caption,
  CaseHeader,
  ClosingLine,
  Hero,
  JumpList,
  Lede,
  MetaList,
  P,
  PageNote,
  Pending,
  Section,
  Stories,
  Story,
} from "@/components/case/longform";
import { KIND_LABEL, isTodo, neighbours } from "@/content/work";
import {
  BRIEF,
  CLOSING,
  COLOUR,
  COMPARE,
  COMPARE_INTRO,
  CRAFT,
  CURRENCIES,
  DATA,
  FH,
  FIRST_VERSION,
  FRAMES,
  GROUPING,
  HIERARCHY,
  IDEA,
  ITERATIONS_COUNT,
  ITERATIONS_INTRO,
  LEARNED,
  LEARNED_INTRO,
  LEARNED_SOURCES,
  MEASURES,
  MEASURE_INTRO,
  NORTH_STAR,
  NOTE,
  NOTES,
  ONE_BLACK,
  OPEN,
  OPEN_INTRO,
  PAIRS,
  REVIEW_INTRO,
  SECTIONS,
  START,
  TIMELINE,
} from "@/content/fintech-home";
import { JsonLd, PERSON_ID } from "@/lib/json-ld";
import { asset, placeholderOf } from "@/lib/images";
import { pageMeta, SITE_NAME, SITE_URL } from "@/lib/site";

const URL = `${SITE_URL}/work/${FH.slug}`;

export const metadata: Metadata = pageMeta(
  FH.name,
  "My first fintech brief: a money app's home screen rebuilt around one action, Add money. Version one, a reviewer's seven notes, and the final, in about two days.",
  `/work/${FH.slug}`,
  `A fintech home screen, designed around one action · ${SITE_NAME}`,
  {
    url: `/img/${FH.slug}/share.jpg`,
    width: 1200,
    height: 630,
    alt: FH.poster.alt,
  },
  "article",
);

const box = (key: (typeof COMPARE)["before"]["image"]) => {
  const a = asset(key);
  return { ratio: a.width / a.height, color: a.color };
};

/* Small labelled field used by the north star and each measure. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sm:grid sm:grid-cols-[6.5rem_1fr] sm:gap-4">
      <dt className="font-mono text-[12px] leading-6 tracking-wide text-neutral-500 uppercase">
        {label}
      </dt>
      <dd className="max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
        {children}
      </dd>
    </div>
  );
}

export default function FintechHomePage() {
  const { prev, next, index, total } = neighbours(FH.slug);
  const s = (id: string) => SECTIONS.find((x) => x.id === id)!;
  const n = (id: string) => SECTIONS.findIndex((x) => x.id === id) + 1;
  const sec = (id: string) => ({ id, n: n(id), heading: s(id).heading });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${URL}#work`,
      name: FH.title,
      headline: FH.title,
      abstract: FH.subtitle,
      url: URL,
      image: `${SITE_URL}/img/${FH.slug}/share.jpg`,
      genre: KIND_LABEL.app,
      keywords: ["Fintech", "iOS app", "Client brief", "UX design", "Case study"],
      about: { "@type": "Thing", name: "A fintech home screen" },
      creator: { "@id": PERSON_ID },
      author: { "@id": PERSON_ID },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Work", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: FH.name, item: URL },
      ],
    },
  ];

  return (
    <PageShell active="home">
      <JsonLd data={jsonLd} />
      <article className="pt-20 sm:pt-28">
        <CaseHeader kind={KIND_LABEL.app} title={FH.heading} />
        <Hero image={FH.poster.image} alt={FH.poster.alt} />
        <Lede origin="client">{FH.subtitle}</Lede>
        <MetaList items={FH.meta} />
        <JumpList sections={SECTIONS} />

        {/* 01 */}
        <Section {...sec("idea")}>
          <Stories items={[{ body: IDEA }]} />
        </Section>

        {/* 02 */}
        <Section {...sec("brief")}>
          <ol className="flex flex-col gap-6">
            {BRIEF.map((b, i) => (
              <li key={b.label} className="flex gap-3">
                <span className="font-mono text-[13px] leading-7 text-neutral-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[16px] leading-snug text-neutral-900 md:text-[18px]">{b.label}</h3>
                  <P className="mt-1">{b.body}</P>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* 03 */}
        <Section {...sec("start")}>
          {/* the two days, in order */}
          <ol aria-label="Timeline" className="mb-10 grid gap-4 border-y border-neutral-900/10 py-5 sm:grid-cols-3 sm:gap-6">
            {TIMELINE.map((t) => (
              <li key={t.what}>
                <p className="font-mono text-[12px] tracking-wide text-neutral-500 uppercase">
                  {isTodo(t.when) ? <Pending value={t.when} /> : t.when}
                </p>
                <p className="mt-1 text-[15px] leading-snug text-pretty text-neutral-900">{t.what}</p>
              </li>
            ))}
          </ol>
          <Stories items={START} />
          <figure className="mt-8">
            <AfterLoad {...placeholderOf(FIRST_VERSION.image)}>
              <WorkImage image={FIRST_VERSION.image} alt={FIRST_VERSION.alt} sizes="stage" />
            </AfterLoad>
            <Caption>{FIRST_VERSION.caption}</Caption>
          </figure>
        </Section>

        {/* 04 */}
        <Section {...sec("review")}>
          <P>{REVIEW_INTRO}</P>
          <ol className="mt-8 flex flex-col divide-y divide-neutral-900/10 border-y border-neutral-900/10">
            {NOTES.map((row, i) => (
              <li key={row.note} className="grid gap-x-6 gap-y-1.5 py-4 md:grid-cols-[2rem_1fr_1fr_7rem]">
                <span className="font-mono text-[13px] leading-6 text-neutral-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[16px] leading-normal text-pretty text-neutral-900 md:text-[18px]">
                  <span className="sr-only">Note: </span>
                  {row.note}
                </p>
                <p className="text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
                  <span className="font-mono text-[11px] tracking-wide text-neutral-500 uppercase md:sr-only">
                    Response:{" "}
                  </span>
                  {row.change}
                </p>
                <p className="font-mono text-[12px] leading-6 tracking-wide text-neutral-500 uppercase md:text-right">
                  {row.where}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* 05 */}
        <Section
          {...sec("iterations")}
          wide={
            <Filmstrip
              frames={FRAMES}
              label="Iterations, in order. Scroll sideways on small screens."
              caption="The six iterations that survive, in order. Each says what changed and why."
            />
          }
        >
          {ITERATIONS_INTRO.map((p) => (
            <P key={p}>{p}</P>
          ))}
          <p className="mt-3">
            <Pending value={ITERATIONS_COUNT} />
          </p>
        </Section>

        {/* 06 */}
        <Section {...sec("hierarchy")}>
          <Story d={HIERARCHY} />
          <Pair {...PAIRS.actions} />
        </Section>

        {/* 07 */}
        <Section {...sec("one-black")}>
          <Story d={ONE_BLACK} />
          <Pair {...PAIRS.banner} />
        </Section>

        {/* 08 */}
        <Section {...sec("grouping")}>
          <Story d={GROUPING} />
        </Section>

        {/* 09 */}
        <Section {...sec("colour")}>
          <Story d={COLOUR} />
        </Section>

        {/* 10 */}
        <Section {...sec("currencies")}>
          <Story d={CURRENCIES} />
          <Pair {...PAIRS.tiles} />
        </Section>

        {/* 11 */}
        <Section {...sec("craft")}>
          <Stories items={CRAFT} />
        </Section>

        {/* 12 */}
        <Section {...sec("data")}>
          <Story d={DATA} />
          <Pair {...PAIRS.money} />
        </Section>

        {/* 13 */}
        <Section {...sec("compare")}>
          <P>{COMPARE_INTRO}</P>
          <div className="mt-8">
            <Compare
              beforeBox={box(COMPARE.before.image)}
              afterBox={box(COMPARE.after.image)}
              before={
                <WorkImage image={COMPARE.before.image} alt={COMPARE.before.alt} sizes="half" className="phone-clip" />
              }
              after={
                <WorkImage image={COMPARE.after.image} alt={COMPARE.after.alt} sizes="half" className="phone-clip" />
              }
            />
          </div>
        </Section>

        {/* 14 */}
        <Section {...sec("learned")}>
          <P>{LEARNED_INTRO}</P>
          <p className="mt-3">
            <Pending value={LEARNED_SOURCES} />
          </p>
          <ol className="mt-8 flex flex-col gap-8">
            {LEARNED.map((l, i) => (
              <li key={l.title} className="flex gap-3">
                <span className="font-mono text-[13px] leading-7 text-neutral-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="max-w-[65ch] text-[16px] leading-snug text-balance text-neutral-900 md:text-[18px]">
                    {l.title}
                  </h3>
                  <P className="mt-2">{l.body}</P>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* 15 */}
        <Section {...sec("measure")}>
          <P>{MEASURE_INTRO}</P>
          <div className="mt-8 border-t-2 border-neutral-900 pt-5">
            <p className="font-mono text-[12px] tracking-wide text-neutral-500 uppercase">North star</p>
            <h3 className="mt-2 max-w-[65ch] text-[16px] leading-snug font-medium text-balance text-neutral-900 md:text-[18px]">
              {NORTH_STAR.name}
            </h3>
            <P className="mt-3">{NORTH_STAR.what}</P>
            <dl className="mt-5 flex flex-col gap-3">
              <Field label="Baseline">{NORTH_STAR.baseline}</Field>
              <Field label="Target">{NORTH_STAR.target}</Field>
            </dl>
          </div>
          <ol className="mt-8 flex flex-col gap-8">
            {MEASURES.map((m) => (
              <li key={m.name} className="border-t border-neutral-900/10 pt-5">
                <p className="font-mono text-[12px] tracking-wide text-neutral-500 uppercase">Tests {m.tests}</p>
                <h3 className="mt-2 max-w-[65ch] text-[16px] leading-snug text-balance text-neutral-900 md:text-[18px]">
                  {m.name}
                </h3>
                <p className="mt-2 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
                  {m.what}
                </p>
                <dl className="mt-4 flex flex-col gap-3">
                  <Field label="Target">{m.target}</Field>
                  <Field label="If missed">{m.missed}</Field>
                </dl>
              </li>
            ))}
          </ol>
        </Section>

        {/* 16 */}
        <Section {...sec("open")}>
          <P>{OPEN_INTRO}</P>
          <ol className="mt-8 flex flex-col divide-y divide-neutral-900/10 border-y border-neutral-900/10">
            {OPEN.map((q, i) => (
              <li key={q.question} className="flex gap-3 py-5">
                <span className="font-mono text-[13px] leading-7 text-neutral-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="max-w-[65ch] text-[16px] leading-snug text-balance text-neutral-900 md:text-[18px]">
                    {q.question}
                  </h3>
                  <p className="mt-1.5 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
                    {q.closes}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <ClosingLine>{CLOSING}</ClosingLine>
        <PageNote>{NOTE}</PageNote>
      </article>

      <CaseNav prev={prev} next={next} index={index} total={total} />
    </PageShell>
  );
}
