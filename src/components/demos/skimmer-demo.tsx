'use client';

/**
 * SkimmerAnatomyCard (light Anatomy finish)
 * ------------------------------------------------------------------------
 * An original ground-effect skimmer, the SK-4 "Shearwater", drawn as
 * isometric line art: white solids, three light facing tones and a lighter
 * top, hairline detail and a near-black outline. The craft runs toward +x
 * (screen top-left to bottom-right), flying nose-first: craft geometry is
 * modelled nose-aft as usual and projected x-mirrored (see withCraft).
 * It floats over a line-drawn sea while a small cay drifts past, in a
 * seamless 16 s loop. On mount the craft assembles part by part, then
 * settles into the float.
 *
 * Layers, back to front
 *   1. WebGL water on the paper colour: wave contours, foam dashes, crest
 *      marks, the wake, ripple rings and the lagoon contours. No fill.
 *   2. SVG island, then the craft's soft halo shadow on the water.
 *   3. WebGL exhaust tucked under the craft: a small amber burst and pale
 *      blue-lavender wisps, normal premultiplied alpha on paper. The
 *      ventral nozzles vent below the wing, so the wing and hull occlude
 *      the plume roots and the flame reads a frame behind them.
 *   4. SVG craft, parts painted back to front (proved by a ray-depth audit).
 *
 * frameAt() is the single motion model: it moves every part and feeds the
 * readout. Every periodic term completes whole cycles per loop, the water
 * tiles once per loop and the island is off the card at the seam, so
 * frame 0 equals frame T.
 *
 * Usage (Next.js):  <SkimmerAnatomyCard width="100%" height={460} />
 * Props: width, height (px number or CSS length), figLabel, title, subtitle,
 * hint, className, style, frozenTime (one still frame at that loop time, s),
 * shadowOpacity (peak opacity of the craft's shadow, default 0.05) and
 * shadowScale (shadow size relative to the craft's footprint, default 0.5).
 */

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react';

/* =========================================================================
 * 1. Constants and light theme tokens
 * ====================================================================== */

export const LOOP_SECONDS = 16;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const IC = Math.cos(Math.PI / 6);
const M_PER_U = 0.24; // metres per world unit
const MS_TO_KT = 1.943844;
const COURSE_DEG = 132; // flipped run: craft travels +x (top-left to bottom-right on screen)
const BOOST_GAIN = 2.4; // hold Space: the scene runs 3.4x and the plume stretches with uBoost
const ALT0 = 70; // mean height of the craft's keel above the water, units
const ALT_AMP = 6;
const SCALE_AMP = 0.015; // ±1.5 % apparent size across the float
const PARALLAX = 0.03;
const DESIGN_W = 1150; // screen-unit box that always fits in the card
const DESIGN_H = 760;
const VH_MAX = 2000;
const ISL_Y = -480; // the island passes on the port side, clear of the float
const VIEW_SHIFT = 90; // craft sits this far down-left of centre, across the drift
const ASSEMBLE_SECONDS = 1.7; // mount intro: parts fly in, then the float takes over
const ASSEMBLE_STAGGER = 0.55; // fraction of the intro spent staggering part delays

/** Light Anatomy tokens. The card colour equals the page colour. */
export const ANATOMY_LIGHT = {
  paper: '#fafafa',
  top: '#ffffff',
  t1: '#f4f4f2',
  t2: '#eaeae7',
  t3: '#dfdfdb',
  rc: '#dadad6',
  line: '#8c8c8c',
  seam: '#acacac',
  ink: '#242424',
  label: '#7d7d7d',
  value: '#2b2b2b',
} as const;

/* =========================================================================
 * 2. Math
 * ====================================================================== */

type P2 = [number, number];
type V3 = [number, number, number];
const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
const fmt = (n: number): string => (Math.round(n * 100) / 100).toString();
const v2sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const v2add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const v2mul = (a: P2, k: number): P2 => [a[0] * k, a[1] * k];
const v2norm = (a: P2): P2 => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const avg3 = (ps: V3[]): V3 => mul3(ps.reduce((s, p) => add3(s, p), [0, 0, 0] as V3), 1 / ps.length);

/** Isometric camera: x aft (down-right), y starboard (down-left), z up.
 * The craft flies toward +x (nose down-right on screen), so craft geometry
 * is projected x-mirrored: run craft code inside withCraft(); island and
 * world code always runs unmirrored. MX is module-scoped and restored by
 * try/finally, so it is 1 everywhere except inside a wrap. */
let MX = 1;
function withCraft<T>(fn: () => T): T {
  const prev = MX;
  MX = -1;
  try {
    return fn();
  } finally {
    MX = prev;
  }
}
function iso(p: V3): P2 {
  return [(MX * p[0] - p[1]) * IC, (MX * p[0] + p[1]) * 0.5 - p[2]];
}
const VIEW3: V3 = norm3([1, 1, 1]);
const MVIEW3: V3 = norm3([-1, 1, 1]); // the camera, seen from mirrored craft space
const LIGHT3: V3 = norm3([0.25, 0.55, 0.8]);
const MLIGHT3: V3 = norm3([-0.25, 0.55, 0.8]);
const depthOf = (p: V3): number => MX * p[0] + p[1] + p[2];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function signedArea(pts: P2[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}
/** Miter offset of a polygon; d < 0 insets. */
function offsetPoly(pts: P2[], d: number): P2[] {
  const n = pts.length;
  const s = signedArea(pts) > 0 ? 1 : -1;
  return pts.map((b, i) => {
    const a = pts[(i - 1 + n) % n];
    const c = pts[(i + 1) % n];
    const e1 = v2norm(v2sub(b, a));
    const e2 = v2norm(v2sub(c, b));
    const n1: P2 = [s * e1[1], -s * e1[0]];
    const n2: P2 = [s * e2[1], -s * e2[0]];
    const k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    let m: P2 = k > 1e-4 ? v2mul(v2add(n1, n2), d / k) : v2mul(n1, d);
    const ml = Math.hypot(m[0], m[1]);
    if (ml > Math.abs(d) * 2.6) m = v2mul(m, (Math.abs(d) * 2.6) / ml);
    return v2add(b, m);
  });
}
function pathOf(pts: P2[], close = true): string {
  let d = '';
  for (let i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + fmt(pts[i][0]) + ',' + fmt(pts[i][1]);
  return close && pts.length > 2 ? d + 'Z' : d;
}

/* =========================================================================
 * 3. Motion model (pure). u = t / LOOP_SECONDS; whole cycles per loop.
 * ====================================================================== */

export function floatSignal(u: number): number {
  return 0.82 * Math.sin(TAU * 4 * u) + 0.18 * Math.sin(TAU * 9 * u + 1.3);
}
export function rollSway(u: number): number {
  return 1.35 * Math.sin(TAU * 3 * u + 0.7) + 0.5 * Math.sin(TAU * 7 * u + 2.1);
}
export function yawSway(u: number): number {
  return 1.3 * Math.sin(TAU * 2 * u + 1.9) + 0.55 * Math.sin(TAU * 5 * u + 0.3);
}
/** Trailing-edge flap flex, degrees; panel 0 (root) .. 3 (tip) lags outward. */
export function flapDeflection(u: number, i: number): number {
  return 2.6 * Math.sin(TAU * 4 * u - 0.6 - 0.45 * i);
}
/** Tail fin tip flex, degrees; lags the float. */
export function finFlex(u: number): number {
  return 1.5 * Math.sin(TAU * 4 * u - 1.5) + 0.3 * Math.sin(TAU * 9 * u + 0.4);
}

export interface Steer {
  yaw: number;
  roll: number;
  pitch: number;
  px: number;
  py: number;
}
export const STEER_ZERO: Steer = { yaw: 0, roll: 0, pitch: 0, px: 0, py: 0 };

export interface FigBounds {
  cx: number;
  cy: number;
  ex: number; // island half-width on screen
  up: number; // island extent above / below its ground centre
  dn: number;
}
export interface Layout {
  W: number;
  H: number;
  upp: number;
  Vw: number;
  Vh: number;
  vx: number;
  vy: number;
  cx: number;
  cy: number;
  D: number; // water tile period along x = island travel per loop
  m: number; // wave lines per tile period (integer)
}

export function layoutFor(W: number, H: number, fb: FigBounds): Layout {
  let upp = Math.max(DESIGN_W / W, DESIGN_H / H);
  if (H * upp > VH_MAX) upp = VH_MAX / H;
  const Vw = W * upp;
  const Vh = H * upp;
  const cx = fb.cx + 0.5 * VIEW_SHIFT;
  const cy = fb.cy - IC * VIEW_SHIFT;
  const vx = cx - Vw / 2;
  const vy = cy - Vh / 2;
  const out = (x: number): boolean => {
    const s = iso([x, ISL_Y, 0]);
    return s[0] + fb.ex < vx || s[0] - fb.ex > vx + Vw || s[1] + fb.dn < vy || s[1] - fb.up > vy + Vh;
  };
  let xa = 0;
  while (!out(xa) && xa > -8000) xa -= 20;
  let xb = 0;
  while (!out(xb) && xb < 8000) xb += 20;
  const half = Math.max(-xa, xb) + 80;
  const D = Math.max(2000, 400 * Math.ceil((2 * half) / 400));
  return { W, H, upp, Vw, Vh, vx, vy, cx, cy, D, m: Math.round(D / 38) };
}

export interface Frame {
  u: number;
  s: number;
  alt: number; // units
  altM: number;
  scale: number;
  roll: number;
  yaw: number;
  pitch: number;
  px: number;
  py: number;
  flaps: number[];
  fin: number;
  glow: number;
  boost: number;
  speedU: number;
  scroll: number;
  islandX: number;
  ias: number;
  heading: number;
}

/** Assemble progress per part: each part waits its stagger delay, then flies
 * home over the remaining window with a soft overshoot. k = 0 settles first. */
export function assembleK(partIndex: number, partCount: number, t: number): number {
  const span = ASSEMBLE_SECONDS * (1 - ASSEMBLE_STAGGER);
  const d = partCount > 1 ? (ASSEMBLE_SECONDS * ASSEMBLE_STAGGER * partIndex) / (partCount - 1) : 0;
  const x = clamp((t - d) / span, 0, 1);
  const c = 1.35; // easeOutBack-lite: settles with a 4 % overshoot
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
}
/** Deterministic scatter offset for a part: outward from the craft centre,
 * scaled by part size so big shells travel further than small fittings. */
export function scatterOf(id: string, cx: number, cyy: number, span: number): P2 {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  const r1 = mulberry32(h)();
  const r2 = mulberry32(h ^ 0x9e3779b9)();
  const a = r1 * TAU;
  const dist = (300 + 520 * r2) * clamp(span / 300, 0.5, 1.5);
  const dx = Math.cos(a) * dist - cx * 0.35;
  const dy = Math.sin(a) * dist * 0.72 - cyy * 0.35 - 120;
  return [dx, dy];
}

/** tBody drives float, sway, flex and glow; tScene drives the sea and the island. */
export function frameAt(tBody: number, tScene: number, boost: number, st: Steer, L: Layout): Frame {
  const u = tBody / LOOP_SECONDS;
  const s = floatSignal(u);
  const alt = ALT0 + ALT_AMP * s;
  const uS = tScene / LOOP_SECONDS;
  const speedU = (L.D / LOOP_SECONDS) * (1 + BOOST_GAIN * boost);
  const yaw = yawSway(u) + st.yaw;
  let heading = (COURSE_DEG + yaw) % 360;
  if (heading < 0) heading += 360;
  return {
    u,
    s,
    alt,
    altM: alt * M_PER_U,
    scale: 1 + SCALE_AMP * s,
    roll: rollSway(u) + st.roll,
    yaw,
    pitch: st.pitch,
    px: st.px,
    py: st.py,
    flaps: [0, 1, 2, 3].map((i) => flapDeflection(u, i)),
    fin: finFlex(u),
    glow: (0.8 + 0.2 * s) * (1 + 2.2 * boost),
    boost,
    speedU,
    scroll: -L.D * uS, // flipped: the sea streams toward -x (craft runs +x)
    islandX: L.D * (0.5 - uS), // flipped: the cay enters top-left, exits bottom-right
    ias: speedU * M_PER_U * MS_TO_KT,
    heading,
  };
}

/** Attitude about the craft origin: pitch (nose up +), roll (starboard down +), yaw (nose to starboard +). */
function rotAtt(p: V3, yaw: number, roll: number, pitch: number): V3 {
  let [x, y, z] = p;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  [x, z] = [x * cp + z * sp, -x * sp + z * cp];
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  [y, z] = [y * cr + z * sr, -y * sr + z * cr];
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  [x, y] = [x * cy + y * sy, -x * sy + y * cy];
  return [x, y, z];
}

/** Screen affine [a b c d e f] that applies an attitude; exact on the plane z = zRef. */
function attAffine(f: { yaw: number; roll: number; pitch: number }, zRef: number, ground: boolean): number[] {
  return withCraft(() => attAffineInner(f, zRef, ground));
}
function attAffineInner(f: { yaw: number; roll: number; pitch: number }, zRef: number, ground: boolean): number[] {
  const R = (p: V3): V3 => {
    const q = rotAtt(p, f.yaw * DEG, f.roll * DEG, f.pitch * DEG);
    return ground ? [q[0], q[1], 0] : q;
  };
  const P: V3[] = [[0, 0, zRef], [100, 0, zRef], [0, 100, zRef]];
  const s = P.map(iso);
  const d = P.map((p) => iso(R(p)));
  const u1 = v2sub(s[1], s[0]);
  const u2 = v2sub(s[2], s[0]);
  const w1 = v2sub(d[1], d[0]);
  const w2 = v2sub(d[2], d[0]);
  const det = u1[0] * u2[1] - u2[0] * u1[1];
  const i00 = u2[1] / det;
  const i01 = -u2[0] / det;
  const i10 = -u1[1] / det;
  const i11 = u1[0] / det;
  const a = w1[0] * i00 + w2[0] * i10;
  const c = w1[0] * i01 + w2[0] * i11;
  const b = w1[1] * i00 + w2[1] * i10;
  const dd = w1[1] * i01 + w2[1] * i11;
  return [a, b, c, dd, d[0][0] - (a * s[0][0] + c * s[0][1]), d[0][1] - (b * s[0][0] + dd * s[0][1])];
}

/* =========================================================================
 * 4. Mesh kit: faces with facing tones, edges from silhouettes and creases
 * ====================================================================== */

type Tone = 'top' | 't1' | 't2' | 't3' | 'rc';
const TONES: Tone[] = ['t3', 't2', 't1', 'top', 'rc'];
function toneOf(n: V3, L: V3 = LIGHT3): Tone {
  const b = dot3(n, L);
  return b > 0.7 ? 'top' : b > 0.47 ? 't1' : b > 0.22 ? 't2' : 't3';
}

interface Face3 {
  v: V3[];
  n: V3;
  front: boolean;
  tone: Tone;
}
interface Det {
  d: string;
  cls: string;
  k: 'line' | 'dots' | 'face';
}
export interface Part {
  id: string;
  faces: Face3[];
  ink: boolean;
  det: Det[];
  over: string[];
  min: V3;
  max: V3;
  plan: P2[][];
  dyn?: string;
  items?: Item[];
}
/** A depth-sorted drawing item (palm clusters are drawn leaf by leaf). */
interface Item {
  fills: { d: string; cls: string }[];
  lines: string;
  rib?: string;
  dots?: string;
  dep: number;
}

function newell(vs: V3[]): V3 {
  const n: V3 = [0, 0, 0];
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i];
    const b = vs[(i + 1) % vs.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm3(n);
}
function dedupe3(vs: V3[]): V3[] {
  const out: V3[] = [];
  for (const p of vs) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 1e-3) out.push(p);
  }
  while (out.length > 2) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-3) out.pop();
    else break;
  }
  return out;
}

