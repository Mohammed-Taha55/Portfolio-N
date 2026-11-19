#!/usr/bin/env node
/**
 * Builds every raster the site ships.
 *
 *   node scripts/build-images.mjs [path/to/assets]
 *
 * Case-study sources are the 5760px PNG exports in the design assets
 * folder (default: ../assets, i.e. next to this repo). They are 150MB
 * and never enter the repo or the deploy - only the outputs do:
 *
 *   public/img/<slug>/<name>-<width>.webp   responsive widths
 *   public/img/<slug>/share.jpg             1200x630 share card
 *   public/avatar/dp-<width>.webp           portrait
 *   public/music/blue-poster-320.webp       album art
 *   src/content/images.generated.ts         sizes, colour, blur
 *
 * The manifest is what lets every <img> carry exact width/height and
 * a placeholder, so nothing on the site can shift layout or flash an
 * empty box while it loads.
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

sharp.cache(false);
sharp.concurrency(2);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** argv: [assets folder] [--only <slug>], in any order. */
const ARGV = process.argv.slice(2);
const ONLY_AT = ARGV.indexOf("--only");
const POSITIONAL = ARGV.filter((a, i) => !a.startsWith("--") && i !== ONLY_AT + 1);
const ASSETS = path.resolve(POSITIONAL[0] ?? path.join(ROOT, "..", "assets"));
const OUT_IMG = path.join(ROOT, "public", "img");
const MANIFEST = path.join(ROOT, "src", "content", "images.generated.ts");
const PAPER = "#fafcfd";

/** Standard widths: phone 1x/2x, laptop 1x/2x for a ~1100px column. */
const WIDE = [640, 1080, 1600, 2400];
/** Posters are the LCP image on two pages: one more step for phones. */
const POSTER = [640, 800, 1080, 1600, 2400];
/** Full-page screenshots live in half-width compare columns. */
const TALL = [640, 1080, 1600];

/**
 * crop = [left, top, width, height] as fractions of the source, for
 * detail shots that zoom into one decision.
 */
/* NOVA sources are three 3-up exports. Every phone in all three is
   exactly 1720x3728 on a 1880px pitch (measured from the alpha channel,
   not eyeballed): product-01/onboarding start at x=660, y=536 on an
   opaque grey ground; product-02 starts at x=0, y=0 on transparency.
   Each phone is cut out and re-grounded on that same grey, so a single
   screen sits on the page exactly like the 3-ups it came from, and the
   state toggles can cross-fade two images of identical size. */
const NOVA_PHONE = { w: 1720, h: 3728, pitch: 1880 };
const NOVA_GREY = "#4a4a4a";
const NOVA_STAGE = { width: 1940, height: 3948, background: NOVA_GREY };
/** phone i of a 3-up, as an absolute [left, top, width, height] box. */
const novaPhone = (i, x0, y0) => [x0 + i * NOVA_PHONE.pitch, y0, NOVA_PHONE.w, NOVA_PHONE.h];
/** A single screen is shown ~460px wide, so 1080 covers 2x and change. */
const PHONE_WIDTHS = [640, 1080];

/* Fintech home (client brief, client anonymised). Every phone in the
   first-version and iteration exports is 1720x3728 on the same grey -
   the same size as NOVA's -
   measured from the background rather than estimated. The client's logo
   sits 293px down every phone; it is blurred in every shot that shows
   it, matching the redaction already present in the final export.
   The phone corners stay grey in the file and are clipped in CSS:
   radius 95px of 1720 wide, i.e. `border-radius: 5.52% / 2.55%`. */
const FH_PHONE = [1720, 3728];
const FH_V1 = (i) => [664 + i * 2072, 800, ...FH_PHONE];
const FH_IT = (i) => [844 + i * 2040, 852, ...FH_PHONE];
const FH_LOGO_RIGHT = [1348, 292, 296, 169]; // first version: top right
const FH_LOGO_LEFT = [76, 292, 308, 169]; // iterations 4-6: top left
/** Phones shown at most ~560px wide (compare columns); 1600 covers 2.8x. */
const FH_PHONE_WIDTHS = [640, 1080, 1600];
/** A region of a phone, given in that phone's own pixels. */
const at = (phone, [x, y, w, h]) => [phone[0] + x, phone[1] + y, w, h];

