import type { ImageKey } from "./images.generated";
import { todo, type Todo } from "./work";
import type { SectionRef, StoryData } from "@/components/case/longform";
import type { Frame } from "@/components/case/filmstrip";
import type { PairShot } from "@/components/case/pair";

/**
 * Fintech home - the long-form case study at /work/fintech-home.
 *
 * A real client brief, anonymised at the designer's request: the client
 * is "a fintech client" everywhere (text, alt text, paths, metadata) and
 * its logo is blurred in every image (scripts/build-images.mjs).
 *
 * Copy rules:
 *  - the work was SUBMITTED, NOT APPROVED, and never shipped; nothing
 *    here may imply approval, launch, users or results;
 *  - every visual claim was checked against the exports at full size;
 *  - "How I'd know it works" holds thresholds proposed before any use;
 *  - facts only the designer has (dates, counts, tools, research) are
 *    `todo()`s: amber in development, absent from production builds.
 */

export const FH = {
  slug: "fintech-home",
  name: "Fintech",
  title: "Fintech · Designing a money app's home screen around one action",
  /** the on-page h1: one line on desktop */
  heading: "A money app built around one action",
  subtitle:
    "My first fintech brief. The first version pushed the wrong button. About two days and a reviewer's seven notes later, one button clearly led.",
  poster: {
    image: "fintech-home/cover" as ImageKey,
    alt: "Three stages of a fintech app's home screen on a sky-blue background: an early version with Add money as the black middle button, a dark balance card version with a blue Add money button, and the final with a white balance card, a black Add money button and a two-by-two grid of currency tiles. The client's logo is blurred.",
  },
  meta: [
    ["Role", "Product designer, solo"],
    ["Client", "A fintech client (anonymised)"],
    ["Status", "Submitted, not approved"],
    ["Platform", "iOS"],
    ["Tools", todo("design tools used")],
  ] as [string, string | Todo][],
} as const;

export const SECTIONS: SectionRef[] = [
  { id: "idea", nav: "The idea", heading: "The home screen has one job, and it’s getting money in" },
  { id: "brief", nav: "The brief", heading: "The brief gave me a goal, a brand, and one thing not to do" },
  { id: "start", nav: "Version one", heading: "Version one looked finished and was pushing the wrong button" },
  { id: "review", nav: "The review", heading: "Seven notes, read as a brief rather than a verdict" },
  { id: "iterations", nav: "Iterations", heading: "Each iteration fixed one thing and exposed the next" },
  { id: "hierarchy", nav: "Hierarchy", heading: "Add money is the widest thing in the card, and the only black one" },
  { id: "one-black", nav: "One black button", heading: "The banner’s button became a link, so nothing competes" },
  { id: "grouping", nav: "Grouping", heading: "The money-in action sits next to the number it changes" },
  { id: "colour", nav: "Colour", heading: "Black does, blue is the brand, green grows, nothing is yellow" },
  { id: "currencies", nav: "Currencies", heading: "The row cut a currency in half. The grid can’t." },
  { id: "craft", nav: "Brand and craft", heading: "Flat isometric was off-brand, and 3D cost something too" },
  { id: "data", nav: "Money details", heading: "In a money app, the sample data is part of the design" },
  { id: "compare", nav: "Before and after", heading: "Same content, one priority" },
  { id: "learned", nav: "What I learned", heading: "Three things a money app taught me in about two days" },
  { id: "measure", nav: "How I’d know", heading: "How I’d know it works" },
  { id: "open", nav: "Still open", heading: "Questions the screen still has to answer" },
];

/* ---- 01 the idea ------------------------------------------------------ */