class Model {
  parts: Part[] = [];
  private p: Part | null = null;
  begin(id: string, o: { over?: string[]; ink?: boolean; dyn?: string } = {}): void {
    this.p = { id, faces: [], ink: !!o.ink, det: [], over: o.over ?? [], min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9], plan: [], dyn: o.dyn };
  }
  /** A face, oriented so its normal agrees with the outward hint. */
  face(v: V3[], hint: V3, tone?: Tone): void {
    const p = this.p as Part;
    const vs = dedupe3(v);
    if (vs.length < 3) return;
    let n = newell(vs);
    if (dot3(n, hint) < 0) {
      vs.reverse();
      n = mul3(n, -1);
    }
    // bounds are stored in projected (mirrored for craft) space so the painter's
    // separation tests and depth keys work unchanged; front/tone use the mirror
    const V = MX < 0 ? MVIEW3 : VIEW3;
    const L = MX < 0 ? MLIGHT3 : LIGHT3;
    p.faces.push({ v: vs, n, front: dot3(n, V) > 1e-3, tone: tone ?? toneOf(n, L) });
    for (const q of vs) {
      const qm: V3 = [MX * q[0], q[1], q[2]];
      for (let k = 0; k < 3; k++) {
        p.min[k] = Math.min(p.min[k], qm[k]);
        p.max[k] = Math.max(p.max[k], qm[k]);
      }
    }
  }
  plan(pts: P2[]): void {
    (this.p as Part).plan.push(pts);
  }
  det(d: string, cls: string, k: Det['k'] = 'line'): void {
    if (d) (this.p as Part).det.push({ d, cls, k });
  }
  end(): Part {
    const p = this.p as Part;
    this.parts.push(p);
    this.p = null;
    return p;
  }
}

const key3 = (p: V3): string => `${Math.round(p[0] * 200)},${Math.round(p[1] * 200)},${Math.round(p[2] * 200)}`;

/** Visible structure edges: silhouettes, open boundaries and creases over 28°. */
function edgesPath(faces: Face3[], crease = 0.883): string {
  const m = new Map<string, { a: V3; b: V3; f: Face3[] }>();
  for (const f of faces) {
    for (let i = 0; i < f.v.length; i++) {
      const a = f.v[i];
      const b = f.v[(i + 1) % f.v.length];
      const ka = key3(a);
      const kb = key3(b);
      const k = ka < kb ? ka + '|' + kb : kb + '|' + ka;
      let e = m.get(k);
      if (!e) {
        e = { a, b, f: [] };
        m.set(k, e);
      }
      e.f.push(f);
    }
  }
  let d = '';
  for (const e of m.values()) {
    const fr = e.f.filter((f) => f.front);
    if (!fr.length) continue;
    let show = e.f.length === 1 || fr.length < e.f.length;
    for (let i = 1; !show && i < fr.length; i++) if (dot3(fr[0].n, fr[i].n) < crease) show = true;
    if (show) {
      const p = iso(e.a);
      const q = iso(e.b);
      d += `M${fmt(p[0])},${fmt(p[1])}L${fmt(q[0])},${fmt(q[1])}`;
    }
  }
  return d;
}

/** Front faces merged per tone, back to front. */
function fillPaths(faces: Face3[]): Partial<Record<Tone, string>> {
  const out: Partial<Record<Tone, string>> = {};
  faces
    .filter((f) => f.front)
    .sort((a, b) => depthOf(avg3(a.v)) - depthOf(avg3(b.v)))
    .forEach((f) => {
      out[f.tone] = (out[f.tone] ?? '') + pathOf(f.v.map(iso));
    });
  return out;
}
function frontPath(faces: Face3[]): string {
  return faces
    .filter((f) => f.front)
    .map((f) => pathOf(f.v.map(iso)))
    .join('');
}

type Xf = (p: V3) => V3;
const IDX: Xf = (p) => p;

/** Extruded plan with an optional top chamfer; xf maps the built solid into place. */
function prism(M: Model, plan: P2[], h0: number, h1: number, ch = 0, xf: Xf = IDX): void {
  const s = signedArea(plan) > 0 ? 1 : -1;
  const top = ch > 0 ? offsetPoly(plan, -ch) : plan;
  const lo = plan.map(([a, b]) => xf([a, b, h0]));
  const mi = plan.map(([a, b]) => xf([a, b, h1 - ch]));
  const hi = top.map(([a, b]) => xf([a, b, h1]));
  const c: V3 = [plan.reduce((t, p) => t + p[0], 0) / plan.length, plan.reduce((t, p) => t + p[1], 0) / plan.length, (h0 + h1) / 2];
  const dir = (d: V3): V3 => sub3(xf(add3(c, d)), xf(c));
  for (let i = 0; i < plan.length; i++) {
    const j = (i + 1) % plan.length;
    const e = v2norm(v2sub(plan[j], plan[i]));
    const out = dir([s * e[1], -s * e[0], 0]);
    M.face([lo[i], lo[j], mi[j], mi[i]], out);
    if (ch > 0) M.face([mi[i], mi[j], hi[j], hi[i]], add3(out, dir([0, 0, 1])));
  }
  M.face(hi, dir([0, 0, 1]));
  M.face(lo.slice().reverse(), dir([0, 0, -1]));
  M.plan(plan.map(([a, b]) => {
    const q = xf([a, b, h0]);
    return [q[0], q[1]] as P2;
  }));
}

/** Tapered solid between two plans (rocks). */
function frustum(M: Model, bot: P2[], top: P2[], h0: number, h1: number): void {
  const n = bot.length;
  const lo = bot.map(([a, b]) => [a, b, h0] as V3);
  const hi = top.map(([a, b]) => [a, b, h1] as V3);
  const c = avg3([...lo, ...hi]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const q = [lo[i], lo[j], hi[j], hi[i]];
    M.face(q, sub3(avg3(q), c));
  }
  M.face(hi, [0, 0, 1]);
  M.face(lo.slice().reverse(), [0, 0, -1]);
  M.plan(bot);
}

interface Sec {
  a: number;
  cb: number;
  ch: number;
  rb: number;
  rh: number;
  e: number;
}
function ringPt(s: Sec, th: number): V3 {
  const c = Math.cos(th);
  const sn = Math.sin(th);
  const k = 2 / s.e;
  return [s.a, s.cb + s.rb * Math.sign(c) * Math.pow(Math.abs(c), k), s.ch + s.rh * Math.sign(sn) * Math.pow(Math.abs(sn), k)];
}

/** Body lofted along x through superellipse sections; arc limits it to a dome. */
function loft(M: Model, secs: Sec[], segs: number, o: { arc?: [number, number]; capA?: boolean; capB?: boolean } = {}): void {
  const closed = !o.arc;
  const K = closed ? segs : segs + 1;
  const th = (k: number): number => (closed ? (k / segs) * TAU : (o.arc as [number, number])[0] + (((o.arc as [number, number])[1] - (o.arc as [number, number])[0]) * k) / segs);
  const R = secs.map((s) => Array.from({ length: K }, (_, k) => ringPt(s, th(k))));
  for (let i = 0; i + 1 < secs.length; i++) {
    for (let k = 0; k < segs; k++) {
      const k2 = closed ? (k + 1) % segs : k + 1;
      const q = [R[i][k], R[i][k2], R[i + 1][k2], R[i + 1][k]];
      const c = avg3(q);
      M.face(q, sub3(c, [c[0], (secs[i].cb + secs[i + 1].cb) / 2, (secs[i].ch + secs[i + 1].ch) / 2]));
    }
  }
  if (o.capA) M.face(R[0].slice(), [-1, 0, 0]);
  if (o.capB) M.face(R[R.length - 1].slice(), [1, 0, 0]);
  M.plan([...secs.map((s) => [s.a, s.cb + s.rb] as P2), ...secs.slice().reverse().map((s) => [s.a, s.cb - s.rb] as P2)]);
}

/** Near-side annulus where a sleeve steps down to the body behind it, facing aft. */
function endRing(M: Model, inner: Sec, outer: Sec, segs: number, arc?: [number, number]): void {
  const th = (k: number): number => (arc ? arc[0] + ((arc[1] - arc[0]) * k) / segs : (k / segs) * TAU);
  for (let k = 0; k < segs; k++) {
    const t0 = th(k);
    const t1 = th(k + 1);
    const tm = (t0 + t1) / 2;
    if (Math.cos(tm) + Math.sin(tm) <= 0) continue; // far side: the body behind hides it
    M.face([ringPt(inner, t0), ringPt(outer, t0), ringPt(outer, t1), ringPt(inner, t1)], [1, 0, 0]);
  }
}

/** Round tube along a 3D path (palm trunks). */
function tube(M: Model, path: V3[], radii: number[], segs = 8): void {
  const rings = path.map((c, i) => {
    const t = norm3(sub3(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]));
    const u = norm3(Math.abs(t[2]) < 0.9 ? cross3(t, [0, 0, 1]) : cross3(t, [1, 0, 0]));
    const v = cross3(t, u);
    return Array.from({ length: segs }, (_, k) => {
      const a = (k / segs) * TAU;
      return add3(c, add3(mul3(u, radii[i] * Math.cos(a)), mul3(v, radii[i] * Math.sin(a))));
    });
  });
  for (let i = 0; i + 1 < rings.length; i++) {
    const ax = mul3(add3(path[i], path[i + 1]), 0.5);
    for (let k = 0; k < segs; k++) {
      const q = [rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]];
      M.face(q, sub3(avg3(q), ax));
    }
  }
  const n = path.length - 1;
  M.face(rings[n].slice(), sub3(path[n], path[n - 1]));
}

/** Visible runs of a section ring: they end on the body's outline. */
function ringRuns(s: Sec, n = 72, onlyTop = false): V3[][] {
  const runs: V3[][] = [];
  let cur: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * TAU;
    const p = ringPt(s, th);
    const y = p[1] - s.cb;
    const z = p[2] - s.ch;
    const ny = (Math.sign(y) * Math.pow(Math.abs(y / s.rb), s.e - 1)) / s.rb;
    const nz = (Math.sign(z) * Math.pow(Math.abs(z / s.rh), s.e - 1)) / s.rh;
    const vis = ny + nz > 0 && (!onlyTop || z >= -1e-6);
    if (vis) cur.push(p);
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  return runs.filter((r) => r.length > 1);
}
function circ3(c: V3, n: V3, r: number, seg = 12): V3[] {
  const u = norm3(Math.abs(n[2]) < 0.9 ? cross3(n, [0, 0, 1]) : cross3(n, [1, 0, 0]));
  const v = cross3(n, u);
  return Array.from({ length: seg }, (_, i) => {
    const a = (i / seg) * TAU;
    return add3(c, add3(mul3(u, r * Math.cos(a)), mul3(v, r * Math.sin(a))));
  });
}
const line3 = (pts: V3[]): string => pathOf(pts.map(iso), false);
const loop3 = (pts: V3[]): string => pathOf(pts.map(iso), true);
function dots3(pts: V3[], n: V3, r = 1.1): string {
  return pts.map((p) => loop3(circ3(p, n, r, 10))).join('');
}

/* =========================================================================
 * 5. The craft, SK-4 Shearwater (original). Craft frame = world axes:
 *    a aft (x), b starboard (y), h up (z). It flies toward -x.
 * ====================================================================== */