const CASES = {
  "fintech-home": {
    dir: "fintech-home",
    images: [
      // cover: the designer's own export, logo already blurred
      { name: "cover", file: "poster.png" },
      // the whole first-version 3-up, all three logos blurred
      {
        name: "first-version",
        file: "first-version.png",
        redact: [0, 1, 2].map((i) => [FH_V1(i)[0] + FH_LOGO_RIGHT[0], FH_V1(i)[1] + FH_LOGO_RIGHT[1], FH_LOGO_RIGHT[2], FH_LOGO_RIGHT[3]]),
      },
      { name: "v1", file: "first-version.png", box: FH_V1(0), redact: [FH_LOGO_RIGHT], widths: FH_PHONE_WIDTHS },
      ...[0, 1, 2, 3, 4].map((i) => ({
        name: `iter-${i + 1}`,
        file: "iterations.png",
        box: FH_IT(i),
        redact: i >= 3 ? [FH_LOGO_LEFT] : undefined,
        widths: FH_PHONE_WIDTHS,
      })),
      // iteration 6 is the final design: same as the right-most final
      // screen, at 1720px instead of 1458
      { name: "final", file: "iterations.png", box: FH_IT(5), redact: [FH_LOGO_LEFT], widths: FH_PHONE_WIDTHS },
      // before/after close-ups, each pair cut from the same part of the
      // screen; regions verified by eye, not estimated
      ...[
        ["actions-v1", "first-version.png", FH_V1(0), [0, 530, 1720, 690]],
        ["actions-final", "iterations.png", FH_IT(5), [0, 590, 1720, 900]],
        ["tiles-row", "iterations.png", FH_IT(4), [0, 1500, 1720, 520]],
        ["tiles-grid", "iterations.png", FH_IT(5), [0, 1500, 1720, 520]],
        ["banner-v1", "first-version.png", FH_V1(0), [0, 3030, 1720, 570]],
        ["banner-final", "iterations.png", FH_IT(5), [0, 3020, 1720, 610]],
        ["money-v1", "first-version.png", FH_V1(0), [0, 2200, 1720, 780]],
        ["money-final", "iterations.png", FH_IT(5), [0, 2020, 1720, 980]],
      ].map(([name, file, phone, region]) => ({
        name,
        file,
        box: at(phone, region),
        bg: "#ffffff",
        widths: FH_PHONE_WIDTHS,
      })),
    ],
  },
  nova: {
    dir: "nova",
    images: [
      { name: "cover", file: "poster-brand.png" },
      // the three screens that used to be the hero: still the first thing
      // the page shows, now that the poster is the brand mark
      { name: "screens", file: "product-01.png" },
      { name: "onboarding", file: "onboarding.png" },
      { name: "home", file: "product-01.png", box: novaPhone(0, 660, 536), pad: NOVA_STAGE, widths: PHONE_WIDTHS },
      { name: "listening", file: "product-01.png", box: novaPhone(1, 660, 536), pad: NOVA_STAGE, widths: PHONE_WIDTHS },
      { name: "heard", file: "product-01.png", box: novaPhone(2, 660, 536), pad: NOVA_STAGE, widths: PHONE_WIDTHS },
      { name: "plan", file: "product-02.png", box: novaPhone(0, 0, 0), pad: NOVA_STAGE, widths: PHONE_WIDTHS },
      { name: "working", file: "product-02.png", box: novaPhone(1, 0, 0), pad: NOVA_STAGE, widths: PHONE_WIDTHS },
      { name: "done", file: "product-02.png", box: novaPhone(2, 0, 0), pad: NOVA_STAGE, widths: PHONE_WIDTHS },
      // close-ups: the transcript + chips, the plan container, the three replies
      { name: "chips", file: "product-01.png", box: [2540, 2577, 1720, 681], bg: "#ffffff" },
      { name: "plan-list", file: "product-02.png", box: [0, 943, 1720, 1250], bg: "#ffffff" },
      { name: "replies", file: "product-02.png", box: [0, 2040, 1720, 520], bg: "#ffffff" },
    ],
  },
  umami: {
    dir: "umami",
    images: [
      { name: "cover", file: "poster-brand.png" },
      { name: "hero-detail", file: "poster.png", crop: [0.653, 0.25, 0.34, 0.175] },
      { name: "before", file: "original-landing.png", widths: TALL },
      { name: "after", file: "landing.png", widths: TALL },
      { name: "overview", file: "features.png" },
      { name: "acquisition", file: "features-01.png", crop: [0, 0.01, 1, 0.41] },
      { name: "conversion", file: "features-02.png", crop: [0, 0.345, 1, 0.32] },
      { name: "privacy", file: "privacy.png" },
      { name: "closing", file: "footer.png" },
    ],
  },
  nuvex: {
    dir: "nuvex",
    images: [
      { name: "cover", file: "poster-brand.png" },
      { name: "totals", file: "closeup-1.png" },
      { name: "movers", file: "closeup-3.png" },
      { name: "assets", file: "closeup-2.png" },
    ],
  },
  "see-io": {
    dir: "see.io",
    images: [
      { name: "cover", file: "poster-brand.png" },
      { name: "hero-detail", file: "poster.png", crop: [0.2, 0.2, 0.6, 0.42] },
      { name: "before", file: "original-landing.png", widths: TALL },
      { name: "after", file: "landing.png", widths: TALL },
      { name: "hero-iteration", file: "hero-iteration-01.png" },
      { name: "steps", file: "steps.png" },
      { name: "features", file: "features.png" },
      { name: "pricing", file: "landing.png", crop: [0.15, 0.585, 0.7, 0.082] },
    ],
  },
  novq: {
    dir: "novq",
    images: [
      { name: "cover", file: "poster-brand.png" },
      { name: "hero-detail", file: "poster.png", crop: [0.04, 0.25, 0.6, 0.45] },
      { name: "stats", file: "stats.png" },
      { name: "features", file: "features.png" },
      { name: "how-it-works", file: "how-it-works.png" },
      { name: "faq", file: "faq.png" },
      { name: "closing", file: "footer.png" },
    ],
  },
  opsec: {
    dir: "opsec",
    images: [
      { name: "cover", file: "poster-brand.png" },
      { name: "kpis", file: "closeup.png" },
      { name: "protocols", file: "closeup-2.png" },
      { name: "assets", file: "closeup-3.png" },
    ],
  },
  takeuforward: {
    dir: "tuf",
    images: [
      { name: "cover", file: "poster-brand.png" },
      { name: "hero-detail", file: "poster.png", crop: [0.04, 0.13, 0.52, 0.33] },
      { name: "before", file: "original-landing.png", widths: TALL },
      { name: "after", file: "landing.png", widths: TALL },
      { name: "problem", file: "problem.png" },
      { name: "subjects", file: "landing.png", crop: [0.03, 0.31, 0.94, 0.1] },
      { name: "testimonials", file: "testimonial.png" },
      { name: "founder", file: "about.png" },
      { name: "closing", file: "footer.png" },
    ],
  },
  rungtm: {
    dir: "runGTM",
    images: [
      { name: "cover", file: "poster-brand.png" },
      { name: "overview", file: "closeup.png" },
      { name: "attention", file: "closeup-2.png" },
      { name: "channels", file: "closeup-3.png" },
    ],
  },
};