export const IDEA: string[] = [
  "This is the home screen of a mobile money app: a balance, accounts in several currencies, recent activity, and an offer to earn interest.",
  "It was my first fintech brief and my first mobile screen built to a client’s brand. I came to it with little fintech knowledge.",
  "The client’s goal did the first piece of thinking for me: get people to add money. In a money app that isn’t one feature among several. An account with nothing in it hasn’t really started, so adding money is the moment the product becomes useful, and the moment the business is waiting for.",
  "So one idea runs through every decision below. Every element either helps someone put money in, or gets out of the way. Trust, clarity and orientation can earn a place too, but they have to earn it.",
];

/* ---- 02 the brief ------------------------------------------------------ */

export const BRIEF: { label: string; body: string }[] = [
  {
    label: "A goal",
    body: "Add money is the main focus of the screen. Everything else comes second to it.",
  },
  {
    label: "A brand",
    body: "The screen had to look like the client, not like me. Within that, the interface decisions were mine to make.",
  },
  {
    label: "A wireframe not to copy",
    body: "It showed the content, not the layout. I read that as permission to rethink the structure. The review would tell me I hadn’t taken enough of it.",
  },
];

/* ---- 03 version one ---------------------------------------------------- */

export const TIMELINE: { when: string | Todo; what: string }[] = [
  { when: todo("date of version one"), what: "Version one: three variants of the first screen." },
  { when: "9 Nov 2026", what: "The review: seven notes from the reviewer." },
  { when: todo("date the final was submitted"), what: "The final, submitted about two days after version one." },
];

export const START: StoryData[] = [
  {
    body: [
      "Version one came in three variants. They differ in small ways – how “Add currency account” sits, which illustration fills the banner – and agree on everything that mattered, which was the problem.",
      "It had everything the brief listed, and it looked complete. The emphasis was in the wrong place. Send carried the dark fill, so it read as the main action. And the only truly black control on the screen was Explore, in the banner at the bottom: the last place I wanted anyone to go first.",
      "Two smaller mistakes were in the numbers. An Amazon order of £8,080.50. A £12,000 deposit “via UPI”, which is India’s payment network, in an app holding pounds, dollars and crypto. I’d treated the sample data as filler. Nobody reads a money app’s numbers as filler.",
    ],
  },
];

/* ---- 04 the review ----------------------------------------------------- */

export const REVIEW_INTRO =
  "The review came back on 9 November. Seven notes. The easy reading is a list of faults to patch one by one. I read them as a description of the screen the client wanted. Two of them changed the structure; the other five changed the finish.";

export const NOTES: { note: string; change: string; where: string }[] = [
  {
    note: "The banner’s isometric illustration is flat, and not the brand’s style.",
    change: "A photographed hand of cash first, then glossy 3D imagery: a piggy bank and coins.",
    where: "Iterations 1–2",
  },
  {
    note: "No hierarchy: the only black button is Explore. It should be Add money.",
    change: "Add money turned black straight away. Explore became a pale pill, then a text link.",
    where: "Iterations 1–4",
  },
  {
    note: "Letter-spacing is too tight.",
    change: "The action labels are set heavier and with more open spacing.",
    where: "By the final",
  },
  {
    note: "The button strokes need attention.",
    change: "A faint outline on every button became plain fills, with a defined edge only on Add money.",
    where: "By the final",
  },
  {
    note: "There’s a slight yellow tone in the background.",
    change: "The warm off-white went. A sky gradient came in, over neutral greys.",
    where: "Iteration 1",
  },
  {
    note: "The icons are inconsistent in stroke thickness.",
    change: "The thin grey info icons on the account rows went; the action icons share one weight.",
    where: "Iteration 4",
  },
  {
    note: "Be more creative, don’t copy the wireframe, and take your time.",
    change: "The structure changed: balance and actions in one card, currency tiles, a floating navigation bar.",
    where: "Iteration 4",
  },
];

/* ---- 05 iterations ----------------------------------------------------- */

export const ITERATIONS_INTRO: string[] = [
  "Six iterations survive. Read in order, each one answers something, and each answer shows the next thing wrong.",
];
export const ITERATIONS_COUNT = todo("how many iterations were made in total");

