"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowsDownUpIcon,
  BankIcon,
  CaretDownIcon,
  CheckIcon,
  CircleNotchIcon,
  InfoIcon,
} from "@phosphor-icons/react";

/* ------------------------------------------------------------------ */
/*  Swap / Buy / Stake - pixel-faithful rebuild of the two frames.     */
/*  Exact spec: 14px everywhere, 48px amounts, 16px chips, 20px CTA.   */
/*  Light only (the site ships no dark mode): bg #FFFFFF, border        */
/*  #E0E0E0, card #EFEFEF, CTA #80AFFF / border #4587F6, muted #ACACAC,  */
/*  labels #555555, numbers near-black. Buy = fiat on-ramp (Uniswap-    */
/*  style providers), Stake = ETH yield with duration + validator.      */
/*  ETH yield with duration + validator. Motion per Emil: strong        */
/*  springs for spatial moves, fast ease-out + blur for text, press    */
/*  scale, enter-from-0.9, interruptible tweens.                        */
/* ------------------------------------------------------------------ */

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const FAST_TWEEN = { duration: 0.18, ease: EASE_OUT } as const;
const STRONG_SPRING = {
  type: "spring",
  visualDuration: 0.5,
  bounce: 0.32,
} as const;
/* tab pill: same spring language but a much quicker settle - hopping
   Swap → Buy must feel instant, never floaty */
const TAB_SPRING = {
  type: "spring",
  visualDuration: 0.28,
  bounce: 0.16,
} as const;
const PANEL_SPRING = {
  type: "spring",
  visualDuration: 0.42,
  bounce: 0.22,
} as const;

type Tab = "Swap" | "Buy" | "Stake";
type Phase = "idle" | "swapping";

interface Token {
  sym: string;
  name: string;
  price: number;
  balance: number;
  chain: string;
  chainGlyph: string;
  chainColor: string;
  addr: string;
}

const TOKENS: Token[] = [
  {
    sym: "USDT",
    name: "Tether USD",
    price: 1,
    balance: 69.69,
    chain: "Tron",
    chainGlyph: "T",
    chainColor: "#EB0029",
    addr: "0xdAC1…1ec7",
  },
  {
    sym: "ETH",
    name: "Ethereum",
    price: 3542.1,
    balance: 0,
    chain: "Ethereum",
    chainGlyph: "E",
    chainColor: "#627EEA",
    addr: "Native",
  },
  {
    sym: "USDC",
    name: "USD Coin",
    price: 1,
    balance: 1280.4,
    chain: "Base",
    chainGlyph: "B",
    chainColor: "#0052FF",
    addr: "0xA0b8…eB48",
  },
  {
    sym: "BTC",
    name: "Bitcoin",
    price: 97842.5,
    balance: 0.084,
    chain: "Bitcoin",
    chainGlyph: "B",
    chainColor: "#F7931A",
    addr: "Native",
  },
];

const FIATS = [
  { sym: "USD", name: "US dollar" },
  { sym: "EUR", name: "Euro" },
  { sym: "GBP", name: "British pound" },
] as const;

const PROVIDERS = [
  { id: "moonpay", name: "MoonPay", fee: "2.1% fee", note: "Card · instant" },
  {
    id: "robinhood",
    name: "Robinhood",
    fee: "1.5% fee",
    note: "Connect · instant",
  },
  { id: "transak", name: "Transak", fee: "1.9% fee", note: "Bank · 10 min" },
] as const;

const VALIDATORS = [
  { id: "figment", name: "Figment", fee: "0% fee" },
  { id: "lido", name: "Lido", fee: "10% fee" },
  { id: "rocket", name: "Rocket Pool", fee: "14% fee" },
] as const;

const DURATIONS = [30, 60, 90] as const;
const APY = 4.2;

function fmtUsd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* sub-label money: whole dollars render without decimals ("$69"),
   cents render with two ("$68.99") - exactly like the frames */
function fmtSub(n: number) {
  if (n <= 0) return "$0.00";
  return Number.isInteger(Math.round(n * 100) / 100) && n >= 1
    ? `$${Math.round(n).toLocaleString("en-US")}`
    : fmtUsd(n);
}

/* real coin artwork, inlined from the provided crypto-logo set:
   ETH = multicolor diamond, USDT = teal T, USDC = blue $, BTC = ₿ */
