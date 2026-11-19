import { cn } from "@/lib/utils";
import { FadeIn } from "./fade-in";
import ExperienceSection from "./experience-section";
import BluePlayer2 from "./blue-player-2";

/**
 * About: fixed-size DP left, bio right, experience below - all inside
 * ONE centered column so the DP's left edge, the bio's right edge and
 * every experience row share the same two vertical lines. Tight fixed
 * gap (no fr slack), so there is no dead air between portrait & text.
 */
function CloudDp({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full shrink-0 sm:w-72 mask-radial-from-40%", className)}>
      {/* base: gentle all-round melt */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar/dp-768.webp"
        srcSet="/avatar/dp-384.webp 384w, /avatar/dp-768.webp 768w, /avatar/dp-1254.webp 1254w"
        sizes="(min-width: 640px) 288px, calc(100vw - 32px)"
        alt="Rohit Mehta aka Negativ"
        width={1254}
        height={1254}
        loading="eager"
        decoding="async"
        draggable={false}
        className="block h-auto w-full"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 78% 78% at 50% 46%, black 60%, transparent 82%)",
          maskImage:
            "radial-gradient(ellipse 78% 78% at 50% 46%, black 60%, transparent 82%)",
        }}
      />
      {/* top pull: short */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#fafcfd]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 6%, transparent 26%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 6%, transparent 26%)",
        }}
      />
      {/* bottom pull */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#fafcfd]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black 8%, transparent 31%)",
          maskImage:
            "linear-gradient(to top, black 0%, black 8%, transparent 30%)",
        }}
      />
      {/* left pull */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#fafcfd]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 8%, transparent 34%)",
          maskImage:
            "linear-gradient(to right, black 0%, black 8%, transparent 34%)",
        }}
      />
      {/* right pull */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#fafcfd]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to left, black 0%, black 8%, transparent 34%)",
          maskImage:
            "linear-gradient(to left, black 0%, black 8%, transparent 34%)",
        }}
      />
    </div>
  );
}



export default function AboutSection({ className }: { className?: string }) {
  return (
    <section className={cn("flex w-full flex-col pb-12 sm:pb-16", className)}>
      {/* single column: intro + experience share the exact same width.
          DP box sticks out -ml-2 -mt-2 so the visible (faded) portrait -
          not its transparent mask padding - sits on the experience line. */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 sm:gap-16">
        {/* intro: fixed DP + flexible text, vertically centered */}
        <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-center">
          <FadeIn className="md:-translate-x-8 shrink-0">
            <CloudDp />
          </FadeIn>
          <FadeIn
            delay={0.08}
            className="flex min-w-0 flex-1 flex-col justify-center gap-3"
          >
            <p className="text-neutral-500">
              I&apos;m Rohit Mehta, a design engineer who takes products from design to code.
              I care about making UIs intuitive, purposeful, and easy
              to understand, not just fancy.
            </p>
            <p className="text-neutral-500">
              I learn by building, breaking, and recreating things I like,
              figuring out what makes them work.
            </p>
            <p className="text-neutral-500">
              I love{" "}
              <a
                href="#blue-player"
                className="cursor-pointer font-medium text-blue-600 underline-offset-4 hover:underline"
              >
                blue
              </a>
            </p>
          </FadeIn>
        </div>

        <FadeIn className="w-full">
          <ExperienceSection />
        </FadeIn>

        <FadeIn className="w-full py-10" delay={0.05}>
          <BluePlayer2 />
        </FadeIn>
      </div>
    </section>
  );
}