export const FRAMES: Frame[] = [
  {
    image: "fintech-home/iter-1" as ImageKey,
    label: "Iteration 1",
    alt: "Iteration 1: a sky gradient background, Add money as the black middle button, an account list, transactions, and a blue banner with a photographed hand holding cash and a black Explore button.",
    changed: "Sky gradient; Add money turns black.",
    why: "The two notes I could fix at once. Explore is still black, so the screen still has two leaders.",
  },
  {
    image: "fintech-home/iter-2" as ImageKey,
    label: "Iteration 2",
    alt: "Iteration 2: the same layout with a pink banner showing a 3D piggy bank and gold coins, and Explore as a pale pink pill.",
    changed: "3D piggy bank; Explore fades to a pill.",
    why: "The banner looks like the brand, and stops competing with Add money.",
  },
  {
    image: "fintech-home/iter-3" as ImageKey,
    label: "Iteration 3",
    alt: "Iteration 3: the banner turns pale green, Explore is a green pill, and the Your returns heading above the banner is gone.",
    changed: "Green banner; the “Your returns” heading goes.",
    why: "Green for growth. The heading only repeated what the banner said.",
  },
  {
    image: "fintech-home/iter-4" as ImageKey,
    label: "Iteration 4",
    alt: "Iteration 4: the blurred logo in the header, a dark card holding the balance with a lime 4.1% AER tag and a blue Add money button, a scrolling row of currency tiles with the euro tile cut off, an Activities list, and a floating navigation bar.",
    changed: "One dark card; currency tiles; floating navigation.",
    why: "The structural answer to the wireframe note. But Add money had to be blue on the dark card, and the euro tile ran off the edge.",
  },
  {
    image: "fintech-home/iter-5" as ImageKey,
    label: "Iteration 5",
    alt: "Iteration 5: the balance card is white, with a black Add money button and grey Send and Move buttons; the currency tiles still scroll, with the euro tile cut off.",
    changed: "The card goes white; Add money goes black.",
    why: "Black means do again. The euro tile is still cut off.",
  },
  {
    image: "fintech-home/final" as ImageKey,
    label: "Final",
    alt: "The final screen: a white balance card with a black Add money button, a two-by-two grid of GBP, USD, crypto and EUR tiles, an Activities list, a green interest banner and a floating navigation bar.",
    changed: "The tiles become a two-by-two grid.",
    why: "All four balances visible at once, nothing behind a scroll.",
  },
];

/* ---- 06–12 decisions ----------------------------------------------------- */

export const HIERARCHY: StoryData = {
  body: [
    "In version one the three actions were the same size and Send had the dark fill, so Send looked like the point of the screen. The obvious fix is to swap the fills and leave the row alone. I went further. Add money moved to the left, where the eye starts, took about twice the width of the others, and became the only black control. Send and Move became quiet grey fills.",
    "Three signals instead of one – position, size and colour – because on this screen a mis-tap between putting money in and sending money out is not a small error.",
  ],
  gave: "What it cost: Send is less prominent than it was. Someone who opens the app mostly to pay people now looks past the action they came for.",
};

export const ONE_BLACK: StoryData = {
  body: [
    "The reviewer’s sharpest note was that the only black button on my screen was Explore. It was worse than it sounded: the strongest call to action pointed at an interest offer, at the bottom of the screen, for people who might not have put any money in yet.",
    "Making Add money black fixed half of it. The other half was making Explore stop looking like a button. It went from black to a pale pill, then to an underlined text link. The offer is still there for anyone who wants it. It just doesn’t shout.",
  ],
  gave: "What it cost: the offer to earn interest is now the quietest thing on the screen. If it underperforms, this is the first decision to revisit.",
};

