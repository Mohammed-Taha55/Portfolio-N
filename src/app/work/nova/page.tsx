import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import WorkImage from "@/components/work-image";
import CaseNav from "@/components/case/case-nav";
import States from "@/components/case/states";
import Flow from "@/components/case/flow";
import AfterLoad from "@/components/after-load";
import { KIND_LABEL, neighbours, isTodo } from "@/content/work";
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
  Shot,
  Stories,
  Gave,
} from "@/components/case/longform";
import {
  CLOSING,
  FLOW,
  FLOW_BODY,
  FLOW_GAVE,
  HEARD,
  HOME,
  HONESTY,
  MEASURES,
  MEASURE_INTRO,
  NORTH_STAR,
  NOVA,
  ONBOARDING,
  OPEN,
  OPENING,
  PARTS,
  PART_SPECS,
  PLAN,
  PRINCIPLES,
  PROBLEM,
  REPLIES,
  RESEARCH,
  RESEARCH_PENDING,
  SECTIONS,
  WORDS,
} from "@/content/nova";
import { JsonLd, PERSON_ID } from "@/lib/json-ld";
import { placeholderOf } from "@/lib/images";
import { pageMeta, SITE_NAME, SITE_URL } from "@/lib/site";

const URL = `${SITE_URL}/work/nova`;

export const metadata: Metadata = pageMeta(
  "NOVA",
  "NOVA is a concept iOS assistant you talk to. I designed its onboarding and core loop so the screen proves what it heard, what it will do, and what it did.",
  "/work/nova",
  `NOVA: designing trust for a voice assistant that acts on your phone · ${SITE_NAME}`,
  {
    url: "/img/nova/share.jpg",
    width: 1200,
    height: 630,
    alt: NOVA.poster.alt,
  },
  "article",
);

/* ---- page ------------------------------------------------------------ */

