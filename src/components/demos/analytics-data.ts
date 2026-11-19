/* Delivery-analytics dataset - 100 rows across projects, sprints and
   tasks. Generated with a seeded PRNG so server and client produce the
   identical rows and hydration stays clean. */

export type ItemKind = "project" | "sprint" | "task";
export type ItemStatus = "on-track" | "at-risk" | "delayed" | "shipped";
export type ItemPriority = "Critical" | "High" | "Medium" | "Low";

export interface AnalyticsRow {
  id: string;
  kind: ItemKind;
  name: string;
  owner: string;
  initials: string;
  status: ItemStatus;
  /** 0–100 */
  progress: number;
  /** pre-formatted, e.g. "Oct 24" */
  due: string;
  /** epoch ms - sorting only */
  dueTime: number;
  priority: ItemPriority;
  /** signed percent, e.g. +12.4 or -3.1 */
  trend: number;
}

export const STATUS_META: Record<ItemStatus, { label: string; order: number }> = {
  "on-track": { label: "On track", order: 0 },
  "at-risk": { label: "At risk", order: 1 },
  delayed: { label: "Delayed", order: 2 },
  shipped: { label: "Shipped", order: 3 },
};

export const PRIORITY_ORDER: Record<ItemPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

/* -------------------------------- generator ------------------------------- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261007);
const int = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

const OWNERS = [
  { owner: "Rohit Mehta", initials: "RM" },
  { owner: "Ava Chen", initials: "AC" },
  { owner: "Liam Park", initials: "LP" },
  { owner: "Mia Torres", initials: "MT" },
  { owner: "Noah Kim", initials: "NK" },
  { owner: "Zoe Patel", initials: "ZP" },
  { owner: "Eli Ross", initials: "ER" },
  { owner: "Ivy Lin", initials: "IL" },
] as const;

function rollStatus(): ItemStatus {
  const r = rand();
  if (r < 0.42) return "on-track";
  if (r < 0.62) return "at-risk";
  if (r < 0.74) return "delayed";
  return "shipped";
}

function rollPriority(): ItemPriority {
  const r = rand();
  if (r < 0.1) return "Critical";
  if (r < 0.38) return "High";
  if (r < 0.75) return "Medium";
  return "Low";
}

/* week of Oct 7 2026 in UTC - all due dates derive from here */
const BASE = Date.UTC(2026, 9, 7);
const DAY = 86_400_000;

function rollDue() {
  const dueTime = BASE + int(-18, 80) * DAY;
  const due = new Date(dueTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return { due, dueTime };
}

function rollTrend() {
  return Math.round((rand() * 34 - 9) * 10) / 10;
}

function makeRow(
  id: string,
  kind: ItemKind,
  name: string,
): AnalyticsRow {
  const status = rollStatus();
  const { due, dueTime } = rollDue();
  const who = pick(OWNERS);
  return {
    id,
    kind,
    name,
    owner: who.owner,
    initials: who.initials,
    status,
    progress: status === "shipped" ? 100 : int(4, 96),
    due,
    dueTime,
    priority: rollPriority(),
    trend: rollTrend(),
  };
}

const PROJECT_NAMES = [
  "Atlas Marketing Site",
  "Nova Dashboard",
  "Orbit Design System",
  "Pulse Mobile App",
  "Drift Analytics",
  "Beacon API Gateway",
  "Forge CI Pipeline",
  "Halo Onboarding",
  "Iris Search",
  "Juno Billing",
  "Kite Notifications",
  "Lumen Reports",
];

const SPRINT_THEMES = [
  "Checkout flow",
  "Onboarding",
  "Search relevance",
  "Billing webhooks",
  "Push delivery",
  "Dashboard widgets",
  "API rate limits",
  "Mobile deep links",
  "Report exports",
  "Access controls",
  "Performance pass",
  "Empty states",
  "Audit logs",
  "SSO rollout",
  "Caching layer",
  "Webhooks v2",
  "Docs refresh",
  "Alerts tuning",
];

const TASK_VERBS = [
  "Fix",
  "Ship",
  "Audit",
  "Refactor",
  "Migrate",
  "Polish",
  "Instrument",
  "Harden",
  "Test",
  "Document",
];

const TASK_OBJECTS = [
  "checkout race condition",
  "OAuth refresh flow",
  "search ranking weights",
  "billing webhook retries",
  "push delivery pipeline",
  "dashboard empty states",
  "API rate limits",
  "mobile deep links",
  "report CSV exports",
  "onboarding checklist",
];

function buildRows(): AnalyticsRow[] {
  const rows: AnalyticsRow[] = [];

  PROJECT_NAMES.forEach((name, i) =>
    rows.push(makeRow(`PRJ-${101 + i}`, "project", name)),
  );

  SPRINT_THEMES.forEach((theme, i) =>
    rows.push(makeRow(`SPR-${201 + i}`, "sprint", `Sprint ${31 + i} · ${theme}`)),
  );

  let n = 0;
  outer: for (const verb of TASK_VERBS) {
    for (const object of TASK_OBJECTS) {
      if (n >= 70) break outer;
      rows.push(makeRow(`TSK-${301 + n}`, "task", `${verb} ${object}`));
      n += 1;
    }
  }

  return rows;
}

export const ANALYTICS_ROWS: AnalyticsRow[] = buildRows();