export const GROUPING: StoryData = {
  body: [
    "Version one put the balance straight on the background with the actions underneath, like two things that happened to be near each other. In the final they share one white card, with a dashed rule between them. Add money is the button that makes that number go up, so it belongs inside the same object as the number.",
    "I tried a dark card first, which made the balance stand out. But on it, Add money had to be blue to show at all, and blue was already the brand’s colour.",
  ],
  gave: "What it cost: a white card on a pale sky has less contrast than the dark one, so the balance has less drama. I traded drama for one consistent meaning of black.",
};

export const COLOUR: StoryData = {
  body: [
    "By the final, each colour on the screen has one job. Black means do, so it appears on exactly one control. Blue is the brand, so it’s the sky and nothing you tap. Green is growth: money arriving in the activity list, and the interest banner.",
    "The warm cast the reviewer spotted is gone too: version one’s background measures 247, 247, 245, a touch short on blue, which reads as yellow. The final’s neutrals are true greys.",
  ],
  gave: "What it cost: a palette where every colour has a job leaves almost nothing for decoration. The screen is plainer than my first instinct, which I think is right for a screen that handles money.",
};

export const CURRENCIES: StoryData = {
  body: [
    "When the account list became currency tiles, my first layout was a horizontal row – the obvious arrangement for a set of cards. It looked tidy and it hid things. The fourth tile, euros, ran off the right edge, cut at €6,850.0.",
    "In a single-currency app that’s a scroll hint. In a multi-currency account it means part of someone’s money isn’t on the screen, and a total you can’t check against its parts is a total you can’t trust. So the tiles became a two-by-two grid: four balances, all visible, all the same size, no scrolling.",
  ],
  gave: "What it cost: the grid is taller than the row and pushes Activities down. It holds four comfortably; whether it holds ten is still open.",
};

export const CRAFT: StoryData[] = [
  {
    body: [
      "The flat isometric charts weren’t the brand’s style, so I tried a photographed hand of cash, then settled on glossy 3D imagery: a piggy bank and coins. The header lost its avatar and card icons and kept two things, the logo and the notification bell. And a floating navigation bar replaced the footer, so home, wallets, history and profile are always a tap away.",
    ],
    gave: "What it cost: 3D imagery is slower to make and harder to keep consistent than flat drawings, and every future banner now needs it. The floating bar also sits on top of the banner here – a collision I’ve listed as open rather than pretend it’s solved.",
  },
  {
    title: "The small notes got small, exact answers",
    body: [
      "The action labels are set heavier and more openly spaced. A faint outline on every button became plain fills, with a defined edge only on Add money. The thin grey info icons on the account rows went, and the action icons share one stroke weight. And “Transactions” became “Activities”: a plainer word for a list that mixes a payment, a deposit and a crypto purchase.",
    ],
  },
];

export const DATA: StoryData = {
  body: [
    "Version one’s numbers were placeholders, and they read like it: an £8,080.50 Amazon order, a £12,000 deposit via UPI, and three accounts that didn’t add up to the total above them.",
    "In the final the data is believable and it reconciles. The four tiles – pounds, dollars, crypto and euros – come to about the £24,600 total at current exchange rates. Debits carry a true minus sign, credits a plus and green, so direction reads even without colour. The balance keeps its hide control, for when someone is reading over your shoulder.",
    "None of this is decoration. It’s the first thing a careful user checks, and the first thing a reviewer would.",
  ],
  gave: "What it cost: realistic numbers invite a scrutiny that placeholders don’t. Once the tiles add up, people will check that they do – so they have to, every time the design changes.",
};

/* ---- 13 before and after ---------------------------------------------- */

export const COMPARE_INTRO =
  "The two screens hold nearly the same information. What changed is what the eye does first.";

/* ---- 14 what I learned -------------------------------------------------- */

export const LEARNED_INTRO =
  "Most of what I know about money apps now, I learned by being wrong in front of a reviewer and reading the notes closely. Three things stuck.";
