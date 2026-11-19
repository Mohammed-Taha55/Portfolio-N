import type { ImageKey } from "./images.generated";

/**
 * The seven case studies, in homepage order (from the design-direction
 * frame). Copy rules:
 *  - every claim describes something visible in that project's images;
 *  - no invented metrics, feedback, timelines, tools or results;
 *  - anything only the designer knows is a `todo()` - it renders as a
 *    dashed amber marker in development and is omitted from production
 *    builds (see <Fact />), so a forgotten TODO can never ship.
 */

export interface Todo {
  todo: string;
}
export const todo = (label: string): Todo => ({ todo: label });
export const isTodo = (v: unknown): v is Todo =>
  typeof v === "object" && v !== null && "todo" in v;

export type Kind = "landing" | "dashboard" | "app";
/** original: self-initiated concept. redesign: someone else's live product.
    client: a real brief from a real client. */
export type Origin = "original" | "redesign" | "client";

export interface Shot {
  image: ImageKey;
  alt: string;
  /** zoomed crop: shown on a neutral stage at a smaller size */
  detail?: boolean;
}

export interface Decision extends Shot {
  title: string;
  body: string;
}

export interface CaseStudy {
  slug: string;
  name: string;
  kind: Kind;
  origin: Origin;
  /** h1: what the product is + what I did */
  title: string;
  /** one line under the hero; also the meta description */
  summary: string;
  poster: Shot;
  facts: {
    role: string | Todo;
    tools: string | Todo;
    year: string | Todo;
  };
  /** short labelled paragraphs: what it is, who it's for, the goal... */
  context: { label: string; body: string; bullets?: string[] }[];
  /** redesigns only: visible problems in the live page */
  problems?: { title: string; body: string }[];
  /** redesigns only: the two full pages */
  compare?: { before: Shot; after: Shot };
  /** "Key decisions" for landings, "Close-ups" for dashboards */
  decisions: Decision[];
  next: string[];
  /**
   * Long-form case studies that argue rather than describe have their
   * own route and their own content module, and only appear here so
   * that the homepage grid, the prev/next pagination and the sitemap
   * pick them up. `/work/[slug]` skips them.
   */
  custom?: true;
  /** images to warm on hover when `decisions` isn't the page's image list */
  warm?: ImageKey[];
}

export const KIND_LABEL: Record<Kind, string> = {
  landing: "Landing page",
  dashboard: "Dashboard",
  app: "iOS app",
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  original: "Original",
  redesign: "Redesign",
  client: "Client brief",
};

const facts = () => ({
  role: todo("Role"),
  tools: todo("Tools"),
  year: todo("Year"),
});

