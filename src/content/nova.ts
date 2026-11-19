import type { ImageKey } from "./images.generated";
import { todo, type Todo } from "./work";

/**
 * NOVA – the long-form case study at /work/nova.
 *
 * The six other case studies share one shape, so they share one data
 * file and one template. This one doesn't: it argues rather than
 * describes, so it gets its own content module and its own page.
 *
 * Copy rules, same as work.ts and then some:
 *  – no invented metrics, users, testimonials, timelines or results;
 *    NOVA is a concept and the page says so in its first paragraph;
 *  – every "How I'll know it works" row is a threshold set BEFORE
 *    launch, never a result, and the page labels them as such;
 *  – anything only the designer can supply is a `todo()`, which renders
 *    as a dashed amber marker in development and is dropped entirely
 *    from production builds.
 */

export const NOVA = {
  slug: "nova",
  name: "NOVA",
  title: "NOVA · Designing trust for a voice assistant that acts on your phone",
  /** the on-page h1: written to fit one line on desktop, like the other case studies */
  heading: "Designing trust for a voice assistant",
  /** the one line under the hero; also the meta description's spine */
  subtitle:
    "A concept iOS assistant you talk to, designed so the screen proves what it heard before anything happens.",
  meta: {
    role: "Product designer, solo",
    context: "Self-initiated concept",
    scope: "Onboarding and the core loop",
    platform: "iOS",
    date: "November 2026",
  },
  poster: {
    image: "nova/cover" as ImageKey,
    alt: "NOVA brand poster: a glowing pink quatrefoil mark with a white sound waveform inside it, and the NOVA wordmark below, on a soft pink gradient.",
  },
  /** The core loop in one frame, straight under the hero. */
  screens: {
    image: "nova/screens" as ImageKey,
    alt: "Three NOVA screens on grey: Home with the headline Tell me a task, Listening with a live transcript and understanding chips, and Heard with the same words solid above a Go Ahead button.",
    caption:
      "The loop in one frame: ask, see what it heard, approve. Everything below is how each of those three got decided.",
  },
} as const;

/** Anchors for the jump-to list and the section headings themselves. */
export interface SectionRef {
  id: string;
  /** what the jump list shows: short */
  nav: string;
  /** what the page shows: a claim, never a label */
  heading: string;
}

export const SECTIONS: SectionRef[] = [
  { id: "idea", nav: "The idea", heading: "Voice is fast to give and slow to trust" },
  { id: "problem", nav: "The problem", heading: "The hard part starts after you stop talking" },
  { id: "research", nav: "What shaped it", heading: "What I read before I drew anything" },
  { id: "principles", nav: "Principles", heading: "The screen owes you proof, not personality" },
  { id: "flow", nav: "The flow", heading: "Two checkpoints, and why there are exactly two" },
  { id: "onboarding", nav: "Onboarding", heading: "Ask for the microphone last" },
  { id: "home", nav: "Home", heading: "Name the job, don’t ask an open question" },
  { id: "heard", nav: "Listening", heading: "Catch the mishearing while they’re still talking" },
  { id: "plan", nav: "The plan", heading: "One container for hundreds of tasks" },
  { id: "replies", nav: "Replies", heading: "Go ahead, Not now, and the bar that never leaves" },
  { id: "words", nav: "Words", heading: "The words are the interface" },
  { id: "parts", nav: "Parts", heading: "Built as parts, not screens" },
  { id: "measure", nav: "How I’ll know", heading: "How I’ll know it works" },
  { id: "open", nav: "Still open", heading: "What’s still open" },
];

/* ---- the idea and the problem --------------------------------------- */

export const OPENING: string[] = [
  "NOVA is an iOS assistant you speak to. You say what you want done – message someone, clear an inbox, review your open pull requests – and it does it inside the apps you already use.",
  "It is a concept. Nobody has used it. There are no analytics, no interviews and no results. Everything below is a decision I can defend, not a decision anything has confirmed, and I’ll say which is which as I go.",
  "The idea the whole thing hangs on is this. Voice is fast to give and slow to trust. Saying “tell Anshu I’m running ten minutes late on WhatsApp” takes three seconds; typing it takes thirty. But the second you stop talking you have handed over a task you can no longer see. So the screen’s job is proof: that it heard you, what it will do, and what it did.",
  "Every decision on this page answers one question: what does someone need to see to trust this, right now?",
];