export const LEARNED_SOURCES = todo("apps or sources studied while learning the domain");

export const LEARNED: { title: string; body: string }[] = [
  {
    title: "Adding money is when the product starts.",
    body: "An account with nothing in it hasn’t really begun. That’s why the client made Add money the goal, and why the home screen should be built around it rather than around everything the app can do.",
  },
  {
    title: "Trust is built from small things people can check.",
    body: "Numbers that add up. Signs that don’t depend on colour. A way to hide the balance. People check these, and one wrong number costs more than any amount of polish earns back.",
  },
  {
    title: "Several currencies have to be visible at once.",
    body: "A multi-currency account is one pot of money in several forms. Hiding a currency behind a scroll hides part of the total, so the layout shows all of them, or says plainly that there are more.",
  },
];

/* ---- 15 how I'd know it works ------------------------------------------- */

export const MEASURE_INTRO =
  "Nobody has used this screen; it was submitted, not shipped. So these are thresholds I’d set before any real use, each with what I’d change if it’s missed. Most are measured against version one, because a relative target is the only honest kind I can set without data.";

export const NORTH_STAR = {
  name: "First-session funding rate",
  what: "The share of new users who add money in their first session. It’s the client’s goal written as a number, and it rewards the screen only when the money actually goes in.",
  baseline: "Version one’s layout, in the same test.",
  target: "Higher than version one.",
};

export interface Measure {
  tests: string;
  name: string;
  what: string;
  target: string;
  missed: string;
}

export const MEASURES: Measure[] = [
  {
    tests: "the hierarchy",
    name: "Mis-taps between Add money and Send",
    what: "Send taps that are backed out of within five seconds and followed by an Add money tap.",
    target: "Under 5% of Send taps.",
    missed:
      "The two still look too alike. Move Send and Move out of the card into a row beneath it, so the card holds only money coming in.",
  },
  {
    tests: "the hierarchy",
    name: "Time to the first Add money tap",
    what: "For new users, the median time from the home screen opening to the first tap on Add money.",
    target: "Faster than version one.",
    missed:
      "The black button isn’t enough on its own. Test an empty-account state that replaces the zero balance with a direct prompt to add money.",
  },
  {
    tests: "the redesign as a whole",
    name: "Add money tap-through, A/B",
    what: "The final against version one, shown to new users at random.",
    target: "The final wins.",
    missed:
      "Find out which change didn’t pull its weight by testing them one at a time: hierarchy first, then grouping, then the grid.",
  },
  {
    tests: "the banner (guardrail)",
    name: "Banner taps from unfunded users",
    what: "Taps on the interest banner from people who haven’t added money yet, against their Add money taps. Also read: how often the balance is hidden.",
    target: "Fewer banner taps than Add money taps.",
    missed:
      "The banner is competing with the goal. Hide it until the account has money in it.",
  },
];

/* ---- 16 still open ------------------------------------------------------ */

export const OPEN_INTRO = "Each one with how it would close.";

export const OPEN: { question: string; closes: string }[] = [
  {
    question: "The screen is designed for someone with £24,600. The brief is about someone with nothing.",
    closes:
      "The zero-balance state is the one the goal depends on, and it isn’t designed yet. It’s the next piece of work, and the time-to-first-tap measure above is how I’d judge it.",
  },
  {
    question: "Does the floating navigation hide content on short phones?",
    closes:
      "On this screen it already sits on the banner. A pass on the smallest supported phone, with the bar’s footprint drawn in, decides between padding the content and shrinking the bar.",
  },
  {
    question: "Does the two-by-two grid hold ten currencies?",
    closes:
      "Four fit. Laying the grid out at six, eight and ten decides between growing it and showing four with a “See all”.",
  },
  {
    question: "Where did the reassurance go?",
    closes:
      "Version one said the money was protected. That line dropped off when the floating bar arrived. A short test asking “is your money safe here?”, with and without it, would show whether anyone misses it.",
  },
];

