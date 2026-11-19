import type { Metadata } from "next";
import { Brawler } from "next/font/google";
import PageShell from "@/components/page-shell";
import Hero from "@/components/hero";
import PosterGrid from "@/components/poster-grid";
import { HOME_DESCRIPTION, HOME_TITLE, pageMeta } from "@/lib/site";

/* Brawler - hero headline only, so it's loaded (and preloaded) on the
   homepage alone instead of on every route. Not a variable font: 400 is
   the one cut the headline uses; no 700, no italic. */
const brawler = Brawler({
  variable: "--font-brawler",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = pageMeta("Home", HOME_DESCRIPTION, "/", HOME_TITLE);

export default function Home() {
  return (
    <PageShell active="home">
      {/* The hero owns a layer above the grid. The social hover card is
          absolutely positioned inside a <FadeIn>, whose entrance blurs
          the element - and a filter creates a stacking context, which
          traps the card's own z-index inside the hero. Without this the
          card is painted over by the posters, which come later in the
          DOM. Both layers stay under the dock (z-50). */}
      <div className={`${brawler.variable} relative z-10 w-full pt-16 sm:pt-20`}>
        <Hero />
      </div>
      <section
        id="work"
        aria-labelledby="work-heading"
        className="relative z-0 pt-6 pb-20 md:pt-10 md:pb-28"
      >
        <h2 id="work-heading" className="sr-only">
          Selected work
        </h2>
        <PosterGrid />
      </section>
    </PageShell>
  );
}
