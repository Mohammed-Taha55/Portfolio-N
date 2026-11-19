import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import LabSection from "@/components/lab-section";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Lab",
  "Live interactive components by Negativ. Real state, real interaction, no mocks.",
  "/lab",
);

export default function LabPage() {
  return (
    <PageShell active="lab">
      <div className="w-full pt-16 pb-8 sm:pt-24 sm:pb-16 md:pt-32">
        <LabSection />
      </div>
    </PageShell>
  );
}