export const CLOSING = "The fastest way to make one action obvious is to make everything else quieter.";

export const NOTE =
  "The client is anonymised and its logo is blurred in every image. The final screen is shown as submitted, including a typo in its balance label.";

/* ---- figures ------------------------------------------------------------ */

export const FIRST_VERSION = {
  image: "fintech-home/first-version" as ImageKey,
  alt: "Version one in three variants on grey: an off-white screen with the blurred logo top right, a balance of £18,920.75, Send as the dark button beside Add money and Move, an account list, transactions, and a green Your returns banner with flat isometric charts and a black Explore button.",
  caption:
    "Version one, three ways. Send carries the dark fill, and the only black button is Explore, at the bottom.",
};

export const PAIRS: Record<"actions" | "tiles" | "banner" | "money", { before: PairShot; after: PairShot; caption: string }> = {
  actions: {
    before: {
      image: "fintech-home/actions-v1" as ImageKey,
      label: "Version one",
      alt: "Version one's balance and actions: £18,920.75 on the background, then three equal buttons with Send filled dark grey.",
    },
    after: {
      image: "fintech-home/actions-final" as ImageKey,
      label: "Final",
      alt: "The final balance card: £24,600.00 above a dashed rule, then a wide black Add money button and two narrower grey buttons, Send and Move.",
    },
    caption: "Before: three equal buttons, Send filled. After: Add money first, widest and black, inside the card with the balance.",
  },
  tiles: {
    before: {
      image: "fintech-home/tiles-row" as ImageKey,
      label: "Iteration 5",
      alt: "A scrolling row of four currency tiles: GBP, USD and crypto in full, and the euro tile cut off at the right edge, reading €6,850.0.",
    },
    after: {
      image: "fintech-home/tiles-grid" as ImageKey,
      label: "Final",
      alt: "A two-by-two grid of currency tiles: GBP £14,260.66, USD $3,200.00, crypto £2,140.40 and EUR €6,850.00, all fully visible.",
    },
    caption: "The row cuts the euro balance at the edge. The grid shows all four.",
  },
  banner: {
    before: {
      image: "fintech-home/banner-v1" as ImageKey,
      label: "Version one",
      alt: "Version one's banner under a Your returns heading: flat isometric candlestick charts and a black Explore button.",
    },
    after: {
      image: "fintech-home/banner-final" as ImageKey,
      label: "Final",
      alt: "The final banner in green: Put your GBP to work, an underlined Explore link, a 3D piggy bank and gold coins, with the floating navigation bar overlapping its lower edge.",
    },
    caption: "Explore goes from a black button to a link, and the imagery from flat isometric to 3D. Note the navigation bar sitting on the banner.",
  },
  money: {
    before: {
      image: "fintech-home/money-v1" as ImageKey,
      label: "Version one",
      alt: "Version one's transactions: Amazon.com minus £8,080.50, a deposit via UPI of plus £12,000.00, and a BTC purchase of minus £180.61, with spaced hyphens as minus signs.",
    },
    after: {
      image: "fintech-home/money-final" as ImageKey,
      label: "Final",
      alt: "The final activities list: Amazon.com −£68.40, a deposit via Airbnb of +£250.00 in green, and a BTC purchase of −£180.61, with true minus signs.",
    },
    caption: "Believable amounts, true minus signs, and a deposit source that belongs in a pounds-and-dollars app.",
  },
};

export const COMPARE = {
  before: {
    image: "fintech-home/v1" as ImageKey,
    alt: "Version one, full screen: off-white background, Send emphasised, an account list, transactions, a returns banner and a line saying the money is protected.",
  },
  after: {
    image: "fintech-home/final" as ImageKey,
    alt: "The final, full screen: sky gradient, a white balance card with a black Add money button, a grid of currency tiles, activities, a green interest banner and a floating navigation bar.",
  },
};