export const WORK: CaseStudy[] = [
  {
    slug: "nova",
    name: "NOVA",
    kind: "app",
    origin: "original",
    custom: true,
    title: "NOVA · Designing trust for a voice assistant that acts on your phone",
    summary:
      "NOVA is a concept iOS assistant you talk to. I designed the onboarding and the core loop around one job: proving what it heard before it acts.",
    poster: {
      image: "nova/poster",
      alt: "NOVA brand poster: a glowing pink quatrefoil mark with a white sound waveform inside it, and the NOVA wordmark below, on a soft pink gradient.",
    },
    facts: facts(),
    context: [],
    decisions: [],
    next: [],
    warm: [
      "nova/onboarding",
      "nova/home",
      "nova/listening",
      "nova/heard",
      "nova/chips",
      "nova/plan",
      "nova/working",
      "nova/done",
      "nova/plan-list",
      "nova/replies",
    ],
  },
  {
    slug: "fintech-home",
    name: "Fintech",
    kind: "app",
    origin: "client",
    custom: true,
    title: "Fintech · Designing a money app's home screen around one action",
    summary:
      "My first fintech brief: a money app's home screen rebuilt around one action, Add money, after a reviewer's seven notes. Submitted, not approved.",
    poster: {
      image: "fintech-home/poster",
      alt: "Three stages of a fintech app's home screen on a sky-blue background, ending with a white balance card, a black Add money button and a two-by-two grid of currency tiles. The client's logo is blurred.",
    },
    facts: facts(),
    context: [],
    decisions: [],
    next: [],
    warm: [
      "fintech-home/first-version",
      "fintech-home/iter-1",
      "fintech-home/iter-2",
      "fintech-home/iter-3",
      "fintech-home/iter-4",
      "fintech-home/iter-5",
      "fintech-home/final",
      "fintech-home/actions-v1",
      "fintech-home/actions-final",
      "fintech-home/banner-v1",
      "fintech-home/banner-final",
      "fintech-home/tiles-row",
      "fintech-home/tiles-grid",
      "fintech-home/money-v1",
      "fintech-home/money-final",
      "fintech-home/v1",
    ],
  },
  {
    slug: "umami",
    name: "Umami",
    kind: "landing",
    origin: "redesign",
    title: "Redesigned around the product",
    summary:
      "Umami is open-source, cookie-free web analytics. I redesigned its landing page to put the real dashboard up front and cut every section down to one idea.",
    poster: {
      image: "umami/poster",
      alt: "Umami brand poster: the black and white circular Umami mark beside the umami wordmark, on a vivid blue cloud gradient.",
    },
    facts: facts(),
    context: [
      {
        label: "What it is",
        body: "A privacy-first analytics platform: traffic, campaigns, behaviour, conversions and revenue without cookies. The page has to win over developers who care about privacy and marketers who want answers.",
      },
      {
        label: "What I did",
        body: "Redesigned the full landing page, from hero to footer. Same product, same story, with fewer words and much bigger, clearer product shots.",
      },
    ],
    problems: [
      {
        title: "The product is too small to read",
        body: "The hero dashboard sits small and centred on grey, so the numbers that sell Umami are illegible at first glance.",
      },
      {
        title: "Feature cards that all look the same",
        body: "Acquisition, Behaviour, Conversion and Revenue are four text-only boxes with a tiny icon. Nothing tells you which one matters to you.",
      },
      {
        title: "Long paragraphs in every row",
        body: "Most feature rows carry four to six lines of body copy plus a “Learn how to…” link. Skimming the page means reading it.",
      },
      {
        title: "Flat rhythm, weak ending",
        body: "Every section uses the same layout until a black privacy block cuts in. The final call to action is a single line that’s easy to scroll past.",
      },
    ],
    compare: {
      before: {
        image: "umami/before",
        alt: "The live Umami landing page, full length: centred hero with a small dashboard, text-only feature cards, alternating feature rows with long copy, a black privacy block and a short closing line.",
      },
      after: {
        image: "umami/after",
        alt: "The redesigned Umami landing page, full length: left-aligned hero with a large dashboard, visual feature cards, short feature rows on blue frames, illustrated privacy cards and a full-width blue call to action.",
      },
    },
    decisions: [
      {
        image: "umami/hero-detail",
        detail: true,
        alt: "Close-up of the hero: 38k+ GitHub stars and 28M+ downloads sit directly above the Get started for free button.",
        title: "Proof sits on top of the button",
        body: "People decide whether to click at the moment they look at the button, so the GitHub stars and download count sit directly above it. On the live page they were split between the nav bar and a section near the footer.",
      },
      {
        image: "umami/overview",
        alt: "Four feature cards, each previewing a real report: a world map for Acquisition, a line chart for Behaviour, a page funnel for Conversion and revenue bars for Revenue.",
        title: "Show the report, not an icon",
        body: "Each card previews the actual report it describes, with a one-line label. All four can be understood in a few seconds without reading a sentence.",
      },
      {
        image: "umami/acquisition",
        alt: "Acquisition section: the headline Where your traffic actually comes from, then a row with a two-line description beside a large, cropped dashboard screenshot on a blue gradient frame.",
        title: "Two lines and one big screenshot per row",
        body: "I cut every row to a headline and about two lines, and cropped each screenshot to the part being described. The shared blue frame makes the whole page read as one system.",
      },
      {
        image: "umami/conversion",
        alt: "Conversion section: the headline Where you lose people before they buy above one row, a three-step page funnel beside a two-line description.",
        title: "One example per theme",
        body: "Behaviour, conversion and revenue each get one headline and one concrete example, like this funnel. I dropped the extra rows (journeys, retention, payment integrations, MCP) because every extra row pushes the call to action further down.",
      },
      {
        image: "umami/privacy",
        alt: "Privacy section: three illustrated cards on blue for no cookies, compliance by default and data ownership.",
        title: "Privacy in the same visual language",
        body: "The live page switches to a black block for its most important promise. I kept the page’s light, blue system so trust reads as part of the product, not as an interruption.",
      },
      {
        image: "umami/closing",
        alt: "Closing section: large open-source numbers without boxes, a full-width blue band reading Try Umami Now with one button, and a four-column footer.",
        title: "A closing ask with real weight",
        body: "Open-source numbers lose their boxes and become big type. The final call to action gets a full-width blue band, so the last ask is the loudest thing on the page.",
      },
    ],
    next: [
      "Click-through on “Get started for free” with and without the proof directly above it.",
      "Whether people look for the removed rows: track visits to the journeys and retention pages.",
      "A five-second test of the hero: can people say what Umami does?",
    ],
  },
  {
    slug: "nuvex",
    name: "Nuvex",
    kind: "dashboard",
    origin: "original",
    title: "A crypto portfolio at a glance",
    summary:
      "Nuvex is a crypto portfolio tracker I designed from scratch. The dashboard answers three questions in order: what my holdings are worth, what’s moving, and what just happened.",
    poster: {
      image: "nuvex/poster",
      alt: "Nuvex poster: the dark crypto portfolio dashboard floating on a pale blue cloud gradient, showing total portfolio value, 24-hour change, total earnings and a purple performance chart.",
    },
    facts: facts(),
    context: [
      {
        label: "What it’s for",
        body: "Tracking a crypto portfolio across networks: total value, daily change, earnings, every holding, and recent swaps, transfers and staking.",
      },
      {
        label: "Who uses it",
        body: "People holding a handful of tokens who check in daily. They want their total and anything unusual first, and the details only when they go looking.",
      },
    ],
    decisions: [
      {
        image: "nuvex/totals",
        alt: "Close-up: the sidebar navigation beside the Total portfolio value and 24h change cards and the top of the performance chart.",
        title: "Totals first, always with context",
        body: "The three totals lead the page in large type, and each one carries its period and its change right underneath, so no number ever appears on its own. The sidebar stays quiet in grey, with one highlighted item.",
      },
      {
        image: "nuvex/movers",
        alt: "Close-up: Top movers list with Trending, Gainers and Losers tabs, each row showing a token icon, name, ticker, price and a coloured change pill.",
        title: "A market list built for scanning",
        body: "One row per token: icon, name, ticker, price, change. Changes keep their + or − sign inside the green or red pill, so they still read without colour. Tabs filter the same list instead of adding three more panels.",
      },
      {
        image: "nuvex/assets",
        alt: "Close-up: Your assets table with balance, price and 24h change columns, and the Upgrade to Pro card at the bottom of the sidebar.",
        title: "A table you read left to right",
        body: "Columns run from what you hold to what it’s worth, ending in a 7-day sparkline so the trend shows without opening a token. The upgrade prompt lives at the foot of the sidebar, away from the data.",
      },
    ],
    next: [
      "Whether “Total earnings” is understood the same way by everyone: realised or unrealised?",
      "How people find one token: the search bar or scrolling the assets table.",
      "Contrast of the smallest grey labels on the dark surface, measured, not eyeballed.",
    ],
  },
  {
    slug: "see-io",
    name: "See.io",
    kind: "landing",
    origin: "redesign",
    title: "Redesigned around one prompt",
    summary:
      "See.io turns a sentence into a live website. I redesigned its landing page so the first thing you see is the thing you do: type your idea.",
    poster: {
      image: "see-io/poster",
      alt: "See.io poster: the headline Turn an idea into a live website, with live website in purple, above a prompt box reading A menu and hours for my ramen bar and three example chips, on a dark purple-hazed background.",
    },
    facts: facts(),
    context: [
      {
        label: "What it is",
        body: "An AI website builder: describe the site you want and it designs, builds and publishes it, with every change saved as a version.",
      },
      {
        label: "What I did",
        body: "Redesigned the landing page end to end. The live hero crammed the prompt, chips, a large button, steps and a preview into one screen; I gave each its own section and left the hero one job.",
      },
    ],
    problems: [
      {
        title: "A headline you can’t read",
        body: "“see your portfolio live” is set with overlapping, scrambled letters, so the one line that should carry the promise reads as noise.",
      },
      {
        title: "Everything in the first screen",
        body: "Prompt, four suggestion chips, a full-width gradient button, three steps and a product preview all compete before you scroll.",
      },
      {
        title: "Proof that’s too dim to prove anything",
        body: "Example sites are small, dark thumbnails, and much of the supporting copy is small grey text on near-black.",
      },
      {
        title: "Dense pricing and FAQ",
        body: "Pricing is a paragraph beside a split panel, and the FAQ is a two-column grid of eight questions that’s hard to read in order.",
      },
    ],
    compare: {
      before: {
        image: "see-io/before",
        alt: "The live See.io landing page, full length: animated headline, prompt with chips and a large gradient button, a preview window, small example thumbnails, a pricing paragraph and a two-column FAQ.",
      },
      after: {
        image: "see-io/after",
        alt: "The redesigned See.io landing page, full length: centred headline with a single prompt box, a three-step section, a browser-frame showcase, three feature cards, one pricing card, a single-column FAQ and a closing prompt box.",
      },
    },
    decisions: [
      {
        image: "see-io/hero-detail",
        detail: true,
        alt: "Close-up of the hero: the headline, a short subline, a prompt box with a purple send button inside it, and three example chips attached underneath.",
        title: "One input, one action",
        body: "The send button lives inside the prompt and three example chips hang off it, so there’s no separate button to hunt for and no blank-page problem. Purple lands only on “live website”, the promise.",
      },
      {
        image: "see-io/hero-iteration",
        alt: "An earlier hero direction: the same headline over a purple glow, with an empty prompt box and a text-only example underneath.",
        title: "The direction I moved away from",
        body: "An earlier version used a purple glow and an empty prompt with a text example. I chose clickable chips over the text example because a chip is one click to try, and the circuit lines hint at “building” without glowing over the input.",
      },
      {
        image: "see-io/steps",
        alt: "From idea to live website in minutes: three cards numbered 1 to 3, Describe your idea, Watch it come to life and Go live, each with a small UI illustration.",
        title: "Three steps, three pictures",
        body: "The steps moved out of the hero into their own section. Each gets a small illustration of the actual moment, and a numbered badge so the order is obvious at a glance.",
      },
      {
        image: "see-io/features",
        alt: "Three feature cards: Chat edits real code with a chat input, See changes go live with a Deploying tag, and Nothing you can’t undo with a version history list.",
        title: "Features shown as product moments",
        body: "Each card illustrates the claim it makes: the chat box, the deploy tag, the version history. The headline sets a grey first line against a white second line, a pattern repeated on every section.",
      },
      {
        image: "see-io/pricing",
        alt: "Pricing: one card with what you get on the left and $9.99/MO, no card required, cancel anytime and a Build my site button on the right.",
        title: "Pricing as one card",
        body: "What you get on the left, the price and the button on the right, with two worries (a card up front, cancelling) answered under the price. The page then closes with the same prompt box as the hero, so the last action is the first one you learned.",
      },
    ],
    next: [
      "Prompt submissions with the example chips against an empty prompt.",
      "Whether the showcase carousel gets clicked, or a static grid of examples does better.",
      "Which FAQ items get opened, to decide what should move into the page itself.",
    ],
  },
  {
    slug: "novq",
    name: "Novq",
    kind: "landing",
    origin: "original",
    title: "AI agents, made concrete",
    summary:
      "Novq is an original landing page I designed for a platform where AI agents research, decide and execute work for a team. One illustration style carries the whole page.",
    poster: {
      image: "novq/poster",
      alt: "Novq brand poster: the blue rounded-square N mark beside the NOVQ wordmark, over faint grey isometric line art.",
    },
    facts: facts(),
    context: [
      {
        label: "Goal",
        body: "Make an abstract product, AI agents doing real work, feel concrete and safe within one scroll.",
      },
      {
        label: "Audience",
        body: "Team leads and operators at growing companies. They are curious about automation but worried about control, security and setup effort, so the page answers those three.",
      },
      {
        label: "Approach",
        body: "Three rules for every section:",
        bullets: [
          "One illustration language: grey isometric line art with a single soft blue.",
          "Visible structure: thin vertical rails and dividers, like a blueprint.",
          "Every claim gets a picture or a number next to it.",
        ],
      },
    ],
    decisions: [
      {
        image: "novq/hero-detail",
        detail: true,
        alt: "Close-up of the hero copy: a small 12.4 mil+ tasks automated label, the two-line headline, a short subline, Get Started and Book a call buttons, avatars and a five-star rating.",
        title: "Say the job, then lower the risk",
        body: "The headline names the outcome in plain words. A low-commitment “Book a call” sits beside “Get Started”, and avatars with a 5/5 rating answer “does this work?” before the first scroll.",
      },
      {
        image: "novq/stats",
        alt: "Built to do the work, proven to deliver: four stats with illustrations, 12.4M+ tasks automated, 48K+ hours saved, 98.7% task success rate and 24/7 agent availability.",
        title: "Proof comes second, not last",
        body: "Right after the hero, four numbers each get an illustration, a label and one line. A “Verify numbers” button sits beside them, so the claims don’t ask for blind trust.",
      },
      {
        image: "novq/features",
        alt: "Everything you need to move faster: a bento of five illustrated cards, Smart Automation, Always On and Secure by Design on top, Seamless Integrations and Scales With You below.",
        title: "A bento instead of a list",
        body: "Three cards on top and two wide ones below break the grid so it doesn’t read as a uniform list. Each illustration is the idea itself: a conveyor for automation, a vault for security.",
      },
      {
        image: "novq/how-it-works",
        alt: "How it works: Connect, Configure and Automate, each a single word with one short line and an isometric illustration, including a settings checklist.",
        title: "Setup in three verbs",
        body: "Connect, Configure, Automate: one word, one line and one picture per step, so setup looks as small as it is. The settings checklist shows that you decide what the agents may touch.",
      },
      {
        image: "novq/faq",
        alt: "Frequently asked questions: a large isometric question mark on the left and an accordion of seven questions on the right, the first one open.",
        title: "An FAQ that shows how it works",
        body: "The first answer is open by default, so it’s obvious every row expands. The questions follow the audience’s worries in order: getting started, skills needed, tools, data security, plans.",
      },
      {
        image: "novq/closing",
        alt: "Closing: Ready to work faster and smarter, framed by soft blue rings, then a footer with a newsletter field, link columns and an oversized NOVQ wordmark.",
        title: "End on the brand",
        body: "The final call to action repeats the hero’s two buttons inside soft rings. The footer ends with an oversized NOVQ wordmark, so the name is the last thing on screen.",
      },
    ],
    next: [
      "The angled “Why choose us?” list against a flat list: tilted text may be harder to read.",
      "Whether “Book a call” pulls clicks away from “Get Started” or adds new ones.",
      "Contrast of white text on the light-blue primary button.",
    ],
  },
  {
    slug: "opsec",
    name: "Opsec",
    kind: "dashboard",
    origin: "original",
    title: "Calm on-chain analytics",
    summary:
      "Opsec is a blockchain analytics dashboard I designed. The overview brings value locked, active wallets, volume and transactions across networks into one calm, light screen.",
    poster: {
      image: "opsec/poster",
      alt: "Opsec poster: the light blockchain analytics dashboard floating on a coral cloud gradient, showing total value locked, daily active wallets and an on-chain activity chart.",
    },
    facts: facts(),
    context: [
      {
        label: "What it’s for",
        body: "A real-time picture of activity across major blockchains: value locked, wallets, volume, transactions and gas, plus the protocols and assets driving them.",
      },
      {
        label: "Who uses it",
        body: "Analysts and traders who need the state of the market across several chains before digging into a single protocol or token.",
      },
    ],
    decisions: [
      {
        image: "opsec/kpis",
        alt: "Close-up: sidebar with Overview selected and a watchlist of chains, beside Total Value Locked and Daily Active Wallets cards with large values and change badges.",
        title: "Label above, value inside",
        body: "Each KPI card has a label row with an icon and an info tooltip, and an inset panel for the number and its change, so the label and the value never blur together. The chart legend pairs each line’s colour with its current value.",
      },
      {
        image: "opsec/protocols",
        alt: "Close-up: Top Protocols table with rank, protocol, TVL and 24h change, and the Upgrade to Pro card in the sidebar.",
        title: "Rankings with a direction you can see",
        body: "Top Protocols is numbered, so it reads as a ranking. Every change has a triangle as well as a colour, which keeps up and down clear for colour-blind users.",
      },
      {
        image: "opsec/assets",
        alt: "Close-up: Top assets by activity table and the Gas Fees panel with an ETH selector and a pink area chart.",
        title: "Every panel names its scope",
        body: "Each title has a one-line subtitle, such as “By on-chain volume in the last 30 days”, so a number is never shown without its timeframe. The gas panel gets its own network selector instead of following the global filter.",
      },
    ],
    next: [
      "Dual-axis charts are easy to misread: test gas fees as its own small chart.",
      "Whether the global “Last 30 days” filter is noticed when panels carry their own scopes.",
      "Which sidebar watchlist chains people pin, to decide the defaults.",
    ],
  },
  {
    slug: "takeuforward",
    name: "takeUforward",
    kind: "landing",
    origin: "redesign",
    title: "Show the platform first",
    summary:
      "takeUforward helps engineers prepare for tech interviews with DSA, core CS and system design. I redesigned its landing page to lead with the real product and a clear path.",
    poster: {
      image: "takeuforward/poster",
      alt: "takeUforward brand poster: the white arrow mark beside the takeUforward wordmark with a blue U, on black with a soft blue glow.",
    },
    facts: facts(),
    context: [
      {
        label: "What it is",
        body: "An interview-prep platform: structured roadmaps, practice problems, a daily planner and AI help, built around a large YouTube community.",
      },
      {
        label: "What I did",
        body: "Redesigned the landing page from top to bottom: a product-first hero, a problem section, colour-coded subjects, a testimonial wall, the founder’s story and a simpler ending.",
      },
    ],
    problems: [
      {
        title: "The hero shows one widget, not the platform",
        body: "A small planner card stands in for the whole product, so visitors meet a single feature before they know what takeUforward is.",
      },
      {
        title: "Proof floats in empty space",
        body: "The learner count and the YouTube and LinkedIn numbers sit in a block of their own with a lot of dead space around them.",
      },
      {
        title: "The overview hides behind tabs",
        body: "Nine pill tabs sit above a mostly empty panel, so you have to click before you learn anything.",
      },
      {
        title: "A heavy ending",
        body: "A callback form, the FAQ and a footer with a giant faded wordmark all compete with the final call to action.",
      },
    ],
    compare: {
      before: {
        image: "takeuforward/before",
        alt: "The live takeUforward landing page, full length: hero with a planner widget, a community stats block, a tabbed platform overview, testimonials, a callback form, an FAQ and a footer with a faded wordmark.",
      },
      after: {
        image: "takeuforward/after",
        alt: "The redesigned takeUforward landing page, full length: hero with the full dashboard, a stats band and logos, a problem section, colour-coded subject cards, a product tour, the founder block, a testimonial wall, the FAQ and a blue closing card.",
      },
    },
    decisions: [
      {
        image: "takeuforward/hero-detail",
        detail: true,
        alt: "Close-up of the hero copy: the headline One stop platform to conquer tech interview, a one-line subline and two buttons, Start Preparing Free in blue and Explore TUF+ in grey.",
        title: "Lead with the whole product",
        body: "Headline, one subline and two buttons, then the real dashboard right underneath: sidebar, daily plan and progress. Visitors see the platform before they read about it.",
      },
      {
        image: "takeuforward/problem",
        alt: "Stop figuring out what to study next: three illustrated problem cards, Scattered resources, No clear roadmap and Interview preparation is not just DSA.",
        title: "Name the problem first",
        body: "Three illustrated pains describe the reader’s situation (scattered resources, no roadmap, more than DSA) before the page pitches the fix. People keep reading when they recognise themselves.",
      },
      {
        image: "takeuforward/subjects",
        alt: "Every part of your preparation in just one platform: six subject cards in two rows, each with its own colour, DSA, Core CS, System Design, Data Engineering, Aptitude and Interview Preparation.",
        title: "One colour per track",
        body: "Six subjects get six colours on each card’s edge, so every track is recognisable before you read its title, and the grid reads as six choices rather than one wall of text.",
      },
      {
        image: "takeuforward/testimonials",
        alt: "Trusted by thousands of engineers: two offset rows of testimonial cards that fade out at the edges, each with a name, role, quote and company logo, and a Hall of fame button.",
        title: "A wall, not a carousel",
        body: "Two offset rows that fade at the edges show the volume of reviews at a glance. Each card carries a name, role and company logo, so the quote is attributable.",
      },
      {
        image: "takeuforward/founder",
        alt: "Built by engineers who understand the interview grind: a bento with the founder’s name and story, his photo, and cards for 1M+ subscribers, 200k+ members, 500k+ connections and 250k+ followers.",
        title: "Put a face on it",
        body: "The founder’s story and his community numbers sit together in one bento, replacing the scattered stats block. The proof now has a person behind it.",
      },
      {
        image: "takeuforward/closing",
        alt: "Closing: a blue card reading Your next interview starts with what you do today with the same two buttons as the hero, above a four-column footer and coloured social icons.",
        title: "One ask to finish",
        body: "The callback form is gone and the ending is one blue card with the same two buttons as the hero. The footer is regrouped into four clear columns.",
      },
    ],
    next: [
      "Hero: a static dashboard screenshot against a short product video.",
      "Whether the colour-coded subject cards help people reach their track faster.",
      "Lead volume after removing the callback form: watch Contact Us clicks.",
    ],
  },
  {
    slug: "rungtm",
    name: "RunGTM",
    kind: "dashboard",
    origin: "original",
    title: "Outbound as a to-do list",
    summary:
      "RunGTM finds buyers from intent signals and runs outreach across LinkedIn, X and email. I designed the overview to show what’s working and what needs you today.",
    poster: {
      image: "rungtm/poster",
      alt: "RunGTM poster: the outbound dashboard floating on a lavender cloud gradient, showing buyers found, contracted and replies above a lead conversion funnel.",
    },
    facts: facts(),
    context: [
      {
        label: "What it’s for",
        body: "Running outbound: finding buyers from signals, launching plays across channels, and tracking replies and qualified leads.",
      },
      {
        label: "Who uses it",
        body: "Founders and small growth teams who open it to check pipeline health and clear whatever is waiting on them.",
      },
    ],
    decisions: [
      {
        image: "rungtm/overview",
        alt: "Close-up: sidebar with workspace switcher, the greeting Good evening, Negativ, KPI cards for buyers found and contacted, and the lead conversion funnel with counts and descriptions.",
        title: "Numbers in funnel order",
        body: "The KPIs follow the funnel: buyers found, contacted, replies, qualified. Each funnel stage shows its count and percentage on one side and a plain-language description on the other, so the chart explains itself.",
      },
      {
        image: "rungtm/attention",
        alt: "Close-up: the Needs your attention panel with 12 replies waiting, 3 plays need approval and 8 high-intent buyers, beside channel performance bars labelled with channel logos.",
        title: "A to-do list where the eye lands",
        body: "“Needs your attention” sits top right, the first place you look after the totals. Each item leads with a count and ends in a chevron. Channel bars use each channel’s logo instead of a separate legend.",
      },
      {
        image: "rungtm/channels",
        alt: "Close-up: Connected channels with LinkedIn, X and Email each marked Connected, the orange Use RunGTM with AI agents card, and a top opportunity row for Vercel.",
        title: "Status you can trust at a glance",
        body: "Each connected channel shows the account it uses and a green dot with the word “Connected”, never colour alone. The orange AI-agents card is the only saturated block in the rail, set apart at the foot so it never competes with the data.",
      },
    ],
    next: [
      "First click after login: does “Needs your attention” get used first?",
      "The daily line chart is dense with three noisy series; test a weekly default.",
      "Whether high and medium intent tags change which opportunity people open.",
    ],
  },
];

export const getCase = (slug: string): CaseStudy | undefined =>
  WORK.find((c) => c.slug === slug);

/** Wraps around, so every case study has both neighbours. */
export const neighbours = (slug: string) => {
  const i = WORK.findIndex((c) => c.slug === slug);
  const n = WORK.length;
  return {
    prev: WORK[(i - 1 + n) % n],
    next: WORK[(i + 1) % n],
    index: i,
    total: n,
  };
};