const smooth = (t: number): number => t * t * (3 - 2 * t);
function hullHalf(a: number): number {
  if (a < -60) {
    const t = Math.min(1, (-60 - a) / 190);
    return 46 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.8)), 0.55);
  }
  if (a <= 110) return 46;
  return 46 - 22 * smooth(Math.min(1, (a - 110) / 74));
}
function hullTop(a: number): number {
  if (a < -60) return 30 - 12 * Math.pow(Math.min(1, (-60 - a) / 190), 1.5);
  return a <= 110 ? 30 : 30 - 6 * smooth(Math.min(1, (a - 110) / 74));
}
function hullBot(a: number): number {
  if (a < -60) return 2 + 8 * Math.pow(Math.min(1, (-60 - a) / 190), 1.5);
  return a <= 110 ? 2 : 2 + 6 * smooth(Math.min(1, (a - 110) / 74));
}
function hullSec(a: number): Sec {
  const w = hullHalf(a);
  const f = Math.min(1, w / 46);
  return { a, cb: 0, ch: (hullTop(a) + hullBot(a)) / 2, rb: Math.max(w, 0.02), rh: Math.max(((hullTop(a) - hullBot(a)) / 2) * Math.pow(f, 0.35), 0.02), e: 2.6 };
}
/** Height of a section's upper surface at lateral position b. */
function surfH(s: Sec, b: number): number {
  const x = clamp(Math.abs(b - s.cb) / s.rb, 0, 1);
  return s.ch + s.rh * Math.pow(1 - Math.pow(x, s.e), 1 / s.e);
}
function nacR(a: number): number {
  if (a < -20) return 14 + 3.5 * Math.sqrt(clamp((a + 30) / 10, 0, 1));
  return a < 140 ? 17.5 : 17.5 - 4.5 * smooth(clamp((a - 140) / 44, 0, 1));
}
function floatSec(a: number, cb: number): Sec {
  const f = a < 4 ? Math.pow(Math.max(0, 1 - ((4 - a) / 40) ** 2), 0.6) : 1;
  return { a, cb, ch: 13 + 5 * (1 - f), rb: Math.max(16 * f, 0.02), rh: 13 * (0.35 + 0.65 * f), e: 2.4 };
}

const WING_R: P2[] = [[-54.6, 46], [-8, 128], [32.7, 258], [96.1, 258], [99.9, 46]];
const ah = (b: number): number => 99.9 - (3.8 * (Math.abs(b) - 46)) / 212;
const flapChord = (b: number): number => 42 - (12 * (Math.abs(b) - 40)) / 222;
const FLAP_SPANS: [number, number][] = [[92, 133.5], [133.5, 175], [175, 216.5], [216.5, 258]];
const NOZ: V3 = [198, 72, -7.5]; // ventral sling: the nacelle crown (r 17.5) sits flush with the wing underside (z = 10)
const WAKE_SRC: P2 = [40, 170];
const MIR = (side: number): Xf => (p) => [p[0], side * p[1], p[2]];
const SIDES: [number, 'L' | 'R'][] = [[-1, 'L'], [1, 'R']];

function screws(M: Model, pts: V3[], n: V3): void {
  M.det(dots3(pts, n, 1.5), 'rv', 'dots');
  M.det(pts.map((p) => line3([add3(p, [-1.05, 0.0, 0]), add3(p, [1.05, 0, 0])].map((q) => (n[2] > 0.5 ? q : p)))).join(''), 'sl');
}
/** Rounded rectangle lifted onto a surface h(a, b). */
function patch(a0: number, a1: number, b0: number, b1: number, r: number, hf: (a: number, b: number) => number, side = 1): V3[] {
  const pts: P2[] = [];
  const cs: [number, number, number][] = [[a1 - r, b0 + r, -Math.PI / 2], [a1 - r, b1 - r, 0], [a0 + r, b1 - r, Math.PI / 2], [a0 + r, b0 + r, Math.PI]];
  for (const [ca, cb, s0] of cs) for (let i = 0; i <= 3; i++) {
    const t = s0 + (i / 3) * (Math.PI / 2);
    pts.push([ca + r * Math.cos(t), cb + r * Math.sin(t)]);
  }
  return pts.map(([a, b]) => [a, side * b, hf(a, side * b) + 0.06] as V3);
}

export function addFlap(M: Model, side: number, i: number, deg: number): void {
  withCraft(() => addFlapInner(M, side, i, deg));
}
function addFlapInner(M: Model, side: number, i: number, deg: number): void {
  const [b0, b1] = FLAP_SPANS[i];
  const plan: P2[] = [[ah(b0), b0], [ah(b1), b1], [ah(b1) + flapChord(b1), b1], [ah(b0) + flapChord(b0), b0]];
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  const xf: Xf = (p) => {
    const a0 = ah(p[1]);
    const da = p[0] - a0;
    const dh = p[2] - 12;
    return [a0 + da * c + dh * s, side * p[1], 12 - da * s + dh * c];
  };
  const S = side > 0 ? 'R' : 'L';
  M.begin(`flap${S}${i}`, { dyn: `flap${S}${i}` });
  prism(M, plan, 10.7, 13.3, 0.7, xf);
  M.end();
}

export function addFin(M: Model, side: number, flex: number): void {
  withCraft(() => addFinInner(M, side, flex));
}
function addFinInner(M: Model, side: number, flex: number): void {
  const S = side > 0 ? 'R' : 'L';
  const xf: Xf = ([a, s, t]) => {
    const g = (35 + flex * (s / 90) ** 2) * DEG;
    return [a, side * (14 + s * Math.cos(g) - t * Math.sin(g)), 30 + s * Math.sin(g) + t * Math.cos(g)];
  };
  M.begin(`fin${S}`, { dyn: `fin${S}` });
  const plan: P2[] = [[104, 0], [176, 0], [190, 90], [152, 90]];
  prism(M, plan, -1.2, 1.2, 0.5, xf);
  const up = (a: number, s: number): V3 => xf([a, s, 1.25]);
  M.det(line3([up(104 + 72 * 0.72, 1), up(152 + 38 * 0.72, 89)]), 'sm');
  M.det(line3([up(150.3, 85.5), up(188.6, 85.5)]), 'sm');
  M.det(dots3([0.15, 0.35, 0.55, 0.75].map((f) => up(104 + 72 * f, 4)), norm3(sub3(up(140, 4.5), xf([140, 4.5, 0]))), 0.9), 'rv', 'dots');
  M.end();
}

export const ORDER_RULES: [string, string][] = [
  ['rail', 'hull'], ['canopy', 'hull'], ['cbar*', 'canopy'], ['dome', 'hull'], ['antenna', 'spine3'],
  ['canardR', 'hull'], ['hull', 'canardL'], ['cap*', 'spine*'],
  ['nacR', 'fairR'], ['lipR', 'fairR'], ['bandR', 'fairR'], ['shieldR', 'fairR'], ['nozzleR', 'fairR'], ['bowR', 'wingR'],
  ['fairL', 'nacL'], ['fairL', 'lipL'], ['fairL', 'bandL'], ['fairL', 'shieldL'], ['fairL', 'nozzleL'], ['wingL', 'bowL'],
  ...(['L', 'R'] as const).flatMap((S): [string, string][] => [
    [`lip${S}`, `nac${S}`], [`band${S}`, `nac${S}`], [`shield${S}`, `nac${S}`], [`nozzle${S}`, `nac${S}`],
    [`light${S}`, `float${S}`], [`sfin${S}`, `float${S}`],
    [`flap${S}*`, `wing${S}`], [`bracket${S}*`, `flap${S}*`],
    [`fin${S}`, `nac${S}`], [`fin${S}`, `shield${S}`], [`fin${S}`, `nozzle${S}`], [`fin${S}`, 'hull'], [`fin${S}`, `fair${S}`], [`fin${S}`, `band${S}`],
  ]),
];

