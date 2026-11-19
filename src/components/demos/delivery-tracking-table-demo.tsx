"use client";

import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretUpDownIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  ANALYTICS_ROWS,
  PRIORITY_ORDER,
  STATUS_META,
  type ItemPriority,
  type ItemStatus,
} from "./analytics-data";

/* ---------------------------------- types --------------------------------- */

type TabId = "projects" | "sprints" | "tasks";
type SortKey = "name" | "status" | "progress" | "due" | "priority" | "trend";

const TABS: { id: TabId; label: string; search: string }[] = [
  { id: "projects", label: "Projects", search: "Search projects" },
  { id: "sprints", label: "Sprints", search: "Search sprints" },
  { id: "tasks", label: "Tasks", search: "Search tasks" },
];

const STATUS_SKIN: Record<ItemStatus, string> = {
  "on-track": "bg-emerald-500/10 text-emerald-600",
  "at-risk": "bg-amber-500/10 text-amber-600",
  delayed: "bg-red-500/10 text-red-600",
  shipped: "bg-blue-500/10 text-blue-600",
};

const PRIORITY_SKIN: Record<ItemPriority, string> = {
  Critical: "bg-red-500/10 text-red-600",
  High: "bg-amber-500/10 text-amber-600",
  Medium: "bg-sky-500/10 text-sky-600",
  Low: "bg-neutral-900/[0.06] text-neutral-500",
};

const STATUSES = Object.keys(STATUS_META) as ItemStatus[];
const PRIORITIES: ItemPriority[] = ["Critical", "High", "Medium", "Low"];

const BADGE_TINTS = [
  "bg-violet-500/10 text-violet-600",
  "bg-sky-500/10 text-sky-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
  "bg-rose-500/10 text-rose-600",
  "bg-blue-500/10 text-blue-600",
];

const PAGE_SIZE = 7;

/* ------------------------------ small pieces ------------------------------ */

