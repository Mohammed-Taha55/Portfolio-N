import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import { FadeIn } from "@/components/fade-in";
import { LAB_ENTRIES } from "@/components/lab-entries";
import { pageMeta } from "@/lib/site";

export function generateStaticParams() {
  return LAB_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = LAB_ENTRIES.find((e) => e.slug === slug);
  if (!entry) return {};
  return pageMeta(entry.name, entry.blurb, `/lab/${entry.slug}`);
}

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = LAB_ENTRIES.find((e) => e.slug === slug);
  if (!entry) notFound();

  const { Demo } = entry;

  return (
    <PageShell active="lab">
      <div className="flex w-full flex-col pt-16 sm:pt-20">
        <FadeIn>
          <Link
            href="/lab"
            className="inline-flex items-center gap-1.5 font-mono text-sm tracking-wide text-neutral-500 uppercase transition-colors hover:text-neutral-900"
          >
            {/* inline arrow: page.tsx is a server component and cannot
                import the client-only icon library - that import pulled
                createContext into the RSC module graph and 500'd every
                /lab/[slug] route */}
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 256 256"
              fill="none"
              stroke="currentColor"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="120 32 32 128 120 224" />
              <line x1="32" y1="128" x2="224" y2="128" />
            </svg>
            Back
          </Link>
        </FadeIn>

        <FadeIn delay={0.08} className="flex flex-col items-center pt-8">
          <div className="w-full overflow-hidden">
            <Demo />
          </div>
          <h1 className="pt-4 text-center font-sans text-base font-medium tracking-normal text-neutral-900">
            {entry.name}
          </h1>
        </FadeIn>
      </div>
    </PageShell>
  );
}