function buildCraft(): Model {
  return withCraft(() => buildCraftInner());
}
function buildCraftInner(): Model {
  const M = new Model();

  /* hull with pitot, section seams, rivet rows, hatches and vents */
  const HA = [-250, -249, -247, -244, -240, -235, -229, -222, -214, -205, -195, -184, -172, -159, -145, -130, -114, -97, -80, -60, -30, 0, 30, 60, 90, 110, 122, 134, 146, 158, 170, 178, 184];
  M.begin('hull');
  loft(M, HA.map(hullSec), 32, { capB: true });
  M.det(line3([[-250.3, 0, 14], [-262, 0, 14]]), 'ln');
  M.det(dots3([[-263.2, 0, 14]], VIEW3, 1.2), 'rv tip', 'dots');
  for (const a of [-236, -96, -36, 24, 84, 132, 166]) for (const run of ringRuns(hullSec(a))) M.det(line3(run), 'sm');
  for (const th of [0.5, Math.PI - 1.15]) {
    const pts: V3[] = [];
    for (let a = -88; a <= 128; a += 8) pts.push(ringPt(hullSec(a), th));
    M.det(dots3(pts, norm3([0, Math.cos(th), Math.sin(th)])), 'rv', 'dots');
  }
  const hs = (a: number, b: number): number => surfH(hullSec(a), b);
  for (const side of [-1, 1]) {
    for (const [a0, a1] of [[-28, -10], [30, 48]]) {
      M.det(loop3(patch(a0, a1, 23, 32, 2, hs, side)), 'sm');
      screws(M, [[a0 + 2.2, 25.2], [a1 - 2.2, 25.2], [a1 - 2.2, 29.8], [a0 + 2.2, 29.8]].map(([a, b]) => [a, side * b, hs(a, side * b) + 0.1] as V3), [0, 0, 1]);
    }
    for (const [a0, a1] of [[-72, -60], [58, 70]]) {
      M.det(loop3(patch(a0, a1, 23, 32, 0.8, hs, side)), 'vt', 'face');
      for (let k = 1; k <= 3; k++) {
        const a = a0 + ((a1 - a0) * k) / 4;
        M.det(line3([[a, side * 23.6, hs(a, side * 23.6) + 0.1], [a, side * 31.4, hs(a, side * 31.4) + 0.1]]), 'ln');
      }
    }
  }
  M.end();

  /* raised armour: rail, seven segments, two caps, antenna */
  M.begin('rail', { over: ['hull'] });
  prism(M, [[-96, -21], [100, -21], [100, 21], [-96, 21]], 28.8, 32, 1.2);
  M.end();
  const segL = (188 - 24) / 7;
  for (let j = 0; j < 7; j++) {
    const y0 = -92 + j * (segL + 4);
    const y1 = y0 + segL;
    const hw = j === 0 ? 13 : 15;
    M.begin(`spine${j}`);
    prism(M, [[y0, -hw + 4], [y0 + 4, -hw], [y1 - 4, -hw], [y1, -hw + 4], [y1, hw - 4], [y1 - 4, hw], [y0 + 4, hw], [y0, hw - 4]], 32, 38, 2.4);
    M.det(dots3([-1, 1].flatMap((sd) => [0.25, 0.5, 0.75].map((f) => [y0 + segL * f, sd * (hw - 4.8), 38.05] as V3)), [0, 0, 1], 0.95), 'rv', 'dots');
    M.end();
    if (j === 1 || j === 4) {
      const c: P2 = [(y0 + y1) / 2, 0];
      M.begin(`cap${j}`);
      prism(M, Array.from({ length: 8 }, (_, k) => [c[0] + 4.2 * Math.cos((k * TAU) / 8 + 0.39), c[1] + 4.2 * Math.sin((k * TAU) / 8 + 0.39)] as P2), 38, 39.8, 0.6);
      M.end();
    }
  }
  M.begin('antenna', { over: ['spine3'] });
  prism(M, [[-6, -1.1], [10, -1.1], [8, 1.1], [-6, 1.1]], 38, 52, 0.4);
  M.end();

  for (const [k, sd] of [[0, -1], [1, 1]] as [number, number][]) {
    M.begin(`grip${k}`);
    prism(M, [[-62, sd * 16.5], [-50, sd * 16.5], [-50, sd * 19], [-62, sd * 19]], 32, 34.2, 0.5);
    M.end();
  }
  /* canopy with two frame bars and a glint line; sensor dome; stern cone */
  const canH = (a: number): [number, number] => {
    const t = clamp((a + 222) / 94, 0, 1);
    return [21 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.7), 13 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.9)), 0.6)];
  };
  const canSec = (a: number, g = 0): Sec => {
    const [w, h] = canH(a);
    return { a, cb: 0, ch: hullTop(a) - 0.6, rb: Math.max(w + g, 0.02), rh: Math.max(h + g, 0.02), e: 2.2 };
  };
  M.begin('canopy');
  loft(M, Array.from({ length: 17 }, (_, i) => canSec(-222 + (94 * i) / 16)), 20, { arc: [0, Math.PI] });
  M.det(line3(Array.from({ length: 12 }, (_, i) => ringPt(canSec(-206 + 4.6 * i), 1.05))), 'sm');
  M.end();
  for (const [k, a] of [[0, -186], [1, -157]]) {
    M.begin(`cbar${k}`);
    loft(M, [canSec(a - 1.6, 0.5), canSec(a + 1.6, 0.5)], 20, { arc: [0, Math.PI] });
    endRing(M, canSec(a + 1.6), canSec(a + 1.6, 0.5), 20, [0, Math.PI]);
    M.end();
  }
  M.begin('dome');
  loft(M, Array.from({ length: 9 }, (_, i) => {
    const a = 144 + 2 * i;
    const r = Math.sqrt(Math.max(64 - (a - 152) ** 2, 0.0004));
    return { a, cb: 0, ch: hullTop(152) - 0.5, rb: r, rh: r, e: 2 };
  }), 16, { arc: [0, Math.PI] });
  for (const run of ringRuns({ a: 152, cb: 0, ch: hullTop(152) - 0.5 + 2.2, rb: 7.7, rh: 0.01, e: 2 })) M.det(line3(run), 'sm');
  M.end();
  M.begin('scone');
  loft(M, [184, 188, 192].map((a, i) => ({ a, cb: 0, ch: 17, rb: 9 - 2 * i, rh: 9 - 2 * i, e: 2 })), 20, { capB: true });
  M.end();

  for (const [side, S] of SIDES) {
    const X = MIR(side);
    /* canard */
    M.begin(`canard${S}`);
    prism(M, [[-174, hullHalf(-174)], [-142, 124], [-126, 126], [-146, hullHalf(-146)]], 13, 16, 1, X);
    M.det(line3([X([-160, hullHalf(-160) + 1, 16.03]), X([-131, 124.4, 16.03])]), 'sm');
    M.end();

    /* wing with seams, spar rivets, intake vents and hatches */
    M.begin(`wing${S}`);
    prism(M, WING_R, 10, 14, 1.4, X);
    const q = offsetPoly(WING_R, -1.4);
    const at = (p0: P2, p1: P2, b: number): P2 => {
      const t = (b - p0[1]) / (p1[1] - p0[1]);
      return [p0[0] + (p1[0] - p0[0]) * t, b];
    };
    const LE = (b: number): P2 => (b <= q[1][1] ? at(q[0], q[1], b) : at(q[1], q[2], b));
    const TE = (b: number): P2 => at(q[3], q[4], b);
    const W = (p: P2): V3 => X([p[0], p[1], 14.03]);
    [[104, 110], [168, 174], [224, 229]].forEach(([b0, b1]) => {
      const A = LE(b0);
      const B = TE(b1);
      const C: P2 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 11];
      const pts: V3[] = [];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        const u = 1 - t;
        pts.push(W([u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]));
      }
      M.det(line3(pts), 'sm');
    });
    const spB: P2 = [q[2][0] + (q[3][0] - q[2][0]) * 0.47, q[2][1]];
    const spA: P2 = [47 + ((spB[0] - 47) * (77 - 80)) / (spB[1] - 80), 77]; // starts under the nacelle
    M.det(line3([W(spA), W(spB)]), 'sm');
    const rv: V3[] = [];
    for (let b = 98; b <= 248; b += 8) {
      const t = (b - spA[1]) / (spB[1] - spA[1]);
      const a = spA[0] + (spB[0] - spA[0]) * t;
      rv.push(W([a - 2.6, b]), W([a + 2.6, b]));
    }
    M.det(dots3(rv, [0, 0, 1], 0.9), 'rv', 'dots');
    for (const ca of [19, 67]) {
      const pts: P2[] = [];
      for (let k = 0; k <= 10; k++) {
        const s = k / 10;
        pts.push([ca + 14 * s, 148 + 3.3 * Math.pow(Math.sin((Math.PI / 2) * s), 0.8) * (s > 0.8 ? Math.cos(((s - 0.8) / 0.2) * (Math.PI / 2)) : 1)]);
      }
      const all = [...pts, ...pts.slice(1, -1).reverse().map(([a, b]) => [a, 296 - b] as P2)];
      M.det(loop3(all.map(W)), 'vt', 'face');
    }
    for (const [a0, a1, b0, b1] of [[66, 80, 186, 202], [70, 84, 234, 248]]) {
      M.det(loop3(patch(a0, a1, b0, b1, 2, () => 14, side)), 'sm');
      screws(M, [[a0 + 2, b0 + 2], [a1 - 2, b0 + 2], [a1 - 2, b1 - 2], [a0 + 2, b1 - 2]].map(([a, b]) => X([a, b, 14.08])), [0, 0, 1]);
    }
    M.end();

    /* hinge brackets, fence and vortex generators */
    [96, 133.5, 175, 216.5, 254].forEach((b, k) => {
      M.begin(`bracket${S}${k}`);
      prism(M, [[ah(b) - 8, b - 2], [ah(b) + 0.5, b - 2], [ah(b) + 0.5, b + 2], [ah(b) - 8, b + 2]], 14, 16.4, 0.5, X);
      M.end();
    });
    M.begin(`fence${S}`);
    prism(M, [[-1, 126.6], [70, 126.6], [70, 129.4], [-1, 129.4]], 14, 17.4, 0.5, X);
    M.end();
    [140, 160, 180, 200, 220, 240].forEach((b, k) => {
      const a = -8 + (b - 128) * (40.7 / 130) + 12;
      const g = (k % 2 ? 15 : -15) * DEG;
      const d: P2 = [Math.cos(g), Math.sin(g)];
      const nn: P2 = [-d[1] * 0.45, d[0] * 0.45];
      M.begin(`vg${S}${k}`);
      prism(M, [[a - d[0] * 3.5 - nn[0], b - d[1] * 3.5 - nn[1]], [a + d[0] * 3.5 - nn[0], b + d[1] * 3.5 - nn[1]], [a + d[0] * 3.5 + nn[0], b + d[1] * 3.5 + nn[1]], [a - d[0] * 3.5 + nn[0], b - d[1] * 3.5 + nn[1]]], 14, 16.2, 0, X);
      M.end();
    });

    /* endplate float: bow cap (a step larger), hull, tip light, stern fin */
    const cb = side * 274;
    const FA = [4, 40, 90, 140, 164];
    M.begin(`bow${S}`);
    loft(M, [-36, -32, -26, -18, -8, 4].map((a) => {
      const s = floatSec(a, cb);
      return { ...s, rb: s.rb + 0.7, rh: s.rh + 0.7 };
    }), 24, { capB: true });
    M.det(loop3(circ3([-22, cb, surfH(floatSec(-22, cb), cb) + 0.75], [0, 0, 1], 1.8)), 'ln');
    M.end();
    M.begin(`float${S}`);
    loft(M, FA.map((a) => floatSec(a, cb)), 24, { capB: true });
    M.det(line3(FA.map((a) => ringPt(floatSec(a, cb), 0.35))), 'sm');
    M.det(dots3(Array.from({ length: 17 }, (_, k) => ringPt(floatSec(10 + 9 * k, cb), 0.62)), norm3([0, 0.8, 0.6]), 0.9), 'rv', 'dots');
    const fs = (a: number, b: number): number => surfH(floatSec(a, cb), b);
    M.det(loop3(patch(62, 84, -7, 6, 2, (a, b) => fs(a, b + cb)).map(([a, b, h]) => [a, b + cb, h] as V3)), 'sm');
    M.end();
    for (const [k, ca] of [[0, 20], [1, 130]] as [number, number][]) {
      M.begin(`cleat${S}${k}`);
      prism(M, [[ca - 4, cb - 1.5], [ca + 4, cb - 1.5], [ca + 4, cb + 1.5], [ca - 4, cb + 1.5]], 26, 28.4, 0.6);
      M.end();
    }
    M.begin(`light${S}`);
    loft(M, Array.from({ length: 7 }, (_, i) => {
      const a = 117 + i;
      const r = Math.sqrt(Math.max(9 - (a - 120) ** 2, 0.0004));
      return { a, cb, ch: 26, rb: r, rh: r, e: 2 };
    }), 12, { arc: [0, Math.PI] });
    M.end();
    M.begin(`sfin${S}`);
    prism(M, [[146, cb - 1.1], [178, cb - 1.1], [178, cb + 1.1], [146, cb + 1.1]], 25.5, 38, 0.5);
    M.end();

    /* nacelle: body, intake lip, band, heat shield, vent, nozzle (the accent) */
    const nb = side * NOZ[1];
    const nsec = (a: number, g = 0): Sec => ({ a, cb: nb, ch: NOZ[2], rb: nacR(a) + g, rh: nacR(a) + g, e: 2 });
    M.begin(`nac${S}`);
    loft(M, [-30, -28, -25, -22, -20, 0, 40, 80, 120, 140, 152, 164, 174, 184].map((a) => nsec(a)), 28, { capA: true });
    const vt = (a: number, th: number): V3 => ringPt(nsec(a), th);
    M.det(loop3([vt(96, 0.55), vt(112, 0.55), vt(112, 0.95), vt(96, 0.95)]), 'vt', 'face');
    for (let k = 1; k <= 3; k++) M.det(line3([vt(96 + 4 * k, 0.58), vt(96 + 4 * k, 0.92)]), 'ln');
    M.end();
    M.begin(`lip${S}`);
    loft(M, [-30, -27, -24].map((a) => nsec(a, 0.6)), 28);
    endRing(M, nsec(-24), nsec(-24, 0.6), 28);
    M.end();
    M.begin(`band${S}`);
    loft(M, [58, 66].map((a) => nsec(a, 0.45)), 28);
    endRing(M, nsec(66), nsec(66, 0.45), 28);
    M.det(dots3([0.2, 0.55, 0.9, 1.25].map((th) => ringPt(nsec(62, 0.45), th)), [0, 0.6, 0.8], 0.8), 'rv', 'dots');
    M.end();
    M.begin(`shield${S}`);
    loft(M, [142, 152, 164, 174].map((a) => nsec(a, 0.6)), 28);
    endRing(M, nsec(174), nsec(174, 0.6), 28);
    for (const a of [152, 164]) for (const run of ringRuns(nsec(a, 0.6))) M.det(line3(run), 'sm');
    M.end();
    M.begin(`nozzle${S}`, { ink: true });
    loft(M, [184, 191, 198].map((a, i) => ({ a, cb: nb, ch: NOZ[2], rb: 13 - 0.3 * i, rh: 13 - 0.3 * i, e: 2 })), 28, { capB: true });
    const inner = circ3([198.05, nb, NOZ[2]], [1, 0, 0], 8.4, 28);
    M.det(loop3(inner), 'f-rc', 'face');
    M.det(loop3(inner), 'ink');
    M.det(Array.from({ length: 10 }, (_, k) => {
      const t = (k / 10) * TAU;
      const d: V3 = [0, Math.cos(t), Math.sin(t)];
      return line3([add3([198.05, nb, NOZ[2]], mul3(d, 8.4)), add3([198.05, nb, NOZ[2]], mul3(d, 12.3))]);
    }).join(''), 'ln');
    M.end();

    /* fairing between hull and nacelle */
    M.begin(`fair${S}`);
    prism(M, [[-12, 46], [-16, 54.5], [170, 54.5], [164, 46]], 14, 30, 2, X);
    M.end();
  }

  /* moving parts at rest (rebuilt each frame by the engine) */
  for (const [side] of SIDES) {
    for (let i = 0; i < 4; i++) addFlap(M, side, i, 0);
    addFin(M, side, 0);
  }
  return M;
}

/* =========================================================================
 * 6. The island: one polar shoreline r(θ) shared by the SVG and the shader
 * ====================================================================== */

const ISL = { R0: 62, A: [0, -8, 4, 0, 2, 0], B: [0, 7, -3, 3, 0, 1.2] };
function islR(th: number): number {
  let r = ISL.R0;
  for (let k = 1; k <= 6; k++) r += ISL.A[k - 1] * Math.cos(k * th) + ISL.B[k - 1] * Math.sin(k * th);
  return r;
}

export interface IslandArt {
  base: Part;
  props: Part[];
  foot: P2[];
  rocks: [number, number, number][];
}

