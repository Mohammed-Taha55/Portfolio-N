#!/usr/bin/env node
/**
 * Builds the /gallery rasters.
 *
 *   node scripts/build-gallery.mjs [path/to/gallery]
 *
 * Sources are the PNG exports in the gallery folder next to this repo
 * (default: ../gallery). Only the outputs enter the repo:
 *
 *   public/gallery/<slug>-<width>.webp   responsive widths
 *   public/gallery/og.jpg                1200x630 share card
 *   src/content/gallery.generated.ts     sizes, colour, blur, alt
 *
 * The numbered image-<n> files are the order the gallery opens with.
 * Everything else follows in natural filename order, except the sources
 * pinned in PLACED below, which sit at a fixed position.
 */
import sharp from "sharp";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

sharp.cache(false);
sharp.concurrency(2);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(process.argv[2] ?? path.join(ROOT, "..", "gallery"));
const OUT_DIR = path.join(ROOT, "public", "gallery");
const MANIFEST = path.join(ROOT, "src", "content", "gallery.generated.ts");
const PAPER = "#fafcfd";

/** One step below the 384px column, then 2x, then full-screen. */
const WIDTHS = [480, 768, 1080, 1600, 2400];
const MAX_WIDTH = Math.max(...WIDTHS);

/**
 * Sources pinned to a position in the finished gallery (1-based). Every
 * other file keeps its natural order and shifts down to make room, so
 * nothing swaps places.
 */
const PLACED = {
  "Frame 2147298040.png": 6,
  "product-01.png": 9,
  "product-02.png": 22,
};

/** Explicit slugs: spaces, brackets and dots make bad URLs. */
const SLUGS = {
  "Frame 2147298040.png": "image-13",
  "image-01.png": "image-1",
  "Frame 4528.png": "frame-4528",
  "Frame 238448 (1).png": "frame-238448-1",
  "Frame 238448 (4).png": "frame-238448-4",
  "Frame 238448 (5).png": "frame-238448-5",
  "Frame 238448 (7).png": "frame-238448-7",
  "Frame 238448 (9).png": "frame-238448-9",
  "Frame 238452 (2).png": "frame-238452-2",
  "Frame 238452 (3).png": "frame-238452-3",
  "Frame 238455 (1).png": "frame-238455-1",
  "Screenshot 2026-11-17 at 4.11.12 AM.png": "screenshot-1",
  "Screenshot 2026-11-17 at 4.26.02 AM.png": "screenshot-2",
  "Screenshot 2026-11-17 at 4.27.53 AM.png": "screenshot-3",
  "closeup 2.png": "closeup-2",
  "features 2.png": "features-2",
  "footer 2.png": "footer-2",
  "landing-01 (4).png": "landing-01-4",
  "landing-2 (2).png": "landing-2-2",
  "poster 3.png": "poster-3",
};

/** Alt text is content, not generated: these are read by people and crawlers. */
const ALT = {
  "image-1": "Nova onboarding screens with a welcome, app connections and microphone permission",
  "image-2": "Light analytics dashboard with revenue, conversion and traffic charts",
  "image-3": "Dark analytics dashboard with balance cards and a large area chart",
  "image-4": "Analytics dashboard with balance history and a country breakdown",
  "image-5": "Website builder feature page with floating interface cards",
  "image-6": "Website builder benefits section with speed, support and uptime stats",
  "image-7": "Dark website builder dashboard with three feature cards",
  "image-8": "Frequently asked questions section for a website builder",
  "image-9": "Dark landing page for an AI website builder with a glowing prompt",
  "image-10": "Three-step website builder flow with screens and progress steps",
  "image-11": "Analytics overview with a traffic chart, channels and top pages",
  "image-12": "Pricing page with plan comparison and a feature checklist",
  "image-13":
    "Banking app home screens with balances, currency accounts and recent transactions",
  closeup: "Net worth overview with balance history and account actions",
  "closeup-2": "Budget overview card with spending progress and a category breakdown",
  "closeup-1": "Account balance card with an area chart and recent transfers",
  "features-2": "Website analytics landing page with three product screens",
  "features-01": "Analytics feature section with product cards and charts",
  "features-02": "Two-column layout showing conversion and traffic features",
  "footer-2": "Dark footer with a call to action and navigation links",
  footer: "Footer with performance statistics and a try-now banner",
  "frame-4528": "Light feature section with three core product cards",
  "frame-238448-1": "Team profile page with an illustrated portrait and interview highlights",
  "frame-238448-4": "Dark call-to-action card for booking a practice interview",
  "frame-238448-5": "Dark FAQ section with expandable question rows",
  "frame-238448-7": "Illustrated hero with a character portrait and a start button",
  "frame-238448-9": "Dark feature grid for an interview practice platform",
  "frame-238452-2": "Resume upload card on a light background",
  "frame-238452-3": "Loading state with a progress message and animated dots",
  "frame-238455-1": "Dark analytics dashboard with a data table and comparison chart",
  "hero-iteration-01": "AI website builder hero with a glowing prompt field and dark backdrop",
  "how-it-works": "Three-step process cards on a light background",
  "landing-01-4": "Novq landing page with a large wordmark and app screens",
  "landing-2-2": "Website analytics landing page with a product preview",
  poster: "Light landing page with an AI workflow diagram and stacked cards",
  "poster-3": "Dark hero for a technical interview practice platform",
  privacy: "Privacy section with three icon cards and a no-tracking promise",
  "product-01":
    "Voice assistant phone screens with a task prompt, live listening and a spoken request",
  "product-02":
    "Voice assistant task plan screens showing the steps, live progress and a finished run",
  problem: "Study platform problem statement with app screens and feature callouts",
  "screenshot-1": "Productivity app with a task list, timer and recent projects",
  "screenshot-2": "Dark presentation slide for an AI app builder",
  "screenshot-3": "Dark dashboard with multiple data panels and a sidebar",
  testimonial: "Testimonials page for a study platform with student quotes",
};

const toHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/** macOS screenshots use a narrow no-break space before AM/PM. */
const cleanName = (file) => file.replace(/\u202f/g, " ");

const slugOf = (file) =>
  SLUGS[cleanName(file)] ??
  file
    .replace(/\.png$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const numberedIndex = (file) => {
  const m = /^image-(\d+)\.png$/i.exec(file);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
};

/** Load the source once, flattened on paper and capped at 2400px. */
async function loadSource(file) {
  const img = sharp(file, { limitInputPixels: false });
  const meta = await img.metadata();
  const width = Math.min(meta.width, MAX_WIDTH);
  const height = Math.round((meta.height * width) / meta.width);
  const buf = await img
    .resize({ width, kernel: "lanczos3" })
    .flatten({ background: PAPER })
    .png({ compressionLevel: 1 })
    .toBuffer();
  return { buf, width, height };
}

async function emitResponsive(source, prefix) {
  const made = [];
  for (const width of WIDTHS.filter((w) => w <= source.width)) {
    await sharp(source.buf, { limitInputPixels: false })
      .resize({ width, kernel: "lanczos3" })
      .webp({ quality: 84, effort: 5, smartSubsample: true })
      .toFile(path.join(OUT_DIR, `${prefix}-${width}.webp`));
    made.push(width);
  }

  // A source smaller than the widest step still ships at its own
  // resolution, so the lightbox never upscales a soft file.
  const top = made[made.length - 1];
  if (top === undefined || (source.width > top * 1.1 && source.width < MAX_WIDTH)) {
    await sharp(source.buf, { limitInputPixels: false })
      .webp({ quality: 84, effort: 5, smartSubsample: true })
      .toFile(path.join(OUT_DIR, `${prefix}-${source.width}.webp`));
    made.push(source.width);
  }

  const { dominant } = await sharp(source.buf).stats();
  const tiny = await sharp(source.buf)
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();

  return {
    widths: made,
    color: toHex(dominant),
    blur: `data:image/webp;base64,${tiny.toString("base64")}`,
  };
}

/** 1200x630 share card: the first image on page paper, bleeding off the bottom. */
async function emitOg(file) {
  const W = 1200;
  const H = 630;
  const inner = 1056;
  const top = 64;
  const poster = await sharp(file, { limitInputPixels: false })
    .resize({ width: inner, kernel: "lanczos3" })
    .flatten({ background: PAPER })
    .png()
    .toBuffer();
  const meta = await sharp(poster).metadata();
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
    .toFile(path.join(OUT_DIR, "og.jpg"));
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Gallery folder not found: ${SOURCE}`);
    process.exit(1);
  }

  const natural = (await readdir(SOURCE))
    .filter((file) => /\.png$/i.test(file))
    .sort((a, b) => {
      const na = numberedIndex(a);
      const nb = numberedIndex(b);
      if (na !== nb) return na - nb;
      return a.localeCompare(b, undefined, { numeric: true });
    });

  // Pull the pinned files out, then drop each one back in at its target
  // position. Pins are applied in ascending order, so the file already
  // in that place and everything after it moves down one instead of
  // swapping.
  const byCleanName = new Map(natural.map((file) => [cleanName(file), file]));
  const files = natural.filter((file) => !PLACED[cleanName(file)]);
  for (const file of Object.keys(PLACED).sort((a, b) => PLACED[a] - PLACED[b])) {
    const source = byCleanName.get(file);
    if (source) files.splice(PLACED[file] - 1, 0, source);
  }

  if (files.length === 0) {
    console.error(`No PNG files in ${SOURCE}`);
    process.exit(1);
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const gallery = [];
  for (const file of files) {
    const slug = slugOf(file);
    const source = await loadSource(path.join(SOURCE, file));
    const info = await emitResponsive(source, slug);
    gallery.push({
      slug,
      base: `/gallery/${slug}`,
      width: source.width,
      height: source.height,
      widths: info.widths,
      color: info.color,
      blur: info.blur,
      alt: ALT[slug] ?? `Interface design from the Negativ gallery: ${slug.replace(/-/g, " ")}`,
    });
    process.stdout.write(`  ${slug} ${info.widths.join(",")}\n`);
  }

  await emitOg(path.join(SOURCE, files[0]));

  const body = `// Generated by scripts/build-gallery.mjs - do not edit by hand.
import type { GalleryAsset } from "./gallery-types";

export const GALLERY = ${JSON.stringify(gallery, null, 2)} as const satisfies readonly GalleryAsset[];
`;
  await writeFile(MANIFEST, body);
  console.log(`\nWrote ${gallery.length} gallery images to the manifest.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