/** Site rasters that already live in the repo (small, in scripts/). */
const SITE = [
  {
    key: "site/avatar",
    file: path.join(ROOT, "scripts", "source-images", "dp.webp"),
    out: path.join(ROOT, "public", "avatar"),
    prefix: "dp",
    widths: [128, 384, 768, 1254],
  },
];

const toHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/**
 * Client work: blur a logo (or anything else confidential) out of a shot.
 * Boxes are [left, top, width, height] in pixels of the region AFTER any
 * crop/box, so one phone-relative box covers every screen of a 3-up.
 * The blur is padded well beyond the mark and heavy enough that no
 * letterform survives - the same soft smudge as a hand-redacted export.
 */
async function blurBoxes(buf, boxes) {
  const meta = await sharp(buf, { limitInputPixels: false }).metadata();
  const patches = [];
  for (const [left, top, width, height] of boxes) {
    const padX = Math.round(width * 0.22);
    const padY = Math.round(height * 0.5);
    const r = {
      left: Math.max(0, left - padX),
      top: Math.max(0, top - padY),
    };
    r.width = Math.min(meta.width - r.left, width + padX * 2);
    r.height = Math.min(meta.height - r.top, height + padY * 2);
    const input = await sharp(buf, { limitInputPixels: false })
      .extract(r)
      .blur(Math.max(4, r.height / 5))
      .png()
      .toBuffer();
    patches.push({ input, left: r.left, top: r.top });
  }
  return sharp(buf, { limitInputPixels: false }).composite(patches).png({ compressionLevel: 0 }).toBuffer();
}