export const PROBLEM: string[] = [
  "An assistant that answers questions is safe. An assistant that acts is not. Mishear a name and the message goes to the wrong person. Misread the intent and an email leaves that cannot come back. The cost of being wrong moves from a bad answer to a thing that happened.",
  "That changes what the interface is for. It isn’t there to look like it is thinking. It is there to put the irreversible moment behind something the user actually saw.",
  "Two failures do most of the damage, and they are not the same failure. Mishearing is a transcription problem: it happens before anything is decided and it is cheap to fix. Misunderstanding is an intent problem: the words were right, the plan was wrong, and by the time it shows, the task has run. Each is cheapest to catch at a different moment, which is what the rest of this page is built around.",
];

/* ---- what shaped it -------------------------------------------------- */

export interface Research {
  /** what I took from it */
  claim: string;
  /** what it changed on a screen */
  changed: string;
  source: string | Todo;
}

export const RESEARCH: Research[] = [
  {
    claim: "Keep onboarding to three screens or fewer.",
    changed:
      "NOVA gets three and no more: meet, connect, ask. Both of the first two carry a Skip, so the only screen nobody can skip past is the one that needs an answer.",
    source: todo("link for the onboarding-length finding"),
  },
  {
    claim: "Ask for a permission after the value is clear, never on launch.",
    changed:
      "The microphone is asked for on the third screen, once the apps NOVA will act in are already on the display. Asking first costs nothing to the app and everything to the person deciding.",
    source: todo("link for the permission-priming finding"),
  },
  {
    claim: "On iOS the system permission dialog’s text cannot be changed.",
    changed:
      "This is the one that settled the argument. Apple writes that sheet, it appears once, and a refusal can only be undone in Settings. The in-app screen in front of it is the only place I am allowed to explain anything, so it has to do the whole job.",
    source: todo("link to the Apple requesting-authorisation documentation"),
  },
];

/** The fourth point from the brief, which I haven't been able to read. */
export const RESEARCH_PENDING = todo("fourth research point and its link, from the brief");

/* ---- principles ------------------------------------------------------ */

export const PRINCIPLES: string[] = [
  "Show what you heard before you act on it.",
  "Say what will happen in the user’s words, not the system’s.",
  "Put the most expensive moment behind the clearest confirmation.",
  "One way back from everything, and call it Undo.",
  "A control that belongs in Settings does not belong in the flow.",
];

/* ---- the flow -------------------------------------------------------- */

export interface FlowStep {
  name: string;
  note: string;
  /** a stop where the task waits for a person */
  checkpoint?: { label: string; asks: string; costs: string };
}

export const FLOW: FlowStep[] = [
  { name: "Home", note: "One headline, three suggestions, one dark bar." },
  { name: "Listening", note: "Live transcript, interim words in grey." },
  {
    name: "Heard",
    note: "The same words, solid.",
    checkpoint: {
      label: "Checkpoint 1",
      asks: "Did I hear you?",
      costs: "Costs a glance. Nothing has happened yet, so a correction is free.",
    },
  },
  {
    name: "The plan",
    note: "Steps, and one line naming the consequence.",
    checkpoint: {
      label: "Checkpoint 2",
      asks: "Is this what you want done?",
      costs: "Costs a tap. The last point before anything leaves the phone.",
    },
  },
  { name: "Working", note: "The same list, filling in." },
  { name: "Done", note: "A receipt with timings, and Undo." },
];

export const FLOW_BODY: string[] = [
  "Every voice product has to decide how often it stops to ask. None is fast and dangerous. Three is safe and exhausting. Two, because the two failures above are cheapest to catch at different moments: one before the words settle, one before the task runs.",
];

export const FLOW_GAVE =
  "What I gave up: one extra tap on every task, including the trivial ones. Setting a timer pays the same toll as messaging your boss, which is the wrong trade for the easy half of them. The tap-time measure below is how I would find out.";

/* ---- the decisions --------------------------------------------------- */

export interface Figure {
  image: ImageKey;
  alt: string;
  /** one line that says what to look at */
  caption: string;
}