function MenuButton({
  label,
  icon,
  active,
  onClick,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          onClick?.();
        }}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget))
            setOpen(false);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors active:scale-[0.98] [corner-shape:squircle]",
          active
            ? "border-blue-600/30 bg-blue-500/[0.08] text-blue-700"
            : "border-neutral-900/10 bg-white text-neutral-700 hover:bg-neutral-50",
        )}
      >
        {icon}
        {label}
        <CaretUpDownIcon className="size-3.5 text-neutral-400" />
      </button>
      {open && children && (
        <div className="absolute top-full left-0 z-20 mt-1.5 max-h-72 w-48 overflow-y-auto rounded-xl border border-neutral-900/10 bg-white p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)] [corner-shape:squircle]">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuCheck({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-neutral-700 transition-colors hover:bg-neutral-100"
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-md border transition-colors [corner-shape:squircle]",
          checked
            ? "border-blue-600 bg-blue-500 text-white"
            : "border-neutral-300 bg-white",
        )}
      >
        {checked && (
          <svg
            viewBox="0 0 10 8"
            className="size-2.5 fill-none stroke-current stroke-2"
          >
            <polyline points="1 4 3.5 6.5 9 1" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

/* --------------------------------- table ---------------------------------- */

export default function DeliveryTrackingTableDemo() {
  const [tab, setTab] = useState<TabId>("projects");
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Set<ItemStatus>>(new Set());
  const [priorities, setPriorities] = useState<Set<ItemPriority>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  /* Hovered row id - every other row dims while one is read.
     Tracked by id (not index) so it survives sorting and paging. */
  const [focusId, setFocusId] = useState<string | null>(null);
  const focusRef = useRef<string | null>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const setFocus = (id: string | null) => {
    if (focusRef.current === id) return;
    focusRef.current = id;
    setFocusId(id);
  };
  /* One delegated hover tracker for the whole tbody - this is the core
     fix for the divider flicker. Per-row mouseenter/leave pairs are the
     classic cause of this bug class (same family as flickering dropdown
     menus and tooltips): two adjacent hit areas share one 1px border,
     so a pointer parked on it alternates leave-A/enter-B/leave-B/enter-A
     and the highlight strobes. Discrete enter/leave events can never
     agree on an owner for a shared edge, so no per-row timer or delay
     can fix it - only moving the decision up one level works.
     Instead, every pointermove resolves the row under the cursor and a
     sticky bias holds the incumbent until the pointer is STICK_PX inside
     the new row. Boundary jitter physically cannot flip focus back and
     forth, and equal states early-return so re-renders never churn. */
  const STICK_PX = 4;
  const trackFocus = (e: ReactPointerEvent<HTMLTableSectionElement>) => {
    /* Touch has no hover: a tap fires pointermove and would latch the
       dim until the next tap elsewhere. Gate the whole effect to
       real hover pointers (mouse/trackpad/stylus) - on touch every
       row stays crisp and taps just tap. */
    if (e.pointerType === "touch") return;
    const target = e.target as Element | null;
    const tr = target?.closest("tr[data-rowid]") ?? null;
    const id = tr?.getAttribute("data-rowid") ?? null;
    if (id === null || tr == null) {
      setFocus(null);
      return;
    }
    if (id === focusRef.current) return;
    const prev = bodyRef.current?.querySelector(
      `tr[data-rowid="${focusRef.current}"]`,
    );
    if (prev && focusRef.current !== null) {
      const r = tr.getBoundingClientRect();
      const p = prev.getBoundingClientRect();
      const y = e.clientY;
      /* Rows stack vertically, so only the shared horizontal edge
         matters: hold the incumbent while the pointer is still inside
         the bias zone around that edge. */
      if (r.top >= p.top) {
        if (y < r.top + STICK_PX) return;
      } else if (y > r.bottom - STICK_PX) return;
    }
    setFocus(id);
  };

  const counts = useMemo(() => {
    const c: Record<TabId, number> = { projects: 0, sprints: 0, tasks: 0 };
    for (const r of ANALYTICS_ROWS) {
      if (r.kind === "project") c.projects += 1;
      else if (r.kind === "sprint") c.sprints += 1;
      else c.tasks += 1;
    }
    return c;
  }, []);

  const activeSearch = TABS.find((t) => t.id === tab)!.search;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = ANALYTICS_ROWS.filter(
      (r) =>
        (tab === "projects"
          ? r.kind === "project"
          : tab === "sprints"
            ? r.kind === "sprint"
            : r.kind === "task") &&
        (statuses.size === 0 || statuses.has(r.status)) &&
        (priorities.size === 0 || priorities.has(r.priority)) &&
        (q === "" ||
          r.name.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)),
    );
    if (sortKey) {
      const dir = sortDir;
      rows = [...rows].sort((a, b) => {
        switch (sortKey) {
          case "name":
            return a.name.localeCompare(b.name) * dir;
          case "status":
            return (
              (STATUS_META[a.status].order - STATUS_META[b.status].order) * dir
            );
          case "progress":
            return (a.progress - b.progress) * dir;
          case "due":
            return (a.dueTime - b.dueTime) * dir;
          case "priority":
            return (
              (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir
            );
          case "trend":
            return (a.trend - b.trend) * dir;
        }
      });
    }
    return rows;
  }, [tab, query, statuses, priorities, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const resetPage = () => setPage(0);
  const flip = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const flipFilter = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  };

  const toggleSort = (key: SortKey) => {
    resetPage();
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(1);
    } else if (sortDir === 1) {
      setSortDir(-1);
    } else {
      setSortKey(null);
    }
  };

  const allChecked =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const headers: { key: SortKey; label: string; align?: "left" | "right" }[] = [
    {
      key: "name",
      label:
        tab === "projects" ? "Project" : tab === "sprints" ? "Sprint" : "Task",
    },
    { key: "status", label: "Status" },
    { key: "progress", label: "Progress", align: "right" },
    { key: "due", label: "Due", align: "right" },
    { key: "priority", label: "Priority", align: "right" },
    { key: "trend", label: "Trend", align: "right" },
  ];

  return (
    <div className="flex min-h-160 w-full items-start justify-center py-10 transition-colors md:py-20">
      <div
        className={cn(
          /* tabular-nums is the default for every number here - counts,
           progress, trends, pagination all update live, and tabular
           figures keep digits from jittering as values change. The
           OpenType `tnum` feature inherits, so one class covers
           the whole table. */
          "w-full overflow-hidden rounded-2xl border border-neutral-900/10 bg-white text-sm tabular-nums [corner-shape:squircle]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(0,0,0,0.05),0_8px_24px_-12px_rgba(0,0,0,0.12)]",
        )}
      >
        {/* tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-900/10 px-2 pt-2">
          {TABS.map((t) => {
            const isActive = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  resetPage();
                }}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-800",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums [corner-shape:squircle]",
                    isActive
                      ? "bg-neutral-900/[0.07] text-neutral-700"
                      : "bg-neutral-900/[0.05] text-neutral-500",
                  )}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* toolbar - search + filters. Status/Priority live behind buttons
          on sm+; on phones they collapse into one Filters disclosure so
          touch users keep full filtering with thumb-sized targets. */}
        <div className="flex items-center gap-2.5 border-b border-neutral-900/10 p-3 bg-neutral-50">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-900/10 bg-white px-3 py-1.5 shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.04)] [corner-shape:squircle]">
            <MagnifyingGlassIcon className="size-3.5 shrink-0 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder={activeSearch}
              className="w-full bg-transparent text-[13px] text-neutral-800 outline-none placeholder:text-neutral-400"
            />
          </label>
          <div className="shrink-0 sm:hidden">
            <MenuButton
              label="Filters"
              active={statuses.size + priorities.size > 0}
            >
              <p className="px-2.5 pt-1.5 pb-0.5 font-mono text-[10px] tracking-[0.08em] text-neutral-400 uppercase">
                Status
              </p>
              {STATUSES.map((s) => (
                <MenuCheck
                  key={s}
                  checked={statuses.has(s)}
                  label={STATUS_META[s].label}
                  onToggle={() => {
                    setStatuses((prev) => flipFilter(prev, s));
                    resetPage();
                  }}
                />
              ))}
              <p className="px-2.5 pt-1.5 pb-0.5 font-mono text-[10px] tracking-[0.08em] text-neutral-400 uppercase">
                Priority
              </p>
              {PRIORITIES.map((p) => (
                <MenuCheck
                  key={p}
                  checked={priorities.has(p)}
                  label={p}
                  onToggle={() => {
                    setPriorities((prev) => flipFilter(prev, p));
                    resetPage();
                  }}
                />
              ))}
              {(statuses.size > 0 || priorities.size > 0) && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setStatuses(new Set());
                    setPriorities(new Set());
                    resetPage();
                  }}
                  className="mt-1 w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium text-blue-600 transition-colors hover:bg-blue-500/[0.08]"
                >
                  Clear all
                </button>
              )}
            </MenuButton>
          </div>
          <div className="hidden shrink-0 sm:block">
            <MenuButton label="Status" active={statuses.size > 0}>
              {STATUSES.map((s) => (
                <MenuCheck
                  key={s}
                  checked={statuses.has(s)}
                  label={STATUS_META[s].label}
                  onToggle={() => {
                    setStatuses((prev) => flipFilter(prev, s));
                    resetPage();
                  }}
                />
              ))}
            </MenuButton>
          </div>
          <div className="hidden shrink-0 sm:block">
            <MenuButton label="Priority" active={priorities.size > 0}>
              {PRIORITIES.map((p) => (
                <MenuCheck
                  key={p}
                  checked={priorities.has(p)}
                  label={p}
                  onToggle={() => {
                    setPriorities((prev) => flipFilter(prev, p));
                    resetPage();
                  }}
                />
              ))}
            </MenuButton>
          </div>
        </div>

        {/* rows */}
        <div className="overflow-x-auto">
          {/* table-fixed + colgroup: every column has a locked width, so
            switching tabs (or pages) can never shift columns - content
            truncates instead of re-sizing. Current proportions kept. */}
          <table className="w-full min-w-280 table-fixed border-collapse">
            <colgroup>
              <col className="w-12" />
              <col className="w-[300px]" />
              <col className="w-[130px]" />
              <col className="w-[170px]" />
              <col className="w-[110px]" />
              <col className="w-[120px]" />
              <col className="w-[100px]" />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-neutral-900/10 text-left">
                <th className="w-12 px-4 py-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={allChecked}
                    aria-label="Select all rows on this page"
                    onClick={() =>
                      setSelected(
                        allChecked
                          ? new Set()
                          : new Set([
                              ...selected,
                              ...pageRows.map((r) => r.id),
                            ]),
                      )
                    }
                    className={cn(
                      "flex size-4 cursor-pointer items-center justify-center rounded-md border transition-colors [corner-shape:squircle]",
                      allChecked
                        ? "border-blue-600 bg-blue-500 text-white"
                        : "border-neutral-300 bg-white hover:border-neutral-400",
                    )}
                  >
                    {allChecked && (
                      <svg
                        viewBox="0 0 10 8"
                        className="size-2.5 fill-none stroke-current stroke-2"
                      >
                        <polyline points="1 4 3.5 6.5 9 1" />
                      </svg>
                    )}
                  </button>
                </th>
                {headers.map((h) => (
                  <th key={h.key} className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(h.key)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-1 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-800",
                        h.align === "right" && "justify-end",
                      )}
                    >
                      {h.label}
                      {sortKey === h.key ? (
                        sortDir === 1 ? (
                          <ArrowUpIcon className="size-3" />
                        ) : (
                          <ArrowDownIcon className="size-3" />
                        )
                      ) : (
                        <CaretUpDownIcon className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-[13px] font-medium text-neutral-500">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody
              ref={bodyRef}
              onPointerMove={trackFocus}
              onPointerLeave={() => setFocus(null)}
            >
              {pageRows.map((row, i) => {
                const dimmed = focusId !== null && focusId !== row.id;
                return (
                  <tr
                    key={row.id}
                    data-rowid={row.id}
                    onFocus={() => setFocus(row.id)}
                    onBlur={() => setFocus(null)}
                    className={cn(
                      "border-b border-neutral-900/[0.07] last:border-0",
                      /* Instant, no transition. Hover is a
                       high-frequency pointer action - animating it lags
                       behind fast sweeps (row 1 → row 4) and the tint
                       arrives after the eye already moved. The hovered
                       row stays crisp on a neutral wash; the rest drop
                       to grayscale at reduced opacity. */
                      dimmed
                        ? "bg-transparent opacity-50 grayscale"
                        : "bg-white opacity-100 hover:bg-neutral-900/[0.04]",
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={selected.has(row.id)}
                        aria-label={`Select ${row.name}`}
                        onClick={() => setSelected((s) => flip(s, row.id))}
                        className={cn(
                          "flex size-4 cursor-pointer items-center justify-center rounded-md border transition-colors [corner-shape:squircle]",
                          selected.has(row.id)
                            ? "border-blue-600 bg-blue-500 text-white"
                            : "border-neutral-300 bg-white hover:border-neutral-400",
                        )}
                      >
                        {selected.has(row.id) && (
                          <svg
                            viewBox="0 0 10 8"
                            className="size-2.5 fill-none stroke-current stroke-2"
                          >
                            <polyline points="1 4 3.5 6.5 9 1" />
                          </svg>
                        )}
                      </button>
                    </td>
                    {/* name cell: icon badge + single-line name */}
                    <td className="px-5 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold [corner-shape:squircle]",
                            BADGE_TINTS[
                              (safePage * PAGE_SIZE + i) % BADGE_TINTS.length
                            ],
                          )}
                        >
                          {row.initials.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-900">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[12px] font-medium whitespace-nowrap [corner-shape:squircle]",
                          STATUS_SKIN[row.status],
                        )}
                      >
                        {STATUS_META[row.status].label}
                      </span>
                    </td>
                    {/* progress */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-900/[0.08]">
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              row.status === "delayed"
                                ? "bg-red-500"
                                : row.status === "at-risk"
                                  ? "bg-amber-500"
                                  : row.status === "shipped"
                                    ? "bg-blue-500"
                                    : "bg-emerald-500",
                            )}
                            style={{ width: `${row.progress}%` }}
                          />
                        </span>
                        <span className="w-9 text-right text-[13px] font-medium text-neutral-900 tabular-nums">
                          {row.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-medium whitespace-nowrap text-neutral-900 tabular-nums">
                      {row.due}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[12px] font-medium [corner-shape:squircle]",
                          PRIORITY_SKIN[row.priority],
                        )}
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={cn(
                          "text-[13px] font-medium tabular-nums",
                          row.trend >= 0 ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {row.trend >= 0 ? `+${row.trend}%` : `${row.trend}%`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] text-neutral-600">
                      <span className="block truncate whitespace-nowrap">
                        {row.owner}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-[13px] text-neutral-400"
                  >
                    No rows match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer strip - stacks on phones so counter + page controls
          never crush each other at 350px */}
        <div className="flex flex-col gap-2 border-t border-neutral-900/10 bg-neutral-50 px-4 py-2.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-0">
          <p className="font-mono text-[11px] tracking-wide text-neutral-400 uppercase">
            {selected.size} of {filtered.length} selected · page {safePage + 1}{" "}
            of {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="cursor-pointer rounded-lg pr-2.5 sm:px-2.5 py-1 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-900/[0.06] hover:text-neutral-800 active:scale-[0.98] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-500 [corner-shape:squircle]"
            >
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, p) => p)
              .filter(
                (p) =>
                  p === 0 || p === pageCount - 1 || Math.abs(p - safePage) <= 1,
              )
              .reduce<(number | "…")[]>((acc, p) => {
                const prev = acc[acc.length - 1];
                if (typeof prev === "number" && p - prev > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span
                    key={`gap-${i}`}
                    className="px-1 text-[12px] text-neutral-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={p === safePage ? "page" : undefined}
                    className={cn(
                      "min-w-7 cursor-pointer rounded-lg px-2 py-1 font-mono text-[12px] tabular-nums transition-colors active:scale-[0.98] [corner-shape:squircle]",
                      p === safePage
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-500 hover:bg-neutral-900/[0.06] hover:text-neutral-800",
                    )}
                  >
                    {p + 1}
                  </button>
                ),
              )}
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
              className="cursor-pointer rounded-lg px-2.5 py-1 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-900/[0.06] hover:text-neutral-800 active:scale-[0.98] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-500 [corner-shape:squircle]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