function buildIsland(): IslandArt {
  const rnd = mulberry32(20261013);
  const M = new Model();
  const N = 72;
  const lo: V3[] = [];
  const hi: V3[] = [];
  for (let k = 0; k < N; k++) {
    const th = (k / N) * TAU;
    const r = islR(th);
    lo.push([r * Math.cos(th), r * Math.sin(th), 0]);
    hi.push([(r - 8) * Math.cos(th), (r - 8) * Math.sin(th), 7]);
  }
  M.begin('islBase');
  for (let k = 0; k < N; k++) {
    const j = (k + 1) % N;
    const c = avg3([lo[k], lo[j]]);
    M.face([lo[k], lo[j], hi[j], hi[k]], [c[0], c[1], 40]);
  }
  M.face(hi, [0, 0, 1]);
  M.face(lo.slice().reverse(), [0, 0, -1]);
  M.det(loop3(Array.from({ length: N }, (_, k) => {
    const th = (k / N) * TAU;
    const r = islR(th) - 17 + 1.5 * Math.sin(5 * th);
    return [r * Math.cos(th), r * Math.sin(th), 7.03] as V3;
  })), 'sm');
  const base = M.end();

  /* one rock outcrop standing just off the beach: a main block and a companion */
  const th0 = 3.3;
  const dir: P2 = [Math.cos(th0), Math.sin(th0)];
  const pr: P2 = [-dir[1], dir[0]];
  const clear = (c: P2, r: number): P2 => {
    const rad = Math.hypot(c[0], c[1]);
    const ang = Math.atan2(c[1], c[0]);
    let rmax = 0;
    const span = (1.2 * r) / rad + 0.05;
    for (let k = -12; k <= 12; k++) rmax = Math.max(rmax, islR(ang + (k / 12) * span));
    const need = rmax + 1.15 * r + 3;
    return rad < need ? v2mul(c, need / rad) : c;
  };
  const C0 = clear(v2mul(dir, islR(th0) + 18), 13);
  const C1 = clear(v2add(C0, v2add(v2mul(pr, 25), v2mul(dir, -1))), 7);
  const rocks: [P2, number, number][] = [[C0, 13, 12], [C1, 7, 7]];
  rocks.forEach(([c, r, h], i) => {
    const a0 = rnd() * TAU;
    const bot: P2[] = Array.from({ length: 7 }, (_, k) => {
      const a = a0 + (k / 7) * TAU + (rnd() - 0.5) * 0.5;
      const rr = r * (0.85 + 0.3 * rnd());
      return [c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)] as P2;
    });
    const tc: P2 = v2add(c, [r * 0.12, -r * 0.08]);
    const top = bot.map((p) => v2add(tc, v2mul(v2sub(p, c), 0.5)));
    M.begin(`rock${i}`);
    frustum(M, bot, top, 0, h);
    M.det(line3([[...v2add(tc, v2mul(v2sub(top[0], tc), 0.92)), h + 0.03] as V3, [...v2add(tc, v2mul(v2sub(top[3], tc), 0.92)), h + 0.03] as V3]), 'sm');
    M.end();
  });

  /* palm clusters: one part each, drawn trunk piece by piece and leaf by leaf in depth order */
  const clusters: [number, number][] = [[0.55, 3], [2.05, 2], [4.6, 3]];
  clusters.forEach(([tc, cnt], ci) => {
    M.begin(`palms${ci}`);
    const items: Item[] = [];
    for (let j = 0; j < cnt; j++) {
      const th = tc + (j - (cnt - 1) / 2) * 0.24 + (rnd() - 0.5) * 0.06;
      const rr = islR(th) - 17 - rnd() * 6;
      const b: V3 = [rr * Math.cos(th), rr * Math.sin(th), 7];
      const out: V3 = [Math.cos(th), Math.sin(th), 0];
      const H = 30 + rnd() * 9;
      const lean = 5 + rnd() * 6;
      const path: V3[] = [0, 0.25, 0.5, 0.75, 1].map((t) => add3(b, add3(mul3(out, lean * t * t), [0, 0, H * t])));
      const radii = [2.1, 1.9, 1.7, 1.5, 1.3];
      for (let s = 0; s < 4; s++) {
        const T = new Model();
        T.begin('trunk');
        tube(T, [path[s], path[s + 1]], [radii[s], radii[s + 1]], 8);
        const tp = T.end();
        const fp = fillPaths(tp.faces);
        items.push({ fills: TONES.filter((t) => fp[t]).map((t) => ({ d: fp[t] as string, cls: `f-${t}` })), lines: edgesPath(tp.faces), dep: depthOf(avg3([path[s], path[s + 1]])) });
        for (const f of tp.faces) M.face(f.v, f.n);
      }
      const crown = path[4];
      const rot = rnd() * TAU;
      for (let k = 0; k < 8; k++) {
        const a = rot + (k / 8) * TAU + (rnd() - 0.5) * 0.3;
        const d: V3 = [Math.cos(a), Math.sin(a), 0];
        const pp: V3 = [-d[1], d[0], 0];
        const L = 15 + rnd() * 5;
        const W = 4.2 + rnd() * 1.2;
        const cl = (t: number): V3 => add3(crown, add3(mul3(d, L * t), [0, 0, 3 * t - 9 * t * t]));
        const wd = (t: number): number => W * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - 0.35 * t);
        for (let s = 0; s < 4; s++) {
          const ts = [0, 1, 2, 3].map((q) => (s + q / 3) / 4);
          const left = ts.map((t) => add3(cl(t), mul3(pp, wd(t))));
          const right = ts.map((t) => add3(cl(t), mul3(pp, -wd(t))));
          const vs = dedupe3([...left, ...right.slice().reverse()]);
          if (vs.length < 3) continue;
          let n = newell(vs);
          if (n[2] < 0) n = mul3(n, -1);
          const seen = dot3(n, VIEW3) >= 0 ? n : mul3(n, -1);
          items.push({ fills: [{ d: loop3(vs), cls: `f-${toneOf(seen)}` }], lines: line3(left) + line3(right), rib: line3(ts.map(cl)), dep: depthOf(avg3(vs)) + 0.5 });
          M.face(vs, n);
        }
      }
      items.push({ fills: [], lines: '', dots: dots3([0, 1, 2].map((k) => add3(crown, [1.6 * Math.cos(k * 2.1), 1.6 * Math.sin(k * 2.1), 0.4])), VIEW3, 1.1), dep: depthOf(crown) + 6 });
    }
    items.sort((p, q) => p.dep - q.dep);
    M.end().items = items;
  });

  const props = M.parts.filter((p) => p !== base);
  return {
    base,
    props: sortParts(props, []),
    foot: Array.from({ length: 96 }, (_, k) => {
      const th = (k / 96) * TAU;
      const r = islR(th) + 4;
      return [r * Math.cos(th), r * Math.sin(th)] as P2;
    }),
    rocks: rocks.map(([c, r]) => [c[0], c[1], r] as [number, number, number]),
  };
}

/* =========================================================================
 * 7. Draw order: proven separations, explicit contacts, then depth
 * ====================================================================== */

function sbox(p: Part): [number, number, number, number] {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const f of p.faces) for (const v of f.v) {
    const s = iso(v);
    x0 = Math.min(x0, s[0]); y0 = Math.min(y0, s[1]); x1 = Math.max(x1, s[0]); y1 = Math.max(y1, s[1]);
  }
  return [x0, y0, x1, y1];
}
const matchId = (id: string, pat: string): boolean => (pat.endsWith('*') ? id.startsWith(pat.slice(0, -1)) : id === pat);

/** Topological painter's order: a rule or a separating axis puts one part behind another. */
function sortParts(parts: Part[], rules: [string, string][]): Part[] {
  const n = parts.length;
  const bx = parts.map(sbox);
  const next: number[][] = parts.map(() => []);
  const indeg = new Array<number>(n).fill(0);
  const ruled = (front: Part, back: Part): boolean =>
    rules.some(([f, b]) => matchId(front.id, f) && matchId(back.id, b)) || front.over.some((o) => matchId(back.id, o));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const A = bx[i];
      const B = bx[j];
      if (A[2] < B[0] || B[2] < A[0] || A[3] < B[1] || B[3] < A[1]) continue;
      const P = parts[i];
      const Q = parts[j];
      let ij = ruled(Q, P);
      let ji = ruled(P, Q);
      if (!ij && !ji) {
        const e = 0.01;
        const pq = P.max[0] <= Q.min[0] + e || P.max[1] <= Q.min[1] + e || P.max[2] <= Q.min[2] + e;
        const qp = Q.max[0] <= P.min[0] + e || Q.max[1] <= P.min[1] + e || Q.max[2] <= P.min[2] + e;
        if (pq && !qp) ij = true;
        else if (qp && !pq) ji = true;
      }
      if (ij) {
        next[i].push(j);
        indeg[j]++;
      } else if (ji) {
        next[j].push(i);
        indeg[i]++;
      }
    }
  }
  const key = parts.map((p) => (p.min[0] + p.max[0] + p.min[1] + p.max[1] + p.min[2] + p.max[2]) / 2);
  const ready = parts.map((_, i) => i).filter((i) => indeg[i] === 0);
  const out: number[] = [];
  while (ready.length) {
    ready.sort((a, b) => key[a] - key[b]);
    const i = ready.shift() as number;
    out.push(i);
    for (const j of next[i]) if (--indeg[j] === 0) ready.push(j);
  }
  if (out.length < n) parts.map((_, i) => i).filter((i) => !out.includes(i)).sort((a, b) => key[a] - key[b]).forEach((i) => out.push(i));
  return out.map((i) => parts[i]);
}

/* =========================================================================
 * 8. Figure assembly
 * ====================================================================== */

export interface AssembleStep {
  id: string;
  order: number;
  from: P2; // scatter offset in craft-local screen units at t = 0
}
export interface Figure {
  parts: Part[];
  backdrop: string;
  plan: P2[][];
  fb: FigBounds;
  island: IslandArt;
  /** Assemble order + scatter vectors, one per craft part (paint order kept). */
  assemble: AssembleStep[];
}

/** Assemble priority: structure lands first, fittings and moving parts last. */
function assembleRank(id: string): number {
  if (id === 'hull') return 0;
  if (id.startsWith('wing')) return 1;
  if (id.startsWith('float') || id.startsWith('bow')) return 2;
  if (id.startsWith('nac') || id.startsWith('fair')) return 3;
  if (id.startsWith('canard') || id === 'scone' || id === 'canopy' || id.startsWith('spine') || id === 'rail') return 4;
  if (id.startsWith('lip') || id.startsWith('band') || id.startsWith('shield') || id.startsWith('nozzle')) return 5;
  if (id.startsWith('flap') || id.startsWith('fin') || id.startsWith('bracket')) return 7;
  return 6;
}

export function buildFigure(): Figure {
  const M = buildCraft();
  const parts = withCraft(() => sortParts(M.parts, ORDER_RULES));
  const backdrop = withCraft(() => parts.filter((p) => !p.dyn).map((p) => frontPath(p.faces)).join(''));
  const plan = parts.flatMap((p) => p.plan);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const grow = (s: P2): void => {
    x0 = Math.min(x0, s[0]); y0 = Math.min(y0, s[1]); x1 = Math.max(x1, s[0]); y1 = Math.max(y1, s[1]);
  };
  withCraft(() => {
    for (const p of parts) for (const f of p.faces) for (const v of f.v) grow(iso([v[0], v[1], v[2] + ALT0]));
    for (const poly of plan) for (const [a, b] of poly) grow(iso([a, b, 0]));
  });
  const island = buildIsland();
  let ex = 0, up = 0, dn = 0;
  for (const p of [island.base, ...island.props]) for (const f of p.faces) for (const v of f.v) {
    const s = iso(v);
    ex = Math.max(ex, Math.abs(s[0]));
    up = Math.max(up, -s[1]);
    dn = Math.max(dn, s[1]);
  }
  const ring = 75 + 52;
  // assemble choreography: rank by structure, scatter outward from the centroid
  let ccx = 0, ccy = 0, cn = 0;
  const centre = new Map<string, P2>();
  withCraft(() => {
    for (const p of parts) {
      let px = 0, py = 0, pn = 0;
      for (const f of p.faces) for (const v of f.v) {
        const s = iso(v);
        px += s[0]; py += s[1]; pn++;
      }
      if (pn) {
        px /= pn; py /= pn;
        ccx += px; ccy += py; cn++;
        centre.set(p.id, [px, py]);
      }
    }
  });
  ccx /= Math.max(cn, 1); ccy /= Math.max(cn, 1);
  const assemble: AssembleStep[] = [...parts]
    .sort((a, b) => assembleRank(a.id) - assembleRank(b.id) || a.id.localeCompare(b.id))
    .map((p, order) => {
      const [px, py] = centre.get(p.id) ?? [0, 0];
      const span = Math.hypot(p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]);
      return { id: p.id, order, from: scatterOf(p.id, px - ccx, py - ccy, span) };
    });
  return {
    parts,
    backdrop,
    plan,
    fb: { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, ex: Math.max(ex, 1.2247 * ring) + 10, up: Math.max(up, 0.7071 * ring) + 10, dn: Math.max(dn, 0.7071 * ring) + 22 },
    island,
    assemble,
  };
}

/** SVG data for one part: merged fills per tone (back to front), edges, details. */
interface PartSvg {
  fills: { d: string; cls: string }[];
  lines: string;
  det: Det[];
}
function partSvg(p: Part, craft = false): PartSvg {
  const proj = (): PartSvg => {
    const fp = fillPaths(p.faces);
    return { fills: TONES.filter((t) => fp[t]).map((t) => ({ d: fp[t] as string, cls: `f-${t}` })), lines: edgesPath(p.faces), det: p.det };
  };
  return craft ? withCraft(proj) : proj();
}

/* =========================================================================
 * 9. Soft halo shadows, blurred once on the CPU
 * ====================================================================== */

interface Halo { url: string; x: number; y: number; w: number; h: number }
function haloOf(polys: P2[][], sigma: number, alpha: number, pad = 60): Halo | null {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of polys) for (const [x, y] of p) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const k = 0.5;
  const w = Math.ceil((x1 - x0) * k);
  const h = Math.ceil((y1 - y0) * k);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#000';
  for (const p of polys) {
    ctx.beginPath();
    p.forEach(([x, y], i) => (i ? ctx.lineTo((x - x0) * k, (y - y0) * k) : ctx.moveTo((x - x0) * k, (y - y0) * k)));
    ctx.closePath();
    ctx.fill();
  }
  const src = ctx.getImageData(0, 0, w, h);
  let a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = src.data[i * 4 + 3] / 255;
  const r = Math.max(1, Math.round(sigma * k));
  const tmp = new Float32Array(w * h);
  const pass = (s: Float32Array, d: Float32Array, horiz: boolean): void => {
    const n = horiz ? w : h;
    const m = horiz ? h : w;
    for (let j = 0; j < m; j++) {
      const at = (i: number): number => (i < 0 || i >= n ? 0 : horiz ? s[j * w + i] : s[i * w + j]);
      let acc = 0;
      for (let i = -r; i <= r; i++) acc += at(i);
      for (let i = 0; i < n; i++) {
        if (horiz) d[j * w + i] = acc / (2 * r + 1);
        else d[i * w + j] = acc / (2 * r + 1);
        acc += at(i + r + 1) - at(i - r);
      }
    }
  };
  for (let p = 0; p < 3; p++) {
    pass(a, tmp, true);
    pass(tmp, a, false);
  }
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < a.length; i++) {
    out.data[i * 4] = 40;
    out.data[i * 4 + 1] = 44;
    out.data[i * 4 + 2] = 50;
    out.data[i * 4 + 3] = Math.round(255 * alpha * clamp(a[i], 0, 1));
  }
  ctx.putImageData(out, 0, 0);
  a = new Float32Array(0);
  return { url: cv.toDataURL('image/png'), x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/* =========================================================================
 * 10. WebGL: line-art water (opaque paper) and the exhaust (premultiplied)
 * ====================================================================== */

const VERT = 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}';
const NOISE = `
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float pnoise(vec2 p,vec2 per){vec2 i=floor(p);vec2 f=p-i;vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
 vec2 a=mod(i,per);vec2 b=mod(i+1.0,per);
 float g00=6.2831853*hash12(a),g10=6.2831853*hash12(vec2(b.x,a.y)),g01=6.2831853*hash12(vec2(a.x,b.y)),g11=6.2831853*hash12(b);
 float n00=dot(vec2(cos(g00),sin(g00)),f),n10=dot(vec2(cos(g10),sin(g10)),f-vec2(1.0,0.0));
 float n01=dot(vec2(cos(g01),sin(g01)),f-vec2(0.0,1.0)),n11=dot(vec2(cos(g11),sin(g11)),f-1.0);
 return mix(mix(n00,n10,u.x),mix(n01,n11,u.x),u.y);}
float aline(float f,float w){float g=length(vec2(dFdx(f),dFdy(f)))+1e-5;return 1.0-smoothstep(w-0.6,w+0.6,abs(fract(f+0.5)-0.5)/g);}
float aline1(float x,float w){float g=length(vec2(dFdx(x),dFdy(x)))+1e-5;return 1.0-smoothstep(w-0.6,w+0.6,abs(x)/g);}
`;

