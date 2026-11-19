import type { Metadata } from "next";
import { preload } from "react-dom";
import PageShell from "@/components/page-shell";
import AboutSection from "@/components/about-section";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "About",
  "Negativ (Rohit Mehta), a designer who ships code. One brain, both sides of the handoff: design and code.",
  "/about",
);

export default function AboutPage() {
  /* The portrait is the LCP element: hoist a responsive preload into
     <head> so its bytes ride the first response. Every image on the page
     has fixed dimensions, so nothing waits on JS or a reveal gate. */
  preload("/avatar/dp-768.webp", {
    as: "image",
    imageSrcSet:
      "/avatar/dp-384.webp 384w, /avatar/dp-768.webp 768w, /avatar/dp-1254.webp 1254w",
    imageSizes: "(min-width: 640px) 288px, calc(100vw - 32px)",
    fetchPriority: "high",
  });

  return (
    <PageShell active="about">
      <h1 className="sr-only">Negativ, a designer who ships code</h1>
      <div className="w-full pt-16 sm:pt-24 md:pt-32">
        <AboutSection />
      </div>
    </PageShell>
  );
}