export default function NovaPage() {
  const { prev, next, index, total } = neighbours(NOVA.slug);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${URL}#work`,
      name: NOVA.title,
      headline: NOVA.title,
      abstract: NOVA.subtitle,
      url: URL,
      image: `${SITE_URL}/img/nova/share.jpg`,
      genre: KIND_LABEL.app,
      keywords: ["iOS app", "Voice interface", "Original", "UX design", "Case study"],
      about: { "@type": "Thing", name: "NOVA" },
      creator: { "@id": PERSON_ID },
      author: { "@id": PERSON_ID },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Work", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "NOVA", item: URL },
      ],
    },
  ];

  const s = (id: string) => SECTIONS.find((x) => x.id === id)!;
  const n = (id: string) => SECTIONS.findIndex((x) => x.id === id) + 1;

  return (
    <PageShell active="home">
      <JsonLd data={jsonLd} />
      <article className="pt-20 sm:pt-28">
        <CaseHeader kind={KIND_LABEL.app} title={NOVA.heading} />
        <Hero image={NOVA.poster.image} alt={NOVA.poster.alt} />
        <Lede origin="original">{NOVA.subtitle}</Lede>
        <MetaList
          items={[
            ["Role", NOVA.meta.role],
            ["Context", NOVA.meta.context],
            ["Scope", NOVA.meta.scope],
            ["Platform", NOVA.meta.platform],
            ["Date", NOVA.meta.date],
          ]}
        />

        {/* The poster is the brand mark now, so the work itself leads here. */}
        <figure className="mt-8">
          <AfterLoad {...placeholderOf(NOVA.screens.image)}>
            <WorkImage image={NOVA.screens.image} alt={NOVA.screens.alt} sizes="full" />
          </AfterLoad>
          <Caption>{NOVA.screens.caption}</Caption>
        </figure>

        <JumpList sections={SECTIONS} />

        {/* 01 — the idea */}
        <Section id={s("idea").id} n={n("idea")} heading={s("idea").heading}>
          <div className="flex flex-col gap-4">
            {OPENING.map((para) => (
              <P key={para.slice(0, 40)}>{para}</P>
            ))}
          </div>
        </Section>

        {/* 02 — the problem */}
        <Section id={s("problem").id} n={n("problem")} heading={s("problem").heading}>
          <div className="flex flex-col gap-4">
            {PROBLEM.map((para) => (
              <P key={para.slice(0, 40)}>{para}</P>
            ))}
          </div>
        </Section>

        {/* 03 — research */}
        <Section id={s("research").id} n={n("research")} heading={s("research").heading}>
          <ol className="flex flex-col gap-8">
            {RESEARCH.map((r, i) => (
              <li key={r.claim} className="flex gap-3">
                <span className="font-mono text-[13px] leading-7 text-neutral-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="max-w-[65ch] text-[16px] leading-snug text-balance text-neutral-900 md:text-[18px]">
                    {r.claim}
                  </h3>
                  <P className="mt-2">{r.changed}</P>
                  {isTodo(r.source) ? (
                    <p className="mt-2">
                      <Pending value={r.source} />
                    </p>
                  ) : (
                    <p className="mt-2 text-[14px] text-neutral-500">{r.source}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6">
            <Pending value={RESEARCH_PENDING} />
          </p>
        </Section>

        {/* 04 — principles */}
        <Section id={s("principles").id} n={n("principles")} heading={s("principles").heading}>
          <ol className="flex flex-col divide-y divide-neutral-900/10 border-y border-neutral-900/10">
            {PRINCIPLES.map((principle, i) => (
              <li key={principle} className="flex items-baseline gap-3 py-3.5">
                <span className="font-mono text-[13px] text-neutral-500 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="max-w-[65ch] text-[16px] leading-snug text-pretty text-neutral-900 md:text-[18px]">
                  {principle}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {/* 05 — the flow */}
        <Section id={s("flow").id} n={n("flow")} heading={s("flow").heading}>
          <div className="flex flex-col gap-4">
            {FLOW_BODY.map((para) => (
              <P key={para.slice(0, 40)}>{para}</P>
            ))}
          </div>
          <div className="mt-8">
            <Flow steps={FLOW} />
          </div>
          <Gave>{FLOW_GAVE}</Gave>
        </Section>

        {/* 06 — onboarding */}
        <Section id={s("onboarding").id} n={n("onboarding")} heading={s("onboarding").heading}>
          <Stories items={ONBOARDING} />
          <Shot
            image="nova/onboarding"
            alt="Three NOVA onboarding screens on pink: Hi I’m Nova with Get started, Seamless connections showing six app icons including Slack, WhatsApp, Calendar, Notion and Gmail, with Continue, and the microphone screen with Allow microphone and a Not now link."
            caption="Three screens. The microphone is asked for on the third, after the apps NOVA will act inside are already on the display."
          />
        </Section>

        {/* 07 — home */}
        <Section id={s("home").id} n={n("home")} heading={s("home").heading}>
          <Stories items={HOME} />
          <figure className="mt-8">
            <div
              className="flex justify-center px-4 py-8 sm:px-8 sm:py-12"
              style={{ backgroundColor: "#4a4a4a" }}
            >
              <div className="w-full max-w-[320px] sm:max-w-[380px] wd:max-w-[420px]">
                <AfterLoad {...placeholderOf("nova/home")}>
                  <WorkImage
                    image="nova/home"
                    alt="NOVA home screen: a greeting, a pink waveform mark, the headline Tell me a task, I’ll take care of it for you, three suggestion chips, and a dark Ask anything bar with a pink microphone button."
                    sizes="phone"
                  />
                </AfterLoad>
              </div>
            </div>
            <figcaption className="mt-4 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-500 md:text-[18px]">
              One headline naming the job, and three suggestions drawn from three different apps.
            </figcaption>
          </figure>
        </Section>

        {/* 08 — listening and heard */}
        <Section id={s("heard").id} n={n("heard")} heading={s("heard").heading}>
          <Stories items={HEARD} />
          <div className="mt-8">
            <States
              label="Listening and Heard"
              items={[
                {
                  id: "listening",
                  label: "Listening",
                  caption:
                    "The words still being settled are grey; the ones NOVA is sure of are black. The privacy line is the only thing at the top of the screen.",
                  image: (
                    <AfterLoad {...placeholderOf("nova/listening")}>
                      <WorkImage
                        image="nova/listening"
                        alt="NOVA listening screen: the line Only listening while this screen is open, an animated waveform, a Listening label with a 0:04 timer, a live transcript with the last words in grey, three chips reading Anshu, Message and Whatsapp, and stop and close buttons."
                        sizes="phone"
                      />
                    </AfterLoad>
                  ),
                },
                {
                  id: "heard",
                  label: "Heard",
                  caption:
                    "Nothing new arrives. The label, the ripples and the close button go, the words turn solid, and the stop button becomes the single next step.",
                  image: (
                    <AfterLoad {...placeholderOf("nova/heard")}>
                      <WorkImage
                        image="nova/heard"
                        alt="NOVA heard screen: Here’s what I heard above the full sentence in solid black, the same three chips, and a single wide Go Ahead button where the stop button was."
                        sizes="phone"
                      />
                    </AfterLoad>
                  ),
                },
              ]}
            />
          </div>
          <Shot
            image="nova/chips"
            alt="Close-up of the live transcript: Tell Anshu I’m running ten minutes late in black with on WhatsApp still grey, above three chips reading Anshu, Message and Whatsapp."
            caption="Who, what and where, pinned while you are still speaking — the three things that are wrong when a voice task goes wrong."
            ground="#ffffff"
          />
        </Section>

        {/* 09 — the plan */}
        <Section id={s("plan").id} n={n("plan")} heading={s("plan").heading}>
          <Stories items={PLAN} />
          <div className="mt-8">
            <States
              label="The plan, working and done"
              items={[
                {
                  id: "plan",
                  label: "Plan",
                  caption:
                    "The status row is fixed at one line, so the list under it starts in the same place whatever the task is called.",
                  image: (
                    <AfterLoad {...placeholderOf("nova/plan")}>
                      <WorkImage
                        image="nova/plan"
                        alt="NOVA plan screen: a status row reading The plan and 3 steps, about 10 seconds; three numbered steps to open WhatsApp, write the message and send it; the line Send as you, right away; and Not now and Go Ahead buttons."
                        sizes="phone"
                      />
                    </AfterLoad>
                  ),
                },
                {
                  id: "working",
                  label: "Working",
                  caption:
                    "The same list in the same place. Only the marks, the status row and the one black button change.",
                  image: (
                    <AfterLoad {...placeholderOf("nova/working")}>
                      <WorkImage
                        image="nova/working"
                        alt="NOVA working screen: the status row now reads Step 2 of 3, about 6 seconds left; step one is ticked, step two is spinning, step three waits; the buttons read Pause and Working."
                        sizes="phone"
                      />
                    </AfterLoad>
                  ),
                },
                {
                  id: "done",
                  label: "Done",
                  caption:
                    "The steps shrink into a receipt with real timings, and Undo stays on screen rather than expiring in a toast.",
                  image: (
                    <AfterLoad {...placeholderOf("nova/done")}>
                      <WorkImage
                        image="nova/done"
                        alt="NOVA done screen: the status row reads All done, in 4 seconds; three ticked steps each with their own timing of one, two and one seconds; a feedback card asking how NOVA did, with thumbs up and down; and Undo and Done buttons."
                        sizes="phone"
                      />
                    </AfterLoad>
                  ),
                },
              ]}
            />
          </div>
          <Shot
            image="nova/plan-list"
            alt="Close-up of the plan: the status row reading The plan and 3 steps, about 10 seconds, three numbered steps with app sublabels, and the consequence line Send as you, right away."
            caption="Status row, three steps, one consequence line. No container, and no task name."
            ground="#ffffff"
          />
        </Section>

        {/* 10 — replies */}
        <Section id={s("replies").id} n={n("replies")} heading={s("replies").heading}>
          <Stories items={REPLIES} />
          <Shot
            image="nova/replies"
            alt="Close-up of the two reply buttons: an outlined Not now on the left and a solid black Go Ahead on the right, under the pink lock line reading Send as you, right away."
            caption="Black for the one thing most people will do, an outline for the one that waits."
            ground="#ffffff"
          />
        </Section>

        {/* 11 — words */}
        <Section id={s("words").id} n={n("words")} heading={s("words").heading}>
          <P>
            Each of these was a decision, not a style preference. A word that sounds like the
            task is being destroyed makes people hesitate over something reversible.
          </P>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <caption className="sr-only">
                Words most apps use, what NOVA says instead, and why
              </caption>
              <thead>
                <tr className="border-b border-neutral-900/15">
                  {["Most apps", "NOVA", "Why"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="pb-2.5 pr-4 font-mono text-[12px] font-normal tracking-wide text-neutral-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WORDS.map((row) => (
                  <tr key={row.common} className="border-b border-neutral-900/10 align-top">
                    <td className="py-3.5 pr-4 text-[16px] leading-snug text-neutral-500 md:text-[18px]">
                      <s className="decoration-neutral-400">{row.common}</s>
                    </td>
                    <td className="py-3.5 pr-4 text-[16px] leading-snug text-neutral-900 md:text-[18px]">
                      {row.nova}
                    </td>
                    <td className="py-3.5 text-[16px] leading-snug text-pretty text-neutral-600 md:text-[18px]">
                      {row.why}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 12 — parts */}
        <Section id={s("parts").id} n={n("parts")} heading={s("parts").heading}>
          <div className="flex flex-col gap-4">
            {PARTS.map((para) => (
              <P key={para.slice(0, 40)}>{para}</P>
            ))}
          </div>
          <dl className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-2">
            {PART_SPECS.map((part) => (
              <div key={part.name} className="border-t border-neutral-900/10 pt-4">
                <dt className="text-[16px] text-neutral-900 md:text-[18px]">{part.name}</dt>
                <dd>
                  <p className="mt-1.5 max-w-[65ch] text-[15px] leading-normal text-pretty text-neutral-600">
                    {part.rule}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {part.states.map((state) => (
                      <li
                        key={state}
                        className="rounded-md bg-neutral-900/[0.05] px-2 py-1 font-mono text-[12px] text-neutral-600 [corner-shape:squircle]"
                      >
                        {state}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* 13 — how I'll know it works */}
        <Section id={s("measure").id} n={n("measure")} heading={s("measure").heading}>
          <P>{MEASURE_INTRO}</P>

          <div className="mt-8 border-t-2 border-neutral-900 pt-5">
            <p className="font-mono text-[12px] tracking-wide text-neutral-500 uppercase">
              North star
            </p>
            <h3 className="mt-2 max-w-[65ch] text-[16px] leading-snug font-medium text-balance text-neutral-900 md:text-[18px]">
              {NORTH_STAR.name}
            </h3>
            <P className="mt-3">{NORTH_STAR.what}</P>
            <dl className="mt-5 flex flex-col gap-3">
              {(
                [
                  ["Baseline", NORTH_STAR.baseline],
                  ["Target", NORTH_STAR.target],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="sm:grid sm:grid-cols-[6.5rem_1fr] sm:gap-4">
                  <dt className="font-mono text-[12px] leading-6 tracking-wide text-neutral-500 uppercase">
                    {label}
                  </dt>
                  <dd className="max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <ol className="mt-8 flex flex-col gap-8">
            {MEASURES.map((m) => (
              <li key={m.name} className="border-t border-neutral-900/10 pt-5">
                <p className="font-mono text-[12px] tracking-wide text-neutral-500 uppercase">
                  Tests {m.tests}
                </p>
                <h3 className="mt-2 max-w-[65ch] text-[16px] leading-snug text-balance text-neutral-900 md:text-[18px]">
                  {m.name}
                </h3>
                <p className="mt-2 max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
                  {m.what}
                </p>
                <dl className="mt-4 flex flex-col gap-3">
                  {(
                    [
                      ["Target", m.target],
                      ["If missed", m.missed],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="sm:grid sm:grid-cols-[6.5rem_1fr] sm:gap-4">
                      <dt className="font-mono text-[12px] leading-6 tracking-wide text-neutral-500 uppercase">
                        {label}
                      </dt>
                      <dd className="max-w-[65ch] text-[16px] leading-normal text-pretty text-neutral-600 md:text-[18px]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>
        </Section>

        {/* 14 — what's still open */}
        <Section id={s("open").id} n={n("open")} heading={s("open").heading}>
          <P>Each one has a way to close it. None of them closes by thinking about it harder.</P>
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
        <PageNote>{HONESTY}</PageNote>
      </article>

      <CaseNav prev={prev} next={next} index={index} total={total} />
    </PageShell>
  );
}