const WATER = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes;uniform vec4 uView;uniform float uT,uLoop,uScroll,uD,uM,uSpeed,uDpr,uIslR0;
uniform vec4 uWav[5];uniform float uWph[5];uniform float uIslA[6];uniform float uIslB[6];
uniform vec2 uIsl,uCraft,uRockR;uniform vec4 uWing,uVig,uRocks;
const float IC=0.8660254;const float TAU=6.2831853;
${NOISE}
float islandSDF(vec2 ip){float l=length(ip)+1e-3;float th=atan(ip.y,ip.x);float r=uIslR0;float dr=0.0;
 for(int k=0;k<6;k++){float fk=float(k+1);float c=cos(fk*th),s=sin(fk*th);r+=uIslA[k]*c+uIslB[k]*s;dr+=fk*(-uIslA[k]*s+uIslB[k]*c);}
 return (l-r)/sqrt(1.0+(dr/l)*(dr/l));}
vec2 wake(vec2 p,vec2 src){vec2 r=p-src;float v=max(uSpeed,1.0);float c=0.334*v;float A=v*v-c*c;float B=-r.x*v;float C=dot(r,r)+1.0;
 float disc=B*B-A*C;float e=disc/(A*C*0.1256);float sq=sqrt(max(disc,0.0));float a1=(B-sq)/A;float a2=(B+sq)/A;
 float f=48.0/uLoop;float inV=smoothstep(0.0,0.06,e);
 float l1=aline(f*(uT-a1),0.36*uDpr)*smoothstep(0.08,0.35,a1)*exp(-a1/1.5);
 float l2=aline(f*(uT-a2),0.36*uDpr)*smoothstep(0.08,0.35,a2)*exp(-a2/1.1);
 float far=1.0-smoothstep(220.0,430.0,-r.x);
 float env=aline1(e-0.03,0.36*uDpr)*smoothstep(10.0,60.0,-r.x)*exp(r.x/200.0)*far;
 return vec2((0.8*l1+0.5*l2)*inV*far,env*0.8);}
void main(){
 vec2 fc=gl_FragCoord.xy;vec2 s=uView.xy+vec2(fc.x,uRes.y-fc.y)*uView.zw;
 vec2 w=vec2(s.x/IC+2.0*s.y,2.0*s.y-s.x/IC)*0.5;
 vec2 q=vec2(w.x-uScroll,w.y);
 float ph=q.x*uM/uD;
 for(int i=0;i<5;i++){vec4 k=uWav[i];ph+=k.z*sin(k.x*q.x+k.y*q.y-k.w*uT+uWph[i]);}
 float g=length(vec2(dFdx(ph),dFdy(ph)))+1e-5;
 float dpx=abs(fract(ph+0.5)-0.5)/g;
 float n=floor(ph+0.5);float nm=mod(n,uM);
 float gate=smoothstep(-0.12,0.3,pnoise(vec2(q.y/190.0+nm*7.31,nm*0.61),vec2(4096.0,4096.0)));
 float wl=(1.0-smoothstep(0.42*uDpr-0.6,0.42*uDpr+0.6,dpx))*gate;
 float cell=floor(q.y/130.0);float h1=hash12(vec2(nm,cell));
 float cen=(cell+0.2+0.6*hash12(vec2(cell,nm+3.1)))*130.0;float hl=6.0+7.0*hash12(vec2(nm+1.7,cell));
 float gy=length(vec2(dFdx(q.y),dFdy(q.y)))+1e-5;
 float cd=length(vec2(max(abs(q.y-cen)-hl,0.0)/gy,dpx))-2.1*uDpr;
 float isF=step(0.8,h1)*gate;
 float foamIn=(1.0-smoothstep(-0.6,0.6,cd))*isF;
 float foamOut=(1.0-smoothstep(0.32*uDpr-0.6,0.32*uDpr+0.6,abs(cd)))*isF;
 float cx=uD/floor(uD/64.0+0.5);vec2 cid=floor(q/vec2(cx,64.0));vec2 cm=vec2(mod(cid.x,floor(uD/cx+0.5)),cid.y);
 float hm=hash12(cm+19.7);vec2 mc=(cid+0.25+0.5*vec2(hash12(cm+3.3),hash12(cm+7.9)))*vec2(cx,64.0);
 vec2 rm=q-mc;float lr=length(rm);
 float crest=aline1(lr-5.0,0.34*uDpr)*smoothstep(1.0,3.5,dot(rm,vec2(-0.7071,-0.7071)))*step(0.82,hm);
 vec2 ip=w-uIsl;float dI=islandSDF(ip);
 float lag=smoothstep(52.0,74.0,dI);
 float lagR=aline(dI/11.0,0.34*uDpr)*smoothstep(8.0,15.0,dI)*(1.0-smoothstep(30.0,52.0,dI))*(1.0-dI/70.0);
 float shoreA=aline1(dI-4.0,0.5*uDpr);float shoreB=aline1(dI-7.5,0.36*uDpr)*(0.55+0.45*smoothstep(-0.3,0.3,pnoise(vec2(atan(ip.y,ip.x)*6.0,0.0),vec2(38.0,64.0))));
 vec2 wk=wake(w,uWing.xy)+wake(w,uWing.zw);
 vec2 rc=w-uCraft;rc.x*=1.0-0.22*smoothstep(-20.0,40.0,rc.x);float rr=length(rc);
 float rings=aline(rr/30.0-8.0*uT/uLoop,0.34*uDpr)*smoothstep(64.0,120.0,rr)*(1.0-smoothstep(170.0,310.0,rr));
 vec2 vd=(s-uVig.xy)/uVig.zw;float vg=0.3+0.7*(1.0-smoothstep(0.62,1.08,length(vd)));
 vec3 PAPER=vec3(0.9804);vec3 INK=vec3(0.545,0.585,0.625);
 vec3 col=PAPER;
 col=mix(col,INK,wl*0.62*lag*vg);
 col=mix(col,INK,crest*0.5*lag*vg);
 col=mix(col,INK,clamp(wk.x+wk.y,0.0,1.0)*0.55*vg);
 col=mix(col,INK,rings*0.42*vg);
 float dRk=min(length(ip-uRocks.xy)-uRockR.x,length(ip-uRocks.zw)-uRockR.y);
 float rk=aline1(dRk-3.5,0.45*uDpr)+0.6*aline1(dRk-7.0,0.34*uDpr);
 col=mix(col,INK,clamp(lagR*0.6+shoreA*0.75+shoreB*0.55+rk*0.65,0.0,1.0)*vg);
 col=mix(col,vec3(1.0),foamIn*lag*vg);
 col=mix(col,INK,foamOut*0.75*lag*vg);
 col+=(hash12(fc)-0.5)/255.0;
 gl_FragColor=vec4(col,1.0);}`;

const FX = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes;uniform vec4 uView;uniform float uScene,uLoop,uGlow,uBoost,uDpr,uK;uniform vec4 uNoz;uniform vec2 uAft;
${NOISE}
void main(){
 vec2 fc=gl_FragCoord.xy;vec2 s=uView.xy+vec2(fc.x,uRes.y-fc.y)*uView.zw;
 vec2 side=vec2(-uAft.y,uAft.x);
 float aG=0.0;float core=0.0;float aW=0.0;float aH=0.0;
 for(int i=0;i<2;i++){
  vec2 n=(i==0)?uNoz.xy:uNoz.zw;vec2 r=(s-n)/uK;
  float al=dot(r,uAft);float ac=dot(r,side);
  float bl=9.0+16.0*uBoost;float bw=4.6+3.4*uBoost;
  vec2 rb=r-10.0*uAft;
  float burst=exp(-dot(rb,rb)/(7.5*7.5))*(0.65+0.9*uBoost)+exp(-pow(max(al,0.0)/bl,2.0)-pow(ac/bw,2.0))*smoothstep(-3.0,2.0,al)*(0.55+0.9*uBoost);
  aG=max(aG,burst);core=max(core,exp(-dot(rb,rb)/(3.2*3.2)));
  float L=120.0+380.0*uBoost;float fade=smoothstep(4.0,22.0,al)*exp(-max(al,0.0)/L);
  float sp=3.6+0.05*max(al,0.0);
  vec2 qn=vec2(al/46.0-16.0*uScene/uLoop,ac/18.0+float(i)*11.0);
  float turb=(0.12+0.011*max(al,0.0))*pnoise(qn,vec2(8.0,64.0))+(0.04+0.005*max(al,0.0))*pnoise(qn*2.0+3.7,vec2(16.0,128.0));
  float psi=ac/sp+turb;
  float band=1.0-smoothstep(2.0,3.4,abs(psi));
  aW=max(aW,aline(psi,0.46*uDpr)*band*fade);aH=max(aH,exp(-pow(ac/(4.5+0.08*max(al,0.0)),2.0))*fade);}
 float ag=clamp(aG*uGlow*(0.62+0.5*uBoost),0.0,0.9);
 float aw=1.0-(1.0-clamp(aW*(0.44+0.35*uBoost)*(0.8+0.2*uGlow),0.0,0.65))*(1.0-clamp(aH*0.12*(0.75+0.25*uGlow)*(1.0+1.8*uBoost),0.0,0.3));
 vec3 amber=mix(vec3(1.0,0.55,0.18),vec3(1.0,0.86,0.66),core);
 vec3 lav=vec3(0.60,0.65,0.95);
 float a=1.0-(1.0-ag)*(1.0-aw);
 vec3 c=(amber*ag+lav*aw*(1.0-ag))/max(a,1e-4);
 gl_FragColor=vec4(c*a,a);}`;

const WATER_U = ['uRes', 'uView', 'uT', 'uLoop', 'uScroll', 'uD', 'uM', 'uSpeed', 'uDpr', 'uIslR0', 'uWav[0]', 'uWph[0]', 'uIslA[0]', 'uIslB[0]', 'uIsl', 'uCraft', 'uWing', 'uVig', 'uRocks', 'uRockR'];
const FX_U = ['uRes', 'uView', 'uScene', 'uLoop', 'uGlow', 'uBoost', 'uDpr', 'uK', 'uNoz', 'uAft'];

interface Prog {
  gl: WebGLRenderingContext;
  u: Record<string, WebGLUniformLocation | null>;
  res: (WebGLProgram | WebGLShader | WebGLBuffer)[];
}
function makeProg(cv: HTMLCanvasElement, frag: string, names: string[], alpha: boolean): Prog | null {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = cv.getContext('webgl', { alpha, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl || gl.isContextLost() || !gl.getExtension('OES_standard_derivatives')) return null;
  const sh = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[SkimmerAnatomyCard] shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, frag);
  const pr = gl.createProgram();
  if (!vs || !fs || !pr) return null;
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.bindAttribLocation(pr, 0, 'aPos');
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const n of names) u[n.replace('[0]', '')] = gl.getUniformLocation(pr, n);
  return { gl: gl, u, res: [pr, vs, fs, buf].filter(Boolean) as Prog['res'] };
}
function freeProg(P: Prog): void {
  for (const r of P.res) {
    if (r instanceof WebGLProgram) P.gl.deleteProgram(r);
    else if (r instanceof WebGLShader) P.gl.deleteShader(r);
    else P.gl.deleteBuffer(r);
  }
}

/** Swell components: wave numbers along x quantised to the tile, frequencies to the loop. */
function wavesFor(D: number): { w: Float32Array; ph: Float32Array } {
  const spec: [number, number, number][] = [[260, 1.35, 0.3], [170, 1.75, 0.22], [120, 1.1, 0.14], [80, 1.95, 0.08], [55, 1.5, 0.05]];
  const w = new Float32Array(20);
  const ph = new Float32Array(5);
  spec.forEach(([lam, dir, amp], i) => {
    const k = TAU / lam;
    const kx = (TAU * Math.round((k * Math.cos(dir) * D) / TAU)) / D;
    const ky = k * Math.sin(dir);
    const om = (TAU * Math.max(1, Math.round((Math.sqrt((9.81 / M_PER_U) * Math.hypot(kx, ky)) * LOOP_SECONDS) / TAU))) / LOOP_SECONDS;
    w.set([kx, ky, amp, om], i * 4);
    ph[i] = (i * 2.399) % TAU;
  });
  return { w, ph };
}

/* =========================================================================
 * 11. The card
 * ====================================================================== */

export interface SkimmerAnatomyCardProps {
  width?: number | string;
  height?: number | string;
  figLabel?: string;
  title?: string;
  subtitle?: string;
  hint?: string;
  className?: string;
  style?: CSSProperties;
  /** Render one still frame at this loop time (s) instead of animating. */
  frozenTime?: number;
  /** Peak opacity of the craft's halo shadow on the water, 0–1. Default 0.05. */
  shadowOpacity?: number;
  /** Shadow size relative to the craft's footprint, scaled about its centre. Default 0.5. */
  shadowScale?: number;
}

const STILL_T = 0.5 * LOOP_SECONDS;
const cssLen = (n: number | string): string => (typeof n === 'number' ? `${n}px` : n);
const mtx = (m: number[]): string => `matrix(${m.map((v) => (Math.round(v * 1e5) / 1e5).toString()).join(' ')})`;
const DYN_CLS = ['f-t3', 'f-t2', 'f-t1', 'f-top', 'ln', 'sm', 'rv'];
const READ_LABELS = ['alt', 'ias', 'hdg', 'bank'];
function readoutOf(f: Frame): string[] {
  const r = Math.abs(f.roll);
  return [`${f.altM.toFixed(1)} m`, `${Math.round(f.ias)} kt`, `${String(Math.round(f.heading) % 360).padStart(3, '0')}°`, r < 0.05 ? '0.0°' : `${f.roll > 0 ? 'R' : 'L'} ${r.toFixed(1)}°`];
}
function craftMatrix(f: Frame): number[] {
  const A = attAffine(f, 12, false);
  const k = f.scale;
  const o = iso([f.px, f.py, f.alt]);
  return [k * A[0], k * A[1], k * A[2], k * A[3], k * A[4] + o[0], k * A[5] + o[1]];
}
const apply = (m: number[], p: P2): P2 => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];