/**
 * Load a source once, capped at the largest width. A shot may name
 * either `crop` (fractions of the source, for detail shots) or `box`
 * (absolute pixels, when the region was measured rather than estimated),
 * and may then be centred on a `pad` ground - the only way two cut-out
 * screens can share one canvas size and cross-fade without shifting.
 * `bg` flattens transparency for everything else.
 */
async function loadSource(file, image, maxWidth) {
  const { crop, box, pad, bg, redact } = image ?? {};
  const img = sharp(file, { limitInputPixels: false });
  const meta = await img.metadata();
  let pipeline = img;
  let width = meta.width;
  let height = meta.height;
  if (crop) {
    const [l, t, w, h] = crop;
    const rect = {
      left: Math.round(l * meta.width),
      top: Math.round(t * meta.height),
      width: Math.round(w * meta.width),
      height: Math.round(h * meta.height),
    };
    pipeline = pipeline.extract(rect);
    width = rect.width;
    height = rect.height;
  } else if (box) {
    const [left, top, w, h] = box;
    pipeline = pipeline.extract({ left, top, width: w, height: h });
    width = w;
    height = h;
  }
  if (redact?.length) {
    const raw = await pipeline.png({ compressionLevel: 0 }).toBuffer();
    pipeline = sharp(await blurBoxes(raw, redact), { limitInputPixels: false });
  }
  if (pad) {
    // sharp composites after resizing, so the cut-out has to be
    // materialised before it can be laid onto the ground.
    const cut = await pipeline.png().toBuffer();
    const ground = await sharp({
      create: { width: pad.width, height: pad.height, channels: 4, background: pad.background },
    })
      .composite([
        {
          input: cut,
          left: Math.round((pad.width - width) / 2),
          top: Math.round((pad.height - height) / 2),
        },
      ])
      .png()
      .toBuffer();
    pipeline = sharp(ground, { limitInputPixels: false });
    width = pad.width;
    height = pad.height;
  }
  const ground = pad?.background ?? bg;
  if (ground) pipeline = pipeline.flatten({ background: ground });
  const target = Math.min(width, maxWidth);
  const buf = await pipeline
    .resize({ width: target, kernel: "lanczos3" })
    .removeAlpha()
    .png({ compressionLevel: 1 })
    .toBuffer();
  return { buf, width: target, height: Math.round((height * target) / width) };
}

async function emitResponsive(source, outDir, prefix, widths) {
  const made = [];
  for (const w of widths.filter((w) => w <= source.width)) {
    await sharp(source.buf, { limitInputPixels: false })
      .resize({ width: w, kernel: "lanczos3" })
      .webp({ quality: 80, effort: 5, smartSubsample: true })
      .toFile(path.join(outDir, `${prefix}-${w}.webp`));
    made.push(w);
  }
  // A crop narrower than the largest width still ships at its own full
  // resolution, so a zoomed detail stays sharp on 2x screens.
  const top = made[made.length - 1];
  if (top && source.width > top * 1.1 && source.width < Math.max(...widths)) {
    await sharp(source.buf, { limitInputPixels: false })
      .webp({ quality: 80, effort: 5, smartSubsample: true })
      .toFile(path.join(outDir, `${prefix}-${source.width}.webp`));
    made.push(source.width);
  }
  // Never leave a source without at least its own width.
  if (made.length === 0) {
    await sharp(source.buf, { limitInputPixels: false })
      .webp({ quality: 80, effort: 5, smartSubsample: true })
      .toFile(path.join(outDir, `${prefix}-${source.width}.webp`));
    made.push(source.width);
  }
  const { dominant } = await sharp(source.buf, { limitInputPixels: false }).stats();
  const tiny = await sharp(source.buf, { limitInputPixels: false })
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();
  return {
    widths: made,
    color: toHex(dominant),
    blur: `data:image/webp;base64,${tiny.toString("base64")}`,
  };
}