function CoinArt({ sym, size = 22 }: { sym: string; size?: number }) {
  if (sym === "ETH") {
    const h = size;
    const w = Math.max(1, Math.round((size * 12) / 18));
    return (
      <svg width={w} height={h} viewBox="0 0 12 18" fill="none" aria-hidden>
        <path d="M5.625 0V6.65L11.25 9.166L5.625 0Z" fill="#8FFCF3" />
        <path d="M5.625 0L0 9.166L5.625 6.651V0Z" fill="#CABCF8" />
        <path
          d="M5.625 13.4807V18.0028L11.25 10.2188L5.625 13.4807Z"
          fill="#CBA7F5"
        />
        <path
          d="M5.625 18.0037V13.4807L0 10.2188L5.625 18.0037Z"
          fill="#74A0F3"
        />
        <path
          d="M5.625 12.4284L11.25 9.16544L5.625 6.64844V12.4284Z"
          fill="#CBA7F5"
        />
        <path d="M0 9.16444L5.625 12.4264V6.64844L0 9.16444Z" fill="#74A0F3" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.625 12.429L0 9.166L5.625 0L11.25 9.166L5.625 12.429ZM0.374 8.9L5.534 0.49V6.605L0.374 8.9ZM0.297 9.13L5.535 6.803V12.167L0.297 9.13ZM5.715 6.803V12.167L10.948 9.129L5.715 6.803ZM5.715 6.605L10.875 8.9L5.715 0.49V6.605Z"
          fill="#202699"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.625 13.4069L0 10.2109L5.625 18.0009L11.25 10.2109L5.625 13.4069ZM0.63 10.7739L5.535 13.5639V17.5689L0.63 10.7739ZM5.715 13.5639V17.5689L10.62 10.7739L5.715 13.5639Z"
          fill="#202699"
        />
      </svg>
    );
  }
  if (sym === "USDT") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z"
          fill="#26A17B"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.96139 8.69216V8.69116C8.90639 8.69516 8.62289 8.71216 7.99039 8.71216C7.48539 8.71216 7.12989 8.69716 7.00489 8.69116V8.69266C5.06089 8.60716 3.60989 8.26866 3.60989 7.86366C3.60989 7.45866 5.06089 7.12066 7.00489 7.03366V8.35566C7.13189 8.36466 7.49589 8.38616 7.99889 8.38616C8.60239 8.38616 8.90489 8.36116 8.96139 8.35616V7.03466C10.9014 7.12116 12.3489 7.45966 12.3489 7.86366C12.3489 8.26866 10.9014 8.60616 8.96139 8.69216ZM8.96139 6.89716V5.71416H11.6684V3.91016H4.29789V5.71416H7.00489V6.89666C4.80489 6.99766 3.15039 7.43366 3.15039 7.95566C3.15039 8.47766 4.80489 8.91316 7.00489 9.01466V12.8057H8.96139V9.01366C11.1579 8.91266 12.8084 8.47716 12.8084 7.95566C12.8084 7.43416 11.1579 6.99866 8.96139 6.89716Z"
          fill="white"
        />
      </svg>
    );
  }
  if (sym === "BTC") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M15.7592 9.93533C14.6904 14.2197 10.3498 16.8291 6.06231 15.7603C1.78106 14.6916 -0.828314 10.351 0.240436 6.06658C1.30919 1.77908 5.64981 -0.827166 9.93419 0.241584C14.2186 1.31033 16.8279 5.65096 15.7592 9.93533Z"
          fill="#F7931A"
        />
        <path
          d="M11.5279 6.85898C11.6873 5.79336 10.8779 5.22148 9.76855 4.84023L10.1279 3.39961L9.2498 3.18086L8.8998 4.58398C8.66855 4.52773 8.43105 4.47148 8.19668 4.41836L8.5498 3.00586L7.67168 2.78711L7.3123 4.22773C7.12168 4.18398 6.93418 4.14023 6.75293 4.09648V4.09336L5.54355 3.79023L5.30918 4.72773C5.30918 4.72773 5.95918 4.87773 5.94668 4.88711C6.30293 4.97461 6.36543 5.21211 6.35605 5.39648L5.94668 7.04023C5.97168 7.04648 6.00293 7.05586 6.0373 7.06836C6.00918 7.06211 5.97793 7.05273 5.94355 7.04648L5.36855 9.34648C5.3248 9.45586 5.21543 9.61523 4.96543 9.55586C4.9748 9.56836 4.32793 9.39648 4.32793 9.39648L3.89355 10.4027L5.0373 10.6871C5.2498 10.7402 5.45918 10.7965 5.6623 10.8496L5.2998 12.309L6.17793 12.5277L6.5373 11.084C6.77793 11.1496 7.00918 11.209 7.2373 11.2652L6.87793 12.7027L7.75605 12.9215L8.11855 11.4652C9.61543 11.7496 10.7404 11.634 11.2154 10.2809C11.5967 9.19023 11.1967 8.56211 10.4092 8.15273C10.9811 8.01523 11.4123 7.64023 11.5279 6.85898ZM9.52168 9.67148C9.2498 10.7621 7.41543 10.1715 6.82168 10.0246L7.30293 8.09336C7.89668 8.24023 9.80605 8.53398 9.52168 9.67148ZM9.79355 6.84336C9.54668 7.83398 8.01855 7.33086 7.52168 7.20898L7.95918 5.45586C8.45605 5.58086 10.0498 5.80898 9.79355 6.84336Z"
          fill="white"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 16C12.4356 16 16 12.4356 16 8C16 3.56444 12.4356 0 8 0C3.56444 0 0 3.56444 0 8C0 12.4356 3.56444 16 8 16ZM10.2 9.264C10.2 8.09956 9.50044 7.69956 8.10044 7.53422C7.10044 7.39911 6.90044 7.13422 6.90044 6.66489C6.90044 6.2 7.23556 5.90044 7.90044 5.90044C8.50044 5.90044 8.83556 6.09956 9 6.6C9.03556 6.69956 9.13511 6.76444 9.23556 6.76444H9.76533C9.79604 6.76541 9.82661 6.76014 9.85523 6.74897C9.88384 6.7378 9.9099 6.72095 9.93182 6.69944C9.95375 6.67793 9.97109 6.6522 9.98281 6.6238C9.99453 6.59541 10.0004 6.56494 10 6.53422V6.49956C9.86489 5.76444 9.26489 5.06489 8.50044 5V4.26489C8.50044 4.12978 8.4 4.02933 8.23556 4H7.79556C7.66044 4 7.53511 4.09956 7.50044 4.26489V5C6.50044 5.13422 5.83556 5.89956 5.83556 6.73422C5.83556 7.83467 6.50044 8.26489 7.90044 8.43467C8.83556 8.59911 9.136 8.79911 9.136 9.33422C9.136 9.86489 8.66489 10.2347 8.03556 10.2347C7.16444 10.2347 6.86578 9.86489 6.76533 9.36444C6.73511 9.23467 6.63556 9.16444 6.53511 9.16444H5.96533C5.93462 9.16407 5.90415 9.16992 5.87575 9.18163C5.84736 9.19335 5.82163 9.2107 5.80012 9.23262C5.77861 9.25455 5.76176 9.2806 5.75058 9.30922C5.73941 9.33783 5.73415 9.36841 5.73511 9.39911V9.43467C5.86489 10.2649 6.4 10.8347 7.50044 10.9991V11.7396C7.50044 11.8747 7.6 11.9644 7.76533 12H8.24533C8.37511 12 8.46578 11.9093 8.50044 11.7396V10.9991C9.50044 10.8347 10.2 10.1644 10.2 9.264ZM4.63378 11.7556C5.11746 12.1983 5.68386 12.5412 6.30044 12.7644C6.4 12.8347 6.50044 12.9644 6.50044 13.0649V13.5342C6.50044 13.5991 6.50044 13.6347 6.46489 13.664C6.43556 13.7991 6.30044 13.864 6.16533 13.7991C4.95256 13.4124 3.89416 12.6501 3.14311 11.6224C2.39207 10.5947 1.98729 9.3547 1.98729 8.08178C1.98729 6.80885 2.39207 5.56891 3.14311 4.54116C3.89416 3.51341 4.95256 2.75111 6.16533 2.36444C6.20089 2.33422 6.26489 2.33422 6.30044 2.33422C6.43556 2.36444 6.50044 2.46489 6.50044 2.59911V3.06489C6.50044 3.23378 6.43556 3.33422 6.30044 3.39911C5.61869 3.6452 4.99953 4.03849 4.48701 4.55101C3.97449 5.06353 3.5812 5.68269 3.33511 6.36444C2.99114 7.29028 2.93088 8.29763 3.16203 9.25787C3.39319 10.2181 3.90527 11.0877 4.63289 11.7556M9.53422 2.49956C9.56444 2.36444 9.69956 2.29956 9.83467 2.36444C10.7513 2.662 11.5835 3.17441 12.2618 3.85894C12.9402 4.54347 13.445 5.38027 13.7342 6.29956C14.7342 9.464 12.9991 12.8347 9.83467 13.8347C9.79911 13.864 9.73422 13.864 9.69956 13.864C9.56444 13.8347 9.49956 13.7342 9.49956 13.5991V13.1342C9.49956 12.9644 9.56444 12.8649 9.69956 12.7991C10.3811 12.553 11 12.1598 11.5123 11.6474C12.0247 11.1351 12.4179 10.5162 12.664 9.83467C12.8927 9.22004 12.9974 8.56618 12.972 7.91086C12.9466 7.25555 12.7916 6.61176 12.516 6.01669C12.2403 5.42161 11.8495 4.88705 11.3661 4.44387C10.8827 4.0007 10.3163 3.65769 9.69956 3.43467C9.59911 3.36444 9.49956 3.23467 9.49956 3.09956V2.63467C9.49956 2.56444 9.49956 2.53422 9.53511 2.49956"
        fill="#2775CA"
      />
    </svg>
  );
}