export default function SkimmerAnatomyCard(props: SkimmerAnatomyCardProps): ReactElement {
  const {
    width = '100%',
    height = 460,
    figLabel = 'Fig. 1',
    title = 'Shearwater SK-4',
    subtitle = 'ground-effect skimmer',
    hint = 'Move to tilt. Hold Space to boost, Esc to settle.',
    className,
    style,
    frozenTime,
    shadowOpacity = 0.05,
    shadowScale = 0.5,
  } = props;
  const uid = 'sk' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const fig = useMemo(() => buildFigure(), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const craftRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGGElement>(null);
  const shImg = useRef<(SVGImageElement | null)[]>([]);
  const islRef = useRef<(SVGGElement | null)[]>([]);
  const islHalo = useRef<SVGImageElement>(null);
  const dynBack = useRef<SVGPathElement>(null);
  const backStatic = useRef<SVGPathElement>(null);
  const dynRef = useRef<Record<string, (SVGPathElement | null)[]>>({});
  const outRef = useRef<(HTMLElement | null)[]>([]);
  const engine = useRef<{ setPaused: (p: boolean) => void; seek: (t: number) => void; redraw: () => void } | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  const frozenRef = useRef(frozenTime);
  useEffect(() => {
    frozenRef.current = frozenTime;
  }, [frozenTime]);
  const shadowCfg = useRef({ op: 0.05, sc: 0.5 });
  useEffect(() => {
    shadowCfg.current = { op: clamp(shadowOpacity, 0, 1), sc: Math.max(0.05, shadowScale) };
  }, [shadowOpacity, shadowScale]);
  const isFrozen = typeof frozenTime === 'number';
  const L0 = useMemo(() => layoutFor(DESIGN_W, DESIGN_H, fig.fb), [fig]);
  const f0 = useMemo(() => frameAt(isFrozen ? (frozenTime as number) : 0, isFrozen ? (frozenTime as number) : 0, 0, STEER_ZERO, L0), [isFrozen, frozenTime, L0]);
  const read0 = readoutOf(f0);

  useEffect(() => {
    const root = rootRef.current;
    const wc = waterRef.current;
    const fc = fxRef.current;
    const svg = svgRef.current;
    if (!root || !wc || !fc || !svg) return undefined;
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const frozenNow = (): boolean => typeof frozenRef.current === 'number';
    let still = frozenNow() || !!mq?.matches;
    let W = makeProg(wc, WATER, WATER_U, false);
    let F = makeProg(fc, FX, FX_U, true);
    const plans = withCraft(() => fig.plan.map((p) => p.map(([a, b]) => iso([a, b, 0]) as P2)));
    let sx0 = 1e9, sy0 = 1e9, sx1 = -1e9, sy1 = -1e9;
    for (const pl of plans) for (const [x, y] of pl) {
      sx0 = Math.min(sx0, x); sy0 = Math.min(sy0, y); sx1 = Math.max(sx1, x); sy1 = Math.max(sy1, y);
    }
    const shc: P2 = [(sx0 + sx1) / 2, (sy0 + sy1) / 2]; // the shadow scales about the footprint centre
    [haloOf(plans, 10, 1), haloOf(plans, 24, 1)].forEach((h, i) => {
      const el = shImg.current[i];
      if (h && el) {
        el.setAttribute('href', h.url);
        el.setAttribute('x', fmt(h.x));
        el.setAttribute('y', fmt(h.y));
        el.setAttribute('width', fmt(h.w));
        el.setAttribute('height', fmt(h.h));
      }
    });
    const ih = haloOf([fig.island.foot.map(([a, b]) => iso([a, b, 0]))], 14, 0.12, 50);
    if (ih && islHalo.current) {
      const el = islHalo.current;
      el.setAttribute('href', ih.url);
      el.setAttribute('x', fmt(ih.x));
      el.setAttribute('y', fmt(ih.y + 5));
      el.setAttribute('width', fmt(ih.w));
      el.setAttribute('height', fmt(ih.h));
    }
    let L = layoutFor(DESIGN_W, DESIGN_H, fig.fb);
    let wv = wavesFor(L.D);
    let tB = frozenNow() ? (frozenRef.current as number) : still ? STILL_T : 0;
    let tS = tB;
    let boost = 0, boostV = 0, boostT = 0;
    const st: Steer = { ...STEER_ZERO };
    const sv: Steer = { ...STEER_ZERO };
    const stT: Steer = { ...STEER_ZERO };
    const keys: (keyof Steer)[] = ['yaw', 'roll', 'pitch', 'px', 'py'];
    let dpr = 1, rs = 1, raf = 0, last = 0, ema = 16, emaT = 0;
    let onScreen = true;
    let pausedNow = pausedRef.current;
    // assemble intro: scattered at mount, fully home after ASSEMBLE_SECONDS.
    // Frozen stills, reduced-motion and mount-while-paused render assembled.
    let assembleT = still || pausedNow ? ASSEMBLE_SECONDS : 0;
    let assembleDone = assembleT >= ASSEMBLE_SECONDS;
    const asmSteps = fig.assemble;
    // part groups live under the craft root; collected once, no render-time refs
    const asmEls = new Map<string, SVGGElement>();
    craftRef.current?.querySelectorAll<SVGGElement>('g[data-part]').forEach((el) => {
      const id = el.dataset.part;
      if (id && !el.dataset.parent) asmEls.set(id, el);
    });
    let asmCleaned = false;
    const applyAssemble = (): void => {
      // reduced-motion / frozen / mount-paused: clear the SSR scatter once
      if (assembleDone) {
        if (!asmCleaned) {
          asmCleaned = true;
          for (const el of asmEls.values()) {
            el.removeAttribute('transform');
            el.removeAttribute('opacity');
          }
          backStatic.current?.removeAttribute('opacity');
          dynBack.current?.removeAttribute('opacity');
        }
        return;
      }
      const n = asmSteps.length;
      let allHome = assembleT >= ASSEMBLE_SECONDS;
      for (const s of asmSteps) {
        const el = asmEls.get(s.id);
        if (!el) continue;
        const k = allHome ? 1 : assembleK(s.order, n, assembleT);
        if (k >= 1) {
          el.removeAttribute('transform');
          el.removeAttribute('opacity');
        } else {
          const dx = s.from[0] * (1 - k);
          const dy = s.from[1] * (1 - k);
          el.setAttribute('transform', `translate(${fmt(dx)} ${fmt(dy)})`);
          // parts fade in over the first third of their flight
          const fade = clamp(k / 0.33, 0, 1);
          el.setAttribute('opacity', (0.25 + 0.75 * fade * fade * (3 - 2 * fade)).toFixed(3));
          allHome = false;
        }
      }
      // the silhouette outline fades in with the last parts, never ahead of them
      const tail = n ? assembleK(n - 1, n, assembleT) : 1;
      const bo = clamp((tail - 0.55) / 0.45, 0, 1);
      backStatic.current?.setAttribute('opacity', bo.toFixed(3));
      dynBack.current?.setAttribute('opacity', bo.toFixed(3));
      if (allHome) {
        assembleDone = true;
        backStatic.current?.removeAttribute('opacity');
        dynBack.current?.removeAttribute('opacity');
      }
    };

    const size = (): void => {
      for (const [cv, k] of [[wc, rs], [fc, 1]] as [HTMLCanvasElement, number][]) {
        const bw = Math.max(1, Math.round(L.W * dpr * k));
        const bh = Math.max(1, Math.round(L.H * dpr * k));
        if (cv.width !== bw) cv.width = bw;
        if (cv.height !== bh) cv.height = bh;
      }
    };
    const measure = (): void => {
      const r = root.getBoundingClientRect();
      L = layoutFor(Math.max(1, r.width), Math.max(1, r.height), fig.fb);
      wv = wavesFor(L.D);
      svg.setAttribute('viewBox', `${fmt(L.vx)} ${fmt(L.vy)} ${fmt(L.Vw)} ${fmt(L.Vh)}`);
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      size();
    };
    const view = (P: Prog, cv: HTMLCanvasElement): void => {
      const { gl, u } = P;
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(u.uRes, cv.width, cv.height);
      gl.uniform4f(u.uView, L.vx, L.vy, L.Vw / cv.width, L.Vh / cv.height);
      gl.uniform1f(u.uDpr, cv.width / L.W);
      gl.uniform1f(u.uLoop, LOOP_SECONDS);
    };
    const render = (f: Frame): void => {
      const cm = craftMatrix(f);
      craftRef.current?.setAttribute('transform', mtx(cm));
      const As = attAffine(f, 0, true);
      const os = iso([f.px, f.py, 0]);
      const { op, sc } = shadowCfg.current;
      const tx = (1 - sc) * shc[0];
      const ty = (1 - sc) * shc[1];
      shadowRef.current?.setAttribute('transform', mtx([As[0] * sc, As[1] * sc, As[2] * sc, As[3] * sc, As[0] * tx + As[2] * ty + As[4] + os[0], As[1] * tx + As[3] * ty + As[5] + os[1]]));
      // the float cross-fades a tight and a soft halo; together they never exceed `op`
      const w = clamp((f.alt - (ALT0 - ALT_AMP)) / (2 * ALT_AMP), 0, 1);
      const shFade = clamp((assembleT - 0.45) / 0.8, 0, 1); // shadow lands with the structure
      shImg.current[0]?.setAttribute('opacity', (op * (1 - w) * shFade).toFixed(4));
      shImg.current[1]?.setAttribute('opacity', (op * w * shFade).toFixed(4));
      const M = new Model();
      for (const [side] of SIDES) {
        for (let i = 0; i < 4; i++) addFlap(M, side, i, f.flaps[i]);
        addFin(M, side, f.fin);
      }
      let back = '';
      for (const p of M.parts) {
        const els = dynRef.current[p.dyn as string];
        if (!els) continue;
        const ps = partSvg(p, true);
        const byCls: Record<string, string> = {};
        for (const x of ps.fills) byCls[x.cls] = x.d;
        byCls.ln = ps.lines;
        for (const d of ps.det) byCls[d.cls] = (byCls[d.cls] ?? '') + d.d;
        DYN_CLS.forEach((c, i) => els[i]?.setAttribute('d', byCls[c] ?? ''));
        back += withCraft(() => frontPath(p.faces));
      }
      dynBack.current?.setAttribute('d', back);
      const ip = iso([f.islandX, ISL_Y, 0]);
      const par = v2mul(v2sub(ip, [L.cx, L.cy]), PARALLAX * 0.8);
      islRef.current[0]?.setAttribute('transform', `translate(${fmt(ip[0])} ${fmt(ip[1])})`);
      islRef.current[1]?.setAttribute('transform', `translate(${fmt(ip[0] + par[0])} ${fmt(ip[1] + par[1])})`);
      if (W && !W.gl.isContextLost()) {
        const { gl, u } = W;
        view(W, wc);
        const yw = f.yaw * DEG;
        const src = (b: number): P2 => [f.px + WAKE_SRC[0] * Math.cos(yw) + b * Math.sin(yw), f.py - WAKE_SRC[0] * Math.sin(yw) + b * Math.cos(yw)];
        const wl = src(-WAKE_SRC[1]);
        const wr = src(WAKE_SRC[1]);
        gl.uniform1f(u.uT, tB);
        gl.uniform1f(u.uScroll, f.scroll);
        gl.uniform1f(u.uD, L.D);
        gl.uniform1f(u.uM, L.m);
        gl.uniform1f(u.uSpeed, f.speedU);
        gl.uniform4fv(u.uWav, wv.w);
        gl.uniform1fv(u.uWph, wv.ph);
        gl.uniform1f(u.uIslR0, ISL.R0);
        gl.uniform1fv(u.uIslA, ISL.A);
        gl.uniform1fv(u.uIslB, ISL.B);
        gl.uniform2f(u.uIsl, f.islandX, ISL_Y);
        const rk = fig.island.rocks;
        gl.uniform4f(u.uRocks, rk[0][0], rk[0][1], rk[1][0], rk[1][1]);
        gl.uniform2f(u.uRockR, rk[0][2], rk[1][2]);
        gl.uniform2f(u.uCraft, f.px, f.py);
        gl.uniform4f(u.uWing, wl[0], wl[1], wr[0], wr[1]);
        gl.uniform4f(u.uVig, L.cx, L.cy, L.Vw / 2, L.Vh / 2);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (F && !F.gl.isContextLost()) {
        const { gl, u } = F;
        view(F, fc);
        const nl = withCraft(() => apply(cm, iso([NOZ[0], -NOZ[1], NOZ[2]])));
        const nr = withCraft(() => apply(cm, iso(NOZ)));
        // aft = the model's +a (tail-ward) axis at the nozzle, through the
        // same mirror + attitude as the craft. The old cm·(IC, 0.5) shortcut
        // pointed nose-ward, so the plume washed forward over the wing.
        const n0 = withCraft(() => apply(cm, iso([NOZ[0], NOZ[1], NOZ[2]])));
        const n1 = withCraft(() => apply(cm, iso([NOZ[0] + 24, NOZ[1], NOZ[2]])));
        const ad = v2norm(v2sub(n1, n0));
        gl.uniform4f(u.uNoz, nl[0], nl[1], nr[0], nr[1]);
        gl.uniform2f(u.uAft, ad[0], ad[1]);
        gl.uniform1f(u.uK, f.scale);
        gl.uniform1f(u.uScene, tS);
        gl.uniform1f(u.uGlow, f.glow * clamp((assembleT - 0.7) / 0.6, 0, 1)); // exhaust ignites once the nozzles dock
        gl.uniform1f(u.uBoost, f.boost);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      const ro = readoutOf(f);
      outRef.current.forEach((el, i) => {
        if (el && el.textContent !== ro[i]) el.textContent = ro[i];
      });
    };
    const draw = (): void => {
      applyAssemble();
      render(frameAt(tB, tS, boost, st, L));
    };
    const want = (): boolean => !still && !pausedNow && onScreen && !document.hidden;
    const loop = (now: number): void => {
      raf = 0;
      const rawDt = Math.max(0, (now - last) / 1000);
      const dt = Math.min(0.1, rawDt);
      last = now;
      for (const k of keys) {
        sv[k] += (10.24 * (stT[k] - st[k]) - 6.4 * sv[k]) * dt;
        st[k] += sv[k] * dt;
      }
      boostV += (12.25 * (boostT - boost) - 7 * boostV) * dt;
      boost = clamp(boost + boostV * dt, 0, 1);
      tB = (tB + dt) % LOOP_SECONDS;
      tS = (tS + dt * (1 + BOOST_GAIN * boost)) % LOOP_SECONDS;
      // wall-clock: the intro finishes on time even when frames run long
      if (!assembleDone) assembleT = Math.min(ASSEMBLE_SECONDS, assembleT + rawDt);
      ema += (dt * 1000 - ema) * 0.05;
      emaT += dt;
      if (emaT > 1.5 && ema > 26 && rs > 0.6) {
        rs = Math.max(0.6, rs - 0.15);
        size();
        emaT = 0;
      } else if (emaT > 4 && ema < 18 && rs < 1) {
        rs = Math.min(1, rs + 0.15);
        size();
        emaT = 0;
      }
      draw();
      if (want()) raf = requestAnimationFrame(loop);
    };
    const start = (): void => {
      if (!raf && want()) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const stop = (): void => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const settle = (): void => {
      for (const k of keys) stT[k] = 0;
    };
    const onMove = (e: PointerEvent): void => {
      if (still) return;
      const r = root.getBoundingClientRect();
      const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      // mirrored craft: yaw/pitch flip sign so the tilt follows the pointer
      stT.yaw = -3.5 * nx;
      stT.roll = 4.5 * (nx - ny) * 0.7;
      stT.pitch = 3.5 * (nx + ny) * 0.7;
      stT.px = 24 * (nx + ny);
      stT.py = 24 * (ny - nx);
    };
    const isBtn = (e: KeyboardEvent): boolean => (e.target as HTMLElement | null)?.tagName === 'BUTTON';
    const onKey = (e: KeyboardEvent): void => {
      if (isBtn(e)) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (!still) boostT = 1;
      } else if (e.key === 'Escape') {
        boostT = 0;
        settle();
      }
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      if (!isBtn(e) && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        boostT = 0;
      }
    };
    const onBlur = (): void => {
      boostT = 0;
    };
    root.addEventListener('pointermove', onMove);
    // Space only reaches the card when it has focus: take it on click so
    // the first press already boosts instead of scrolling the page.
    const onDown = (): void => {
      if (document.activeElement !== root) root.focus({ preventScroll: true });
    };
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerleave', settle);
    root.addEventListener('pointercancel', settle);
    root.addEventListener('keydown', onKey);
    root.addEventListener('keyup', onKeyUp);
    root.addEventListener('blur', onBlur);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { measure(); draw(); }) : null;
    ro?.observe(root);
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((es) => {
          onScreen = es.some((e) => e.isIntersecting);
          if (onScreen) start();
          else stop();
        })
      : null;
    io?.observe(root);
    const onVis = (): void => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    const onMQ = (): void => {
      still = frozenNow() || !!mq?.matches;
      if (still) {
        stop();
        if (!frozenNow()) tB = tS = STILL_T;
        boost = boostV = 0;
        draw();
      } else start();
    };
    mq?.addEventListener?.('change', onMQ);
    const lost = (e: Event): void => e.preventDefault();
    const restored = (): void => {
      W = makeProg(wc, WATER, WATER_U, false);
      F = makeProg(fc, FX, FX_U, true);
      draw();
    };
    for (const cv of [wc, fc]) {
      cv.addEventListener('webglcontextlost', lost);
      cv.addEventListener('webglcontextrestored', restored);
    }
    engine.current = {
      redraw: () => draw(),
      setPaused: (p) => {
        pausedNow = p;
        if (p) stop();
        else start();
      },
      seek: (t) => {
        tB = tS = t;
        boost = boostV = 0;
        draw();
      },
    };
    measure();
    draw();
    root.dataset.ready = '1';
    start();
    return () => {
      stop();
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      mq?.removeEventListener?.('change', onMQ);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerleave', settle);
      root.removeEventListener('pointercancel', settle);
      root.removeEventListener('keydown', onKey);
      root.removeEventListener('keyup', onKeyUp);
      root.removeEventListener('blur', onBlur);
      for (const cv of [wc, fc]) {
        cv.removeEventListener('webglcontextlost', lost);
        cv.removeEventListener('webglcontextrestored', restored);
      }
      if (W) freeProg(W);
      if (F) freeProg(F);
      engine.current = null;
    };
  }, [isFrozen, fig]);

  useEffect(() => {
    if (typeof frozenTime === 'number') engine.current?.seek(frozenTime);
  }, [frozenTime]);
  useEffect(() => {
    engine.current?.setPaused(paused);
  }, [paused]);
  useEffect(() => {
    engine.current?.redraw();
  }, [shadowOpacity, shadowScale]);

  const T = ANATOMY_LIGHT;
  const css = `.${uid}:focus-visible{outline:2px solid #6b8fb8;outline-offset:-2px}
.${uid} path,.${uid} image{vector-effect:non-scaling-stroke}
.${uid} .bk{fill:${T.ink};stroke:${T.ink};stroke-width:2.1px;stroke-linejoin:round}
.${uid} .f-top{fill:${T.top};stroke:${T.top}}.${uid} .f-t1{fill:${T.t1};stroke:${T.t1}}.${uid} .f-t2{fill:${T.t2};stroke:${T.t2}}.${uid} .f-t3{fill:${T.t3};stroke:${T.t3}}.${uid} .f-rc{fill:${T.rc};stroke:${T.rc}}
.${uid} [class*="f-"]{stroke-width:.55px;stroke-linejoin:round}
.${uid} path.fo{stroke:${T.line};stroke-width:.6px}
.${uid} .ln{fill:none;stroke:${T.line};stroke-width:.7px;stroke-linecap:round;stroke-linejoin:round}
.${uid} .ink{fill:none;stroke:${T.ink};stroke-width:1px;stroke-linecap:round;stroke-linejoin:round}
.${uid} .sm{fill:none;stroke:${T.seam};stroke-width:.5px;stroke-linecap:round;stroke-linejoin:round}
.${uid} .rv{fill:${T.top};stroke:#9a9a9a;stroke-width:.45px}
.${uid} .sl{fill:none;stroke:#5c5c5c;stroke-width:.55px;stroke-linecap:round}
.${uid} .vt{fill:${T.rc};stroke:#9a9a9a;stroke-width:.5px;stroke-linejoin:round}
.${uid} .skc{position:absolute;z-index:3;padding:12px 14px;font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;color:${T.label};pointer-events:none}
.${uid} .skr{text-align:right}.${uid} .skr b{display:block;font-weight:600;color:${T.value}}
.${uid} .skb{display:flex;align-items:center;gap:8px;max-width:55%}
.${uid} .skd{margin:0;display:grid;grid-template-columns:auto auto;column-gap:10px;font-variant-numeric:tabular-nums}
.${uid} .skd dd{margin:0;text-align:right;color:${T.value};min-width:5.2em}
.${uid} .skbtn{pointer-events:auto;flex:none;width:22px;height:22px;border-radius:50%;border:1px solid #c9c9c9;background:${T.paper};color:#555;display:grid;place-items:center;cursor:pointer;padding:0}
.${uid} .skbtn:focus-visible{outline:2px solid #6b8fb8;outline-offset:2px}
@container (max-width:520px){.${uid} .skc{padding:8px 9px;font-size:9.5px}.${uid} .sks{display:none}}`;

  const ref = (k: string, i: number) => (el: SVGPathElement | null): void => {
    (dynRef.current[k] ??= [])[i] = el;
  };
  // initial scatter so the first paint is already exploded (no assembled flash
  // before the engine's first draw); frozen stills render fully assembled
  const asmFrom = useMemo(() => new Map(fig.assemble.map((s) => [s.id, s.from])), [fig]);
  const partEls = (p: Part, key: string, scatter?: boolean): ReactElement => {
    const scattered = !isFrozen && scatter ? asmFrom.get(p.id) : undefined;
    if (p.dyn) {
      return (
        <g key={key} data-part={p.id} transform={scattered ? `translate(${fmt(scattered[0])} ${fmt(scattered[1])})` : undefined} opacity={scattered ? 0.25 : undefined}>
          {DYN_CLS.map((c, i) => (
            <path key={c} className={c} ref={ref(p.dyn as string, i)} data-k={i < 4 ? 'face' : i === 6 ? 'dots' : 'line'} data-part={p.id} data-parent={i === 5 ? p.id : undefined} />
          ))}
        </g>
      );
    }
    if (p.items) {
      return (
        <g key={key} data-part={p.id}>
          {p.items.map((it, i) => (
            <g key={i}>
              {it.fills.map((x, j) => (
                <path key={j} className={x.cls} d={x.d} data-k="face" data-part={p.id} />
              ))}
              {it.lines ? <path className="ln" d={it.lines} data-k="line" data-part={p.id + 'e'} data-parent={p.id} /> : null}
              {it.rib ? <path className="sm" d={it.rib} data-k="line" data-part={p.id + 'r'} data-parent={p.id} /> : null}
              {it.dots ? <path className="rv" d={it.dots} data-k="dots" data-part={p.id + 'h'} data-parent={p.id} /> : null}
            </g>
          ))}
        </g>
      );
    }
    const ps = partSvg(p, !!scatter);
    return (
      <g key={key} data-part={p.id} transform={scattered ? `translate(${fmt(scattered[0])} ${fmt(scattered[1])})` : undefined} opacity={scattered ? 0.25 : undefined}>
        {ps.fills.map((x, i) => (
          <path key={i} className={x.cls} d={x.d} data-k="face" data-part={p.id} />
        ))}
        {ps.lines ? <path className={p.ink ? 'ink' : 'ln'} d={ps.lines} data-k="line" data-part={p.id + 'e'} data-parent={p.id} /> : null}
        {ps.det.map((d, i) => (
          <path key={'d' + i} className={d.cls} d={d.d} data-k={d.k} data-part={p.id + 'd'} data-parent={p.id} />
        ))}
      </g>
    );
  };
  return (
    <div
      ref={rootRef}
      className={className ? `${uid} ${className}` : uid}
      tabIndex={0}
      role="group"
      aria-label={`${figLabel} ${title}`}
      aria-describedby={`${uid}-hint`}
      style={{ position: 'relative', width: cssLen(width), height: cssLen(height), overflow: 'hidden', background: T.paper, containerType: 'inline-size', touchAction: 'pan-y', userSelect: 'none', outline: 'none', borderRadius: 'inherit', isolation: 'isolate', ...style } as CSSProperties}
    >
      <style>{css}</style>
      <canvas ref={waterRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />
      <canvas ref={fxRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />
      <svg ref={svgRef} viewBox={`${fmt(L0.vx)} ${fmt(L0.vy)} ${fmt(L0.Vw)} ${fmt(L0.Vh)}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Isometric line drawing of an original ground-effect skimmer floating over a line-drawn sea while a small palm island drifts past." style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', overflow: 'hidden' }}>
        <g ref={(el) => { islRef.current[0] = el; }} data-island="base" transform={`translate(${fmt(iso([f0.islandX, ISL_Y, 0])[0])} ${fmt(iso([f0.islandX, ISL_Y, 0])[1])})`}>
          <image ref={islHalo} preserveAspectRatio="none" />
          {partEls(fig.island.base, 'base')}
        </g>
        <g ref={(el) => { islRef.current[1] = el; }} data-island="props">
          {fig.island.props.map((p) => partEls(p, p.id))}
        </g>
        <g ref={shadowRef}>
          <image ref={(el) => { shImg.current[0] = el; }} preserveAspectRatio="none" />
          <image ref={(el) => { shImg.current[1] = el; }} preserveAspectRatio="none" />
        </g>
        <g ref={craftRef} data-craft="" transform={mtx(craftMatrix(f0))}>
          <path className="bk" d={fig.backdrop} ref={backStatic} opacity={isFrozen ? undefined : 0} />
          <path className="bk" ref={dynBack} opacity={isFrozen ? undefined : 0} />
          {fig.parts.map((p) => partEls(p, p.id, true))}
        </g>
      </svg>
      <div className="skc" style={{ top: 0, left: 0 }}>{figLabel}</div>
      <div className="skc skr" style={{ top: 0, right: 0 }}>
        <b>{title}</b>
        <span className="sks">{subtitle}</span>
      </div>
      <div className="skc skb" style={{ bottom: 0, left: 0 }}>
        <button type="button" className="skbtn" aria-pressed={paused} aria-label={paused ? 'Play animation' : 'Pause animation'} onClick={() => setPaused((p) => !p)}>
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
            {paused ? <path d="M2 1 L9 5 L2 9 Z" fill="currentColor" /> : <path d="M2 1h2.2v8H2zM5.8 1H8v8H5.8z" fill="currentColor" />}
          </svg>
        </button>
        <span id={`${uid}-hint`}>{hint}</span>
      </div>
      <dl className="skc skd" style={{ bottom: 0, right: 0 }} aria-label="Live readout">
        {READ_LABELS.map((lab, i) => (
          <div key={lab} style={{ display: 'contents' }}>
            <dt>{lab}</dt>
            <dd ref={(el) => { outRef.current[i] = el; }}>{read0[i]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