/** 1200x630 share card: the poster on page paper, bleeding off the bottom. */
async function emitOg(posterFile, outFile) {
  const W = 1200;
  const H = 630;
  const inner = 1056;
  const poster = await sharp(posterFile, { limitInputPixels: false })
    .resize({ width: inner, kernel: "lanczos3" })
    .removeAlpha()
    .png()
    .toBuffer();
  const meta = await sharp(poster).metadata();
  const top = 64;
  const visible = Math.min(meta.height, H - top);
  const clipped = await sharp(poster)
    .extract({ left: 0, top: 0, width: inner, height: visible })
    .toBuffer();
  const left = (W - inner) / 2;
  const hairline = Buffer.from(
    `<svg width="${W}" height="${H}"><rect x="${left - 0.5}" y="${top - 0.5}" width="${inner + 1}" height="${visible + 2}" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1"/></svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
    .composite([
      { input: clipped, left, top },
      { input: hairline, left: 0, top: 0 },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(outFile);
}

/** Existing manifest, so `--only` can rebuild one case and keep the rest. */
async function readManifest() {
  if (!existsSync(MANIFEST)) return {};
  const src = await readFile(MANIFEST, "utf8");
  const start = src.indexOf("{", src.indexOf("export const IMAGES"));
  const end = src.lastIndexOf("} as const");
  if (start < 0 || end < 0) return {};
  return JSON.parse(src.slice(start, end + 1));
}

async function main() {
  if (!existsSync(ASSETS)) {
    console.error(`Assets folder not found: ${ASSETS}`);
    process.exit(1);
  }
  // `--only <slug>` rebuilds a single case study and merges it into the
  // manifest, so adding one page never touches the other six.
  // Covers and share cards are written under new names (cover-*, share.jpg)
  // rather than over the old poster-* / og.jpg: /img is served immutable
  // for a year, so a file replaced in place never reaches a returning
  // visitor. Never overwrite a published filename with different bytes.
  // `--only <slug>` rebuilds a case; `--only <slug>/<image>` rebuilds one
  // shot inside it and leaves the case's other files on disk untouched -
  // the only way to swap a poster without re-exporting everything else.
  const arg = ONLY_AT > -1 ? ARGV[ONLY_AT + 1] : null;
  const [only, onlyImage] = arg ? arg.split("/") : [null, null];
  if (only && !CASES[only]) {
    console.error(`Unknown case: ${only}. One of: ${Object.keys(CASES).join(", ")}`);
    process.exit(1);
  }
  const manifest = only ? await readManifest() : {};

  for (const [slug, { dir, images }] of Object.entries(CASES)) {
    if (only && slug !== only) continue;
    const outDir = path.join(OUT_IMG, slug);
    if (!onlyImage) await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });
    const todo = onlyImage ? images.filter((i) => i.name === onlyImage) : images;
    if (onlyImage && todo.length === 0) {
      console.error(`Unknown image: ${only}/${onlyImage}`);
      process.exit(1);
    }
    for (const image of todo) {
      const file = path.join(ASSETS, dir, image.file);
      const widths = image.widths ?? (image.name === "cover" ? POSTER : WIDE);
      const source = await loadSource(file, image, Math.max(...widths));
      const info = await emitResponsive(source, outDir, image.name, widths);
      manifest[`${slug}/${image.name}`] = {
        base: `/img/${slug}/${image.name}`,
        width: source.width,
        height: source.height,
        ...info,
      };
      process.stdout.write(`  ${slug}/${image.name} ${info.widths.join(",")}\n`);
    }
    if (!onlyImage || onlyImage === "cover") {
      await emitOg(path.join(ASSETS, dir, images[0].file), path.join(outDir, "share.jpg"));
    }
  }

  for (const site of only ? [] : SITE) {
    await rm(site.out, { recursive: true, force: true });
    await mkdir(site.out, { recursive: true });
    const source = await loadSource(site.file, null, Math.max(...site.widths));
    const info = await emitResponsive(source, site.out, site.prefix, site.widths);
    manifest[site.key] = {
      base: `/${path.relative(path.join(ROOT, "public"), site.out)}/${site.prefix}`,
      width: source.width,
      height: source.height,
      ...info,
    };
  }

  // Album art: shown as a small circle, so a square centre crop.
  if (!only) {
    await sharp(path.join(ROOT, "scripts", "source-images", "blue-poster.webp"))
      .resize({ width: 320, height: 320, fit: "cover" })
      .webp({ quality: 82 })
      .toFile(path.join(ROOT, "public", "music", "blue-poster-320.webp"));
  }

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  const body = `// Generated by scripts/build-images.mjs - do not edit by hand.
import type { ImageAsset } from "./image-types";

export const IMAGES = ${JSON.stringify(sorted, null, 2)} as const satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof IMAGES;
`;
  await mkdir(path.dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, body);
  console.log(`\nWrote ${Object.keys(manifest).length} images to the manifest.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