/* token logo with an optional Uniswap-style network badge tucked at the
   bottom-left, ringed to match whatever surface it sits on */
function TokenLogo({
  sym,
  size = 22,
  badge = false,
  badgeRing = "#FFFFFF",
}: {
  sym: string;
  size?: number;
  badge?: boolean;
  badgeRing?: string;
}) {
  const t = TOKENS.find((x) => x.sym === sym) ?? TOKENS[0];
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <CoinArt sym={sym} size={size} />
      {badge && (
        <span
          className="absolute flex items-center justify-center rounded-full font-bold text-white"
          style={{
            width: 14,
            height: 14,
            fontSize: 8,
            left: -4,
            bottom: -4,
            background: t.chainColor,
            border: `2px solid ${badgeRing}`,
          }}
        >
          {t.chainGlyph}
        </span>
      )}
    </span>
  );
}

export default function SwapCardDemo() {
  const reduce = useReducedMotion();
  const springTab = reduce ? FAST_TWEEN : STRONG_SPRING;
  const springPanel = reduce ? FAST_TWEEN : PANEL_SPRING;
  const springPill = reduce ? FAST_TWEEN : TAB_SPRING;

  const [tab, setTab] = useState<Tab>("Swap");

  /* shared swap state */
  const [paySym, setPaySym] = useState("USDT");
  const [recSym, setRecSym] = useState("ETH");
  const [pay, setPay] = useState("69");
  const [menu, setMenu] = useState<"pay" | "rec" | null>(null);
  /* boolean orientation - exactly a 180° turn per flip, and re-entering
     the tab remounts at the same angle instead of spinning 0 → 720° */
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* pending action timers die with the component - no setState on an
     unmounted demo when switching lab routes mid-swap */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /* buy state */
  const [fiatSym, setFiatSym] = useState<string>("USD");
  const [fiatAmt, setFiatAmt] = useState("120");
  const [buyToken, setBuyToken] = useState("ETH");
  const [fiatMenu, setFiatMenu] = useState(false);
  const [buyMenu, setBuyMenu] = useState(false);
  const [buyFlipped, setBuyFlipped] = useState(false);
  const [providerId, setProviderId] = useState<string>("moonpay");
  const [providerOpen, setProviderOpen] = useState(false);

  /* stake state */
  const [stakeAmt, setStakeAmt] = useState("1.25");
  const [stakeSym, setStakeSym] = useState("ETH");
  const [stakeMenu, setStakeMenu] = useState(false);
  const [duration, setDuration] = useState<number>(30);
  const [validatorId, setValidatorId] = useState<string>("figment");
  const [validatorOpen, setValidatorOpen] = useState(false);

  /* palette - light only, matching the light-mode site */
  const pal = {
    stage: "#FFFFFF",
    card: "#EFEFEF",
    border: "#E0E0E0",
    background: "#fafcfd",
    label: "#555555",
    muted: "#ACACAC",
    number: "#0B0B0B",
    chipText: "#111111",
    tabIdle: "#555555",
    ctaFill: "#80AFFF",
    ctaBorder: "#4587F6",
  };
  const chipFill = "#FFFFFF";

  /* shared card surface - the swap cards' inset ring + padding, reused
     by every buy/stake card so all three tabs ride one surface */
  const CARD_CLASS = "rounded-4xl px-4 py-3 [corner-shape:squircle] mt-1";
  const cardRing =
    "inset 0 0 0 1px #E0E0E0, inset 0 0 0 2px rgba(255,255,255,0.5)";

  /* long quotes step the display size down so a value can never push
     the row wider than the card - no horizontal scroll, ever */
  const bigNumClass = (len: number) =>
    len > 14 ? "text-[28px]" : len > 10 ? "text-[36px]" : "text-[48px]";

  /* swap math */
  const payT = TOKENS.find((t) => t.sym === paySym)!;
  const recT = TOKENS.find((t) => t.sym === recSym)!;
  const payAmt = parseFloat(pay) || 0;
  const rate = payT.price / recT.price;
  const recAmt = payAmt > 0 ? payAmt * rate * 0.997 : 0;
  const recStr =
    recAmt > 0
      ? recAmt >= 100
        ? recAmt.toLocaleString("en-US", { maximumFractionDigits: 2 })
        : recAmt.toPrecision(5)
      : "";
  const overBalance = payAmt > payT.balance;
  const empty = payAmt <= 0;

  /* buy math: $120 → ETH at spot minus ~1% provider spread */
  const buyT = TOKENS.find((t) => t.sym === buyToken)!;
  const fiatNum = parseFloat(fiatAmt) || 0;
  const buyRec = fiatNum > 0 ? (fiatNum / buyT.price) * 0.99 : 0;
  /* stake math - follows the chosen stake token; the ETH wallet is
     seeded at 2.5 so the default view has something to stake */
  const stakeT = TOKENS.find((t) => t.sym === stakeSym)!;
  const stakeBal =
    stakeT.balance > 0 ? stakeT.balance : stakeSym === "ETH" ? 2.5 : 0;
  const stakeNum = parseFloat(stakeAmt) || 0;
  const ethPrice = stakeT.price;
  const reward = stakeNum > 0 ? stakeNum * (APY / 100) * (duration / 365) : 0;

  const busy = phase === "swapping";

  const runAction = () => {
    if (phase !== "idle") return;
    setPhase("swapping");
    timer.current = setTimeout(() => {
      setPhase("idle");
      timer.current = null;
    }, 1400);
  };

  const flip = () => {
    if (busy) return;
    setFlipped((f) => !f);
    setPaySym(recSym);
    setRecSym(paySym);
    setPay(recStr.replace(/,/g, "") || "");
    setMenu(null);
  };

  /* buy flip carries the quote back into the fiat field so the amounts
     visibly invert instead of the key sitting dead */
  const flipBuy = () => {
    if (busy) return;
    setBuyFlipped((f) => !f);
    setFiatAmt(buyRec > 0 ? buyRec.toPrecision(5).replace(/,/g, "") : "");
  };

  const closeMenus = () => {
    setMenu(null);
    setFiatMenu(false);
    setBuyMenu(false);
    setStakeMenu(false);
  };

  const menuBox = (children: React.ReactNode) => (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -6 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
      transition={FAST_TWEEN}
      className="absolute top-full right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl p-1"
      style={{
        background: "#FFFFFF",
        border: `0.5px solid ${pal.border}`,
        boxShadow: "0 12px 32px -12px rgba(0,0,0,0.25)",
      }}
    >
      {children}
    </motion.div>
  );

  const tokenOption = (sym: string, current: string, onPick: () => void) => {
    const t = TOKENS.find((x) => x.sym === sym)!;
    return (
      <button
        key={sym}
        type="button"
        onClick={() => {
          onPick();
          closeMenus();
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors active:scale-[0.98]"
        style={{
          background: sym === current ? "#F1F1F1" : "transparent",
        }}
      >
        <TokenLogo sym={sym} size={34} badge badgeRing="#FFFFFF" />
        <span className="min-w-0 flex-1">
          <span
            className="block text-[15px] font-semibold"
            style={{ color: pal.chipText }}
          >
            {t.name}
          </span>
          <span
            className="block truncate text-[13px] tabular-nums"
            style={{ color: pal.muted }}
          >
            {sym} · {t.addr}
          </span>
        </span>
        <span className="text-[13px] tabular-nums" style={{ color: pal.muted }}>
          {t.balance === 0 ? "none" : t.balance.toLocaleString()}
        </span>
        {sym === current && (
          <CheckIcon
            className="size-4 shrink-0"
            weight="bold"
            style={{ color: pal.chipText }}
          />
        )}
      </button>
    );
  };

  const chipBtn = (
    label: string,
    coin: string | null,
    onClick: () => void,
    onBlurClose: () => void,
  ) => (
    <button
      type="button"
      onClick={onClick}
      onBlur={(e) => {
        if (!e.relatedTarget?.closest("[data-menu]")) onBlurClose();
      }}
      className="flex w-[128px] cursor-pointer items-center gap-1.5 rounded-2xl px-3 py-1.5 transition-transform active:scale-[0.98] [corner-shape:squircle]"
      style={{ background: chipFill, border: `0.5px solid ${pal.border}` }}
    >
      {coin && <TokenLogo sym={coin} />}
      <span
        className="min-w-0 flex-1 truncate text-left text-[16px] font-medium"
        style={{ color: pal.chipText }}
      >
        {label}
      </span>
      <CaretDownIcon
        className="size-4"
        weight="regular"
        style={{ color: pal.muted }}
      />
    </button>
  );

  const amountInput = (
    key: string,
    value: string,
    onChange: (v: string) => void,
    label: string,
    bad?: boolean,
  ) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.input
        key={key}
        initial={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.96, filter: "blur(2px)" }
        }
        animate={
          reduce
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, filter: "blur(0px)" }
        }
        exit={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.98, filter: "blur(2px)" }
        }
        transition={FAST_TWEEN}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, "");
          if (v.split(".").length <= 2) onChange(v);
        }}
        inputMode="decimal"
        placeholder="0"
        aria-label={label}
        maxLength={15}
        /* wheel over a focused amount field hijacks page scroll on some
           mice/trackpads - blur first so the page always owns it */
        onWheel={(e) => e.currentTarget.blur()}
        className={`w-full min-w-0 bg-transparent ${bigNumClass(value.length)} leading-[1.05] font-medium tracking-tight outline-none tabular-nums placeholder:opacity-40`}
        style={{ color: bad ? "#F87171" : pal.number }}
      />
    </AnimatePresence>
  );

  /* the button names the action, not the onboarding: Swap → Review swap
     (Uniswap), Buy → Buy ETH, Stake → Stake. Busy verbs keep the same
     stem so the swap reads as one continuous action. */
  const busyVerb =
    tab === "Swap" ? "Reviewing…" : tab === "Buy" ? "Buying…" : "Staking…";
  const idleLabel =
    tab === "Swap"
      ? overBalance
        ? "Insufficient balance"
        : empty
          ? "Enter an amount"
          : "Review swap"
      : tab === "Buy"
        ? fiatNum <= 0
          ? "Enter an amount"
          : `Buy ${buyToken}`
        : stakeNum <= 0 || stakeNum > stakeBal
          ? stakeNum > stakeBal
            ? "Insufficient balance"
            : "Enter an amount"
          : "Stake";

  const ctaDisabled =
    tab === "Swap"
      ? empty || overBalance || busy
      : tab === "Buy"
        ? fiatNum <= 0 || busy
        : stakeNum <= 0 || stakeNum > stakeBal || busy;

  /* insufficient funds: plain neutral button, muted text - the red
     amount above already carries the error */
  const insufficient =
    (tab === "Swap" && overBalance) || (tab === "Stake" && stakeNum > stakeBal);

  const provider = PROVIDERS.find((p) => p.id === providerId)!;
  const validator = VALIDATORS.find((v) => v.id === validatorId)!;

  return (
    <div
      className="flex min-h-160 w-full items-start justify-center px-4 py-10 transition-colors sm:px-6 md:py-20"
      /* forced light: inputs, spinners and UA form defaults inside the
         widget always render light, even under OS-level dark mode */
      style={{ background: pal.background, colorScheme: "light" }}
    >
      <div className="w-full max-w-112.5">
        {/* tabs */}
        <LayoutGroup id="flux-tabs">
          <div
            className="inline-flex [corner-shape:squircle] p-px gap-4 "
            style={{
              background: pal.card,
              border: `0.5px solid ${pal.border}`,
              borderRadius: 28,
            }}
          >
            {(["Swap", "Buy", "Stake"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setPhase("idle");
                  closeMenus();
                }}
                aria-pressed={tab === t}
                className="relative isolate cursor-pointer rounded-2xl [corner-shape:squircle] py-1.5 px-5 transition-transform active:scale-[0.98]"
                style={{
                  color: tab === t ? pal.chipText : pal.tabIdle,
                  fontWeight: tab === t ? 600 : 500,
                }}
              >
                {tab === t && (
                  <motion.span
                    layoutId="flux-tab-pill"
                    transition={springPill}
                    className="absolute inset-0 [corner-shape:squircle]"
                    style={{
                      background: "#FFFFFF",
                      border: `0.5px solid ${pal.border}`,
                      borderRadius: 20,
                    }}
                  />
                )}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <AnimatePresence mode="wait" initial={false}>
          {tab === "Swap" && (
            <motion.div
              key="swap"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={FAST_TWEEN}
            >
              {/* pay */}
              <motion.div
                layout
                transition={springPanel}
                className={`mt-4 ${CARD_CLASS}`}
                style={{ background: pal.card, boxShadow: cardRing }}
              >
                <p className="text-sm" style={{ color: pal.label }}>
                  pay
                </p>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="min-w-0 flex-1">
                    {amountInput(
                      paySym,
                      pay,
                      setPay,
                      "Amount to pay",
                      overBalance,
                    )}
                  </div>
                  <div className="relative shrink-0">
                    {chipBtn(
                      paySym,
                      paySym,
                      () => setMenu((m) => (m === "pay" ? null : "pay")),
                      () => setMenu(null),
                    )}
                    <AnimatePresence>
                      {menu === "pay" && (
                        <div data-menu>
                          {menuBox(
                            TOKENS.filter((t) => t.sym !== recSym).map((t) =>
                              tokenOption(t.sym, paySym, () =>
                                setPaySym(t.sym),
                              ),
                            ),
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3 pt-1">
                  <p
                    className="text-sm tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    {payAmt > 0 ? fmtSub(payAmt * payT.price) : "$0.00"}
                  </p>
                  <p
                    className="text-[14px] tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    You have{" "}
                    {payT.balance === 0
                      ? "none"
                      : payT.balance.toLocaleString()}
                  </p>
                </div>
              </motion.div>

              {/* flip */}
              <div className="relative z-10 -my-6 flex justify-center">
                <motion.button
                  type="button"
                  onClick={flip}
                  aria-label="Flip tokens"
                  whileTap={reduce ? undefined : { scale: 0.9 }}
                  animate={reduce ? undefined : { rotate: flipped ? 180 : 0 }}
                  transition={springTab}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)]"
                  style={{
                    background: chipFill,
                    border: `1px solid ${pal.border}`,
                    color: pal.label,
                    outline: `2px solid ${pal.stage}`,
                  }}
                >
                  <ArrowsDownUpIcon className="size-6" weight="bold" />
                </motion.button>
              </div>

              {/* receive */}
              <motion.div
                layout
                transition={springPanel}
                className={`mt-2 ${CARD_CLASS}`}
                style={{ background: pal.card, boxShadow: cardRing }}
              >
                <p className="text-[14px]" style={{ color: pal.label }}>
                  Receive
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={recSym}
                      initial={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.96, filter: "blur(2px)" }
                      }
                      animate={
                        reduce
                          ? { opacity: 1 }
                          : { opacity: 1, scale: 1, filter: "blur(0px)" }
                      }
                      exit={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.98, filter: "blur(2px)" }
                      }
                      transition={FAST_TWEEN}
                      className={`w-full min-w-0 flex-1 truncate ${bigNumClass(recStr.length)} leading-[1.05] font-medium tracking-tight tabular-nums`}
                      style={{ color: pal.number }}
                    >
                      {recStr || <span style={{ opacity: 0.35 }}>0</span>}
                    </motion.p>
                  </AnimatePresence>
                  <div className="relative shrink-0">
                    {chipBtn(
                      recSym,
                      recSym,
                      () => setMenu((m) => (m === "rec" ? null : "rec")),
                      () => setMenu(null),
                    )}
                    <AnimatePresence>
                      {menu === "rec" && (
                        <div data-menu>
                          {menuBox(
                            TOKENS.filter((t) => t.sym !== paySym).map((t) =>
                              tokenOption(t.sym, recSym, () =>
                                setRecSym(t.sym),
                              ),
                            ),
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3 pt-1">
                  <p
                    className="text-[14px] tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    {recAmt > 0 ? fmtSub(recAmt * recT.price) : "$0.00"}
                  </p>
                  <p
                    className="text-[14px] tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    You have{" "}
                    {recT.balance === 0
                      ? "none"
                      : recT.balance.toLocaleString()}
                  </p>
                </div>
              </motion.div>

              {/* rate */}
              <div
                className="flex items-center justify-between px-1 pt-3 text-[14px]"
                style={{ color: pal.muted }}
              >
                <span className="flex items-center gap-1.5">
                  Rate <InfoIcon className="size-4" weight="fill" />
                </span>
                <span className="tabular-nums">
                  1 {paySym} ={" "}
                  {rate >= 1
                    ? rate.toLocaleString("en-US", { maximumFractionDigits: 5 })
                    : rate.toPrecision(6)}{" "}
                  {recSym}
                </span>
              </div>
            </motion.div>
          )}

          {tab === "Buy" && (
            <motion.div
              key="buy"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={FAST_TWEEN}
            >
              {/* you pay (fiat) */}
              <div
                className={`mt-4 ${CARD_CLASS}`}
                style={{ background: pal.card, boxShadow: cardRing }}
              >
                <p className="text-[14px]" style={{ color: pal.label }}>
                  You pay
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="min-w-0 flex-1">
                    {amountInput("fiat", fiatAmt, setFiatAmt, "Fiat amount")}
                  </div>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setFiatMenu((v) => !v)}
                      onBlur={(e) => {
                        if (!e.relatedTarget?.closest("[data-menu]"))
                          setFiatMenu(false);
                      }}
                      className="flex w-[128px] cursor-pointer items-center gap-1.5 rounded-2xl px-3 py-1.5 transition-transform active:scale-[0.98] [corner-shape:squircle]"
                      style={{
                        background: chipFill,
                        border: `0.5px solid ${pal.border}`,
                      }}
                    >
                      <BankIcon
                        className="size-5"
                        weight="duotone"
                        style={{ color: pal.chipText }}
                      />
                      <span
                        className="min-w-0 flex-1 truncate text-left text-[16px] font-medium"
                        style={{ color: pal.chipText }}
                      >
                        {fiatSym}
                      </span>
                      <CaretDownIcon
                        className="size-4"
                        weight="regular"
                        style={{ color: pal.muted }}
                      />
                    </button>
                    <AnimatePresence>
                      {fiatMenu && (
                        <div data-menu>
                          {menuBox(
                            FIATS.map((f) => (
                              <button
                                key={f.sym}
                                type="button"
                                onClick={() => {
                                  setFiatSym(f.sym);
                                  setFiatMenu(false);
                                }}
                                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-transform active:scale-[0.98]"
                                style={{
                                  background:
                                    f.sym === fiatSym ? "#F1F1F1" : "transparent",
                                }}
                              >
                                <span className="min-w-0 flex-1">
                                  <span
                                    className="block text-[14px] font-semibold"
                                    style={{ color: pal.chipText }}
                                  >
                                    {f.sym}
                                  </span>
                                  <span
                                    className="block text-[12px]"
                                    style={{ color: pal.muted }}
                                  >
                                    {f.name}
                                  </span>
                                </span>
                                {f.sym === fiatSym && (
                                  <CheckIcon
                                    className="size-4"
                                    weight="bold"
                                    style={{ color: pal.chipText }}
                                  />
                                )}
                              </button>
                            )),
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3 pt-1">
                  <p className="text-[14px]" style={{ color: pal.muted }}>
                    {fiatSym} · Visa •• 4242
                  </p>
                  <p className="text-[14px]" style={{ color: pal.muted }}>
                    Balance $2,400.00
                  </p>
                </div>
              </div>

              <div className="relative z-10 -my-5.5 flex justify-center">
                <motion.button
                  type="button"
                  onClick={flipBuy}
                  aria-label="Invert quote"
                  whileTap={reduce ? undefined : { scale: 0.9 }}
                  animate={
                    reduce ? undefined : { rotate: buyFlipped ? 180 : 0 }
                  }
                  transition={springTab}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)]"
                  style={{
                    background: chipFill,
                    border: `1px solid ${pal.border}`,
                    color: pal.label,
                    outline: `2px solid ${pal.stage}`,
                  }}
                >
                  <ArrowsDownUpIcon className="size-6" weight="bold" />
                </motion.button>
              </div>

              {/* you receive */}
              <div
                className={CARD_CLASS}
                style={{ background: pal.card, boxShadow: cardRing }}
              >
                <p className="text-[14px]" style={{ color: pal.label }}>
                  You receive
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={buyToken}
                      initial={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.96, filter: "blur(2px)" }
                      }
                      animate={
                        reduce
                          ? { opacity: 1 }
                          : { opacity: 1, scale: 1, filter: "blur(0px)" }
                      }
                      exit={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.98, filter: "blur(2px)" }
                      }
                      transition={FAST_TWEEN}
                      className={`w-full min-w-0 flex-1 truncate ${bigNumClass(buyRec > 0 ? buyRec.toPrecision(5).length : 1)} leading-[1.05] font-medium tracking-tight tabular-nums`}
                      style={{ color: pal.number }}
                    >
                      {buyRec > 0 ? (
                        buyRec.toPrecision(5)
                      ) : (
                        <span style={{ opacity: 0.35 }}>0</span>
                      )}
                    </motion.p>
                  </AnimatePresence>
                  <div className="relative shrink-0">
                    {chipBtn(
                      buyToken,
                      buyToken,
                      () => setBuyMenu((v) => !v),
                      () => setBuyMenu(false),
                    )}
                    <AnimatePresence>
                      {buyMenu && (
                        <div data-menu>
                          {menuBox(
                            TOKENS.map((t) =>
                              tokenOption(t.sym, buyToken, () =>
                                setBuyToken(t.sym),
                              ),
                            ),
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3 pt-1">
                  <p
                    className="text-[14px] tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    {buyRec > 0 ? fmtUsd(buyRec * buyT.price) : "$0.00"}
                  </p>
                  <p className="text-[14px]" style={{ color: pal.muted }}>
                    You have{" "}
                    {buyT.balance === 0
                      ? "none"
                      : buyT.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* provider */}
              <button
                type="button"
                onClick={() => setProviderOpen((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between px-1 pt-3 text-[14px] transition-transform active:scale-[0.99]"
                style={{ color: pal.muted }}
              >
                <span className="flex items-center gap-1.5">
                  Provider <InfoIcon className="size-4" weight="fill" />
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  {provider.name} · {provider.fee}
                  <motion.span
                    animate={
                      reduce ? undefined : { rotate: providerOpen ? 180 : 0 }
                    }
                    transition={FAST_TWEEN}
                    className="flex"
                  >
                    <CaretDownIcon className="size-4" weight="regular" />
                  </motion.span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {providerOpen && (
                  <motion.div
                    key="providers"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springPanel}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-1 px-1 pt-2">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProviderId(p.id);
                            setProviderOpen(false);
                          }}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-[14px] transition-transform active:scale-[0.99]"
                          style={{
                            background:
                              p.id === providerId ? pal.card : "transparent",
                            border: `0.5px solid ${p.id === providerId ? pal.border : "transparent"}`,
                          }}
                        >
                          <span
                            style={{ color: pal.chipText }}
                            className="font-medium"
                          >
                            {p.name}{" "}
                            <span
                              className="font-normal"
                              style={{ color: pal.muted }}
                            >
                              · {p.note}
                            </span>
                          </span>
                          <span
                            className="flex items-center gap-2 tabular-nums"
                            style={{ color: pal.muted }}
                          >
                            {p.fee}
                            {p.id === providerId && (
                              <CheckIcon
                                className="size-4"
                                weight="bold"
                                style={{ color: pal.chipText }}
                              />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {tab === "Stake" && (
            <motion.div
              key="stake"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={FAST_TWEEN}
            >
              {/* you stake */}
              <div
                className={`mt-4 ${CARD_CLASS}`}
                style={{ background: pal.card, boxShadow: cardRing }}
              >
                <p className="text-[14px]" style={{ color: pal.label }}>
                  You stake
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="min-w-0 flex-1">
                    {amountInput(
                      "stake",
                      stakeAmt,
                      setStakeAmt,
                      "Amount to stake",
                      stakeNum > stakeBal,
                    )}
                  </div>
                  <div className="relative shrink-0">
                    {chipBtn(
                      stakeSym,
                      stakeSym,
                      () => setStakeMenu((v) => !v),
                      () => setStakeMenu(false),
                    )}
                    <AnimatePresence>
                      {stakeMenu && (
                        <div data-menu>
                          {menuBox(
                            TOKENS.map((t) =>
                              tokenOption(t.sym, stakeSym, () =>
                                setStakeSym(t.sym),
                              ),
                            ),
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3 pt-1">
                  <p
                    className="text-[14px] tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    {stakeNum > 0 ? fmtUsd(stakeNum * ethPrice) : "$0.00"}
                  </p>
                  <p
                    className="text-[14px] tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    You have {stakeBal.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* duration pills */}
              <div className="flex items-center justify-between px-1 pt-3">
                <div className="flex gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className="cursor-pointer rounded-full px-3 py-1.5 text-[14px] font-medium tabular-nums transition-transform active:scale-95"
                      style={
                        duration === d
                          ? {
                              background: pal.ctaFill,
                              border: `0.5px solid ${pal.ctaBorder}`,
                              color: "#fff",
                            }
                          : {
                              background: pal.card,
                              border: `0.5px solid ${pal.border}`,
                              color: pal.muted,
                            }
                      }
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                <p
                  className="text-[14px] font-semibold tabular-nums"
                  style={{ color: pal.label }}
                >
                  {APY.toFixed(1)}% APY
                </p>
              </div>

              {/* you earn */}
              <div
                className={`mt-3 ${CARD_CLASS}`}
                style={{ background: pal.card, boxShadow: cardRing }}
              >
                <p className="text-[14px]" style={{ color: pal.label }}>
                  You earn
                </p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key="stake-earn"
                      initial={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.96, filter: "blur(2px)" }
                      }
                      animate={
                        reduce
                          ? { opacity: 1 }
                          : { opacity: 1, scale: 1, filter: "blur(0px)" }
                      }
                      exit={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.98, filter: "blur(2px)" }
                      }
                      transition={FAST_TWEEN}
                      className={`w-full min-w-0 flex-1 truncate ${bigNumClass(reward > 0 ? reward.toPrecision(4).length : 1)} leading-[1.05] font-medium tracking-tight tabular-nums`}
                      style={{ color: pal.number }}
                    >
                      {reward > 0 ? (
                        reward.toPrecision(4)
                      ) : (
                        <span style={{ opacity: 0.35 }}>0</span>
                      )}
                    </motion.p>
                  </AnimatePresence>
                  <span
                    className="flex w-[128px] shrink-0 items-center gap-1.5 rounded-2xl px-3 py-1.5 [corner-shape:squircle]"
                    style={{
                      background: chipFill,
                      border: `0.5px solid ${pal.border}`,
                    }}
                  >
                    <TokenLogo sym={stakeSym} />
                    <span
                      className="min-w-0 flex-1 truncate text-left text-[16px] font-medium"
                      style={{ color: pal.chipText }}
                    >
                      {stakeSym}
                    </span>
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3 pt-1">
                  <p
                    className="text-[14px] tabular-nums"
                    style={{ color: pal.muted }}
                  >
                    {reward > 0 ? fmtUsd(reward * ethPrice) : "$0.00"} in{" "}
                    {duration} days
                  </p>
                  <p className="text-[14px]" style={{ color: pal.muted }}>
                    No lock-up
                  </p>
                </div>
              </div>

              {/* validator */}
              <button
                type="button"
                onClick={() => setValidatorOpen((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between px-1 pt-3 text-[14px] transition-transform active:scale-[0.99]"
                style={{ color: pal.muted }}
              >
                <span className="flex items-center gap-1.5">
                  Validator <InfoIcon className="size-4" weight="fill" />
                </span>
                <span className="flex items-center gap-1">
                  {validator.name} · {validator.fee}
                  <motion.span
                    animate={
                      reduce ? undefined : { rotate: validatorOpen ? 180 : 0 }
                    }
                    transition={FAST_TWEEN}
                    className="flex"
                  >
                    <CaretDownIcon className="size-4" weight="regular" />
                  </motion.span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {validatorOpen && (
                  <motion.div
                    key="validators"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springPanel}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-1 px-1 pt-2">
                      {VALIDATORS.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setValidatorId(v.id);
                            setValidatorOpen(false);
                          }}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-[14px] transition-transform active:scale-[0.99]"
                          style={{
                            background:
                              v.id === validatorId ? pal.card : "transparent",
                            border: `0.5px solid ${v.id === validatorId ? pal.border : "transparent"}`,
                          }}
                        >
                          <span
                            style={{ color: pal.chipText }}
                            className="font-medium"
                          >
                            {v.name}
                          </span>
                          <span
                            className="flex items-center gap-2"
                            style={{ color: pal.muted }}
                          >
                            {v.fee}
                            {v.id === validatorId && (
                              <CheckIcon
                                className="size-4"
                                weight="bold"
                                style={{ color: pal.chipText }}
                              />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          type="button"
          onClick={() => {
            if (ctaDisabled) return;
            /* loading-only: hold ~1.4s, then return everything to idle.
               No success pose, no field clearing - the button always
               ends exactly where it started. */
            runAction();
          }}
          disabled={ctaDisabled}
          whileTap={ctaDisabled || reduce ? undefined : { scale: 0.98 }}
          transition={springTab}
          className="mt-6 py-2.5 w-full text-xl font-medium [corner-shape:squircle]"
          style={{
            background: insufficient
              ? "#EFEFEF"
              : ctaDisabled
                ? "#D8D8D8"
                : pal.ctaFill,
            border: `1px solid ${ctaDisabled ? "transparent" : pal.ctaBorder}`,
            borderRadius: 40,
            color: insufficient
              ? pal.muted
              : ctaDisabled
                ? "#FFFFFF"
                : "#FFFFFF",
            opacity: ctaDisabled && !insufficient ? 0.7 : 1,
            cursor: ctaDisabled ? "default" : "pointer",
            /* Get started shadows: crisp 1px top gloss, soft inner
               depth, and a blue-tinted drop so it lifts off the page.
               Disabled state stays flat. */
            boxShadow: ctaDisabled
              ? "none"
              : "inset 0 1px 1px 0 rgba(255,255,255,0.50), inset 0 2px 4px 0 rgba(255,255,255,0.16), inset 0 -2px 2px 0 rgba(0,0,0,0.16), 0 1px 2px 0 rgba(0,0,0,0.08), 0 2px 4px 0 rgba(0,0,0,0.04)",
          }}
        >
          {/* the label is ONE stable node that only swaps words. The
             spinner hangs left of the text, absolutely positioned - it
             never enters flex layout, so mount AND exit (which lingers
             in the tree while fading) move zero pixels. No jump, and
             the text can never unmount into a blank button. */}
          <span className="flex items-center justify-center">
            <span className="relative">
              <AnimatePresence initial={false}>
                {phase === "swapping" && (
                  <motion.span
                    key="spin"
                    aria-hidden
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={FAST_TWEEN}
                    className="pointer-events-none absolute top-1/2 right-full mr-2 flex -translate-y-1/2"
                  >
                    <CircleNotchIcon
                      className="size-5 animate-spin"
                      weight="bold"
                    />
                  </motion.span>
                )}
              </AnimatePresence>
              <span>{phase === "swapping" ? busyVerb : idleLabel}</span>
            </span>
          </span>
        </motion.button>
      </div>
    </div>
  );
}
