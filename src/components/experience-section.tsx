"use client";

import { cn } from "@/lib/utils";
import { EXPERIENCES } from "@/constants/experience";
import ExperienceCard from "./experience-card";

/** Portfolio v2 experience list: logo + role/mode/dates, expandable details */
export default function ExperienceSection({ className }: { className?: string }) {
  return (
    <section aria-labelledby="experience-heading" className={cn("flex w-full flex-col", className)}>
      <h2 id="experience-heading" className="sr-only">
        Experience
      </h2>
      <div className="flex flex-col">
        {EXPERIENCES.map((exp) => (
          <div key={exp.id} className="relative w-full">
            <ExperienceCard experience={exp} className="w-full py-4" />
          </div>
        ))}
      </div>
    </section>
  );
}