export interface Decision {
  /** sub-heading inside a section; a claim, never a label */
  title?: string;
  body: string[];
  /** the trade-off, set in italics and in its own voice */
  gave?: string;
}

export const ONBOARDING: Decision[] = [
  {
    body: [
      "NOVA is useless without the microphone, so the obvious move is to ask for it on launch while intent is highest. That is the wrong read of the mechanics. On iOS the ask happens once: the sheet’s wording is Apple’s, not mine, and a refusal can only be reversed in Settings, which nobody does. So the screen in front of that sheet is the only chance anyone gets to explain the trade.",
      "Three screens, then. Meet NOVA. See the apps it works across. Then the ask, by which point the value is concrete rather than promised: you have just seen where this thing is going to act.",
    ],
    gave: "What I gave up: the fastest possible path to a first task. Someone who downloaded NOVA already knowing what it does still sits through two screens before the one that matters. Both carry a Skip, which is a patch, not a fix.",
  },
];

export const HOME: Decision[] = [
  {
    body: [
      "The obvious headline is “What can I do for you?” It is warm, it is familiar, and that is the problem: it fits every assistant ever shipped. It also asks a question, and NOVA is not built to answer questions.",
      "“Tell me a task, I’ll take care of it for you” names the unit of work and promises the outcome. It tells you what to say and what you get.",
      "The three suggestions come from three different apps on purpose – an inbox, a person, a code review. Range is what nobody guesses about an assistant, and one example from one app teaches the wrong lesson. No tabs, no history, no model picker: the home screen has one job, which is to get you talking.",
    ],
    gave: "What I gave up: everything that isn’t a task. No browsing, no record of what NOVA has done before, and no way to see or change which model is answering.",
  },
];

export const HEARD: Decision[] = [
  {
    title: "A transcript you can argue with while it is still being written",
    body: [
      "Mishearing is the main way voice fails, and it fails quietly. So the transcript runs live as you speak: settled words in black, interim words in grey. You can watch the machine change its mind, which is the cheapest possible warning that it is about to get something wrong.",
      "Under it, three chips name what it has pinned down. Who: Anshu. What: Message. Where: WhatsApp. Those three are what is wrong when a voice task goes wrong, and naming them while you are still talking means the correction costs you the next three words rather than a restart.",
      "The obvious alternative – wait, transcribe, then confirm – is simpler to build, and it moves the correction to the most expensive place it could be.",
    ],
  },
  {
    title: "The emptiest part of the screen is the part I thought about longest",
    body: [
      "The top of the Listening screen is the most valuable space on it and I left nearly all of it empty. Six things wanted that slot: a language pill, a microphone source picker, a privacy line, a tip, the flow steps, and an auto-stop toggle.",
      "Five of them are settings wearing a costume. Each one adds a control to a screen whose entire job is to get out of the way, and none of them answers the question that is actually in the room while a microphone is live. “Only listening while this screen is open” does. It is the one line there, and it is about trust rather than configuration.",
    ],
    gave: "What I gave up: five real needs. Multilingual users lose the fastest route to switching language, and anyone on a headset loses the source picker.",
  },
  {
    title: "Heard doesn’t arrive. It settles.",
    body: [
      "When you stop talking the screen does not change, it calms down. The listening label goes. The ripples stop. The words turn solid. The close button disappears and the stop button becomes the single next step.",
      "Nothing new appears, so there is nothing new to read, and the only question left is the one I want asked: is that what I said? This is the first of the two checkpoints, and it is deliberately the cheap one – a glance, not a decision.",
    ],
    gave: "What I gave up: a tap. Heard is an entire screen that a confident, correct transcription never needed.",
  },
];

export const PLAN: Decision[] = [
  {
    body: [
      "NOVA can do hundreds of different things. The tempting way to design that is to design the good ones – a message screen, an email screen, a calendar screen – and the hundred-and-first task then has no screen at all.",
      "So there is one container. A list of steps, and one line naming the consequence: “Send as you, right away.” Everything NOVA can do is steps and a consequence, which means the pattern holds for the tasks I never drew.",
    ],
  },
  {
    title: "The version I threw away",
    body: [
      "My first version put the task name in a heading with the steps in a tagged card beneath. Two things broke it. Long names wrapped onto two and three lines, so the list below started somewhere different on every task. And the card made a plan look like a form – something to fill in rather than read.",
      "I then explored three directions: a one-sentence focus view, a plain checklist, and swipeable step cards. I rejected the sentence because it hid the steps behind a tap, which defeats the point of showing a plan. I rejected the swipe cards because they make you work before you can approve – you flick through three cards to find out what you are agreeing to.",
      "The plain checklist won. The whole plan is visible at once, there is no container to style, and it reads the same whether there are two steps or nine. The heading became a fixed status row instead – one line, always the same height, so the list below it never jumps.",
    ],
    gave: "What I gave up: the task name. You can no longer see at a glance which task this is; you read the steps to find out. On a screen you reached by speaking two seconds ago, I’ll take that trade.",
  },
  {
    title: "Working changes as little as it possibly can",
    body: [
      "Working is the same list in the same place. The marks fill in, the status row counts down to “Step 2 of 3”, and the black button becomes Working. Nothing slides, and the plan you approved is still the plan you are looking at.",
      "Done shrinks the steps into a receipt with real timings – 1s, 2s, 1s. “Done” is a claim; the timings are the evidence for it. Underneath, “How did I do?” with two thumbs: one question that works for any task, which a per-task survey could never do. Undo is a button that stays, not a toast that expires while you are still reading it.",
    ],
  },
];

export const REPLIES: Decision[] = [
  {
    body: [
      "Three ways to answer a plan, at three weights. Go ahead is black and solid – the one thing most people will do, and the only black control on the screen. Not now is quiet and outlined: available, never urged. The dark bar at the foot, “Add to this task…”, is the home screen’s bar in the home screen’s place, so the way to say more never moves – before the plan runs and after it finishes.",
      "The words took longer than the layout. I considered Cancel, Hold off, Save for later, Leave it and Start over. Cancel and Quit sound like the task is being destroyed, and it isn’t – it is waiting. So: Not now before, Pause during, Undo after, one idea named for what it does at each moment.",
    ],
    gave: "What I gave up: “Not now” doesn’t say where the task went, because right now it goes nowhere. There is no list of held tasks, which is one of the open questions below.",
  },
];

/* ---- words ----------------------------------------------------------- */

export interface WordRow {
  common: string;
  nova: string;
  why: string;
}

export const WORDS: WordRow[] = [
  {
    common: "Cancel, Quit",
    nova: "Not now · Pause · Undo",
    why: "The task is waiting, not being destroyed. One idea, named for the moment it happens in.",
  },
  {
    common: "Confirm",
    nova: "Go ahead",
    why: "Permission, in the words you would use out loud to a person.",
  },
  {
    common: "Processing",
    nova: "Working",
    why: "A verb someone would use about themselves.",
  },
  {
    common: "Request received",
    nova: "Here’s what I heard",
    why: "Says what is on the screen, not what the system did to a request.",
  },
  {
    common: "How was your experience?",
    nova: "How did I do?",
    why: "Four words, any task, one tap – and it asks about NOVA rather than about you.",
  },
];

/* ---- parts ----------------------------------------------------------- */

export const PARTS: string[] = [
  "I designed parts with states, not screens with layouts: one mark that carries from the app icon to the full-bleed listening animation, one pink wash that means voice and nothing else, and black reserved for do, so it lands on exactly one control per screen.",
  "That rule is what made the plan container possible – status row, step list, consequence line and reply bar assemble into Plan, Working and Done without a new screen being drawn for any of them.",
];

export interface Part {
  name: string;
  rule: string;
  states: string[];
}

export const PART_SPECS: Part[] = [
  {
    name: "Status row",
    rule: "One line, fixed height, the same two slots. It replaced a heading that moved.",
    states: ["The plan · 3 steps · about 10 seconds", "Step 2 of 3 · about 6 seconds left", "All done · in 4 seconds"],
  },
  {
    name: "Step",
    rule: "A mark, a title, and a sublabel: the app, or the exact words being written.",
    states: ["Waiting", "Running", "Done, with its own timing"],
  },
  {
    name: "Consequence line",
    rule: "One line naming what the user cannot take back. Every plan has exactly one.",
    states: ["Send as you, right away"],
  },
  {
    name: "Reply bar",
    rule: "One black control and one quiet one. Black appears nowhere else on the screen.",
    states: ["Not now / Go ahead", "Pause / Working", "Undo / Done"],
  },
];

/* ---- how I'll know it works ------------------------------------------ */

export interface Measure {
  /** the decision this could falsify */
  tests: string;
  name: string;
  what: string;
  baseline?: string;
  target: string;
  missed: string;
}

export const NORTH_STAR = {
  name: "Kept tasks per active user per week",
  what: "Tasks that complete and are not undone or reverted within a day. It rewards NOVA for finishing things and punishes it for finishing the wrong things.",
  baseline:
    "A prototype test: 8 to 10 people doing the same five tasks by hand and then with NOVA.",
  target:
    "None yet. Until that test runs this is a measure, not a claim, and I am not going to put a number on it to make the page look finished.",
};

export const MEASURES: Measure[] = [
  {
    tests: "the understanding chips",
    name: "Where corrections happen",
    what: "Share of corrections made on the Heard screen, before sending, against those made after sending.",
    target: "Over 80% before sending.",
    missed:
      "Above 30% after sending, the chips aren’t carrying enough: put the recipient and the time into the transcript line, and make the chips editable.",
  },
  {
    tests: "the two checkpoints",
    name: "Tap time on Heard",
    what: "How long Heard is on screen before someone taps through, and whether they edit anything while there.",
    target: "A glance, not a read.",
    missed:
      "If over 90% of taps land under one second with no edits for two weeks, the checkpoint isn’t earning its place. Merge Heard into the plan for reversible tasks.",
  },
  {
    tests: "the approval step",
    name: "Plan opens and edits",
    what: "How often people actually read or change a plan rather than tapping straight through it.",
    target: "It stays in use.",
    missed:
      "If it falls below 5% over two weeks while the undo rate climbs, approval has become a reflex. Add a hold-to-confirm, for irreversible steps only.",
  },
  {
    tests: "the microphone screen",
    name: "Opt-in rate",
    what: "The share who allow the microphone, against a variant with no explaining screen in front of the system sheet.",
    target: "Better than asking cold.",
    missed:
      "No better than no screen means it is costing two taps for nothing: move the ask to the first tap of the mic and drop the screen.",
  },
  {
    tests: "over-trust (guardrail)",
    name: "Undo and revert rate",
    what: "Share of completed tasks that are undone or reverted, read next to how often the plan was opened.",
    target: "Under 10% of completed tasks.",
    missed:
      "Rising undos with falling plan opens means approving is too easy. Show the draft inside the consequence line, or require a review for that task type.",
  },
];

export const MEASURE_INTRO =
  "Nothing here has been in front of a user. These are thresholds I set before launch, each with what changes if it is missed. I am writing them down first so that I cannot decide afterwards that whatever happened was the goal.";

/* ---- what's still open ------------------------------------------------ */

export interface OpenQuestion {
  question: string;
  closes: string;
}

export const OPEN: OpenQuestion[] = [
  {
    question: "Everything here is reasoned, not observed.",
    closes:
      "The prototype test above closes it: 8 to 10 people, the same five tasks by hand and with NOVA, and the first real baseline for kept tasks.",
  },
  {
    question: "Whether safe, reversible tasks should skip the plan entirely.",
    closes:
      "Tag the first hundred tasks as reversible or not, then check whether anyone ever undoes a reversible one. If nobody does, those tasks don’t need a second checkpoint.",
  },
  {
    question: "How long Undo lasts, and where a task sent to “Not now” waits.",
    closes:
      "Both need a Held list, which does not exist yet. Until it does, “Not now” is a promise the interface cannot keep.",
  },
  {
    question: "How several tasks running at once appear.",
    closes:
      "One plan fills the screen and three do not fit. This is the next piece of design work, and it probably changes the home screen rather than the plan.",
  },
  {
    question: "Whether approving and editing by voice survives a noisy room.",
    closes:
      "Everything here assumes you can hear and be heard. Running the same five tasks in a café, with the screen as the only fallback, is the cheapest way to find out what breaks first.",
  },
];

export const CLOSING = "Speed is what the voice buys. Proof is what the screen has to earn.";

export const HONESTY =
  "Screens were rendered with AI image tools from my prompts and art direction. The decisions, labels and rules are mine.";
