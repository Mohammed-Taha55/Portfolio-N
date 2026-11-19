"use client";

import { motion } from "motion/react";
import { RocketLaunchIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { ExperienceData } from "@/constants/experience";

/**
 * Collapsed-only experience row: org logo (no ring), role + mode,
 * company, date. No expand, no details button.
 */
export default function ExperienceCard({
  experience,
  className,
}: {
  experience: ExperienceData;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-4", className)}>
      <div className="shrink-0">
        <div className="flex items-center justify-center overflow-hidden rounded-lg">
          {experience.companyImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={experience.companyImage}
              alt={experience.companyName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg bg-white object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = "/window.svg";
              }}
            />
          ) : (
            // freelance fallback: blue gradient badge with gloss +
            // own-color drops, same recipe as the hero social badges
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2563eb] bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-white"
              style={{
                boxShadow:
                  "inset 0 1px 0 0 rgba(255,255,255,0.4), inset 4px 4px 4px 0 rgba(255,255,255,0.06), inset -4px 4px 4px 0 rgba(255,255,255,0.06), inset 6px 6px 6px 0 rgba(255,255,255,0.04), inset -6px 6px 6px 0 rgba(255,255,255,0.04), 0 1px 2px -0.25px rgba(59,130,246,0.5), 0 2px 4px -0.5px rgba(37,99,235,0.4)",
              }}
            >
              <RocketLaunchIcon className="size-5" weight="fill" />
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <motion.h3
              layout="position"
              layoutId={`experience-role-${experience.id}`}
              className="truncate text-base leading-tight font-semibold text-neutral-600"
            >
              {experience.role}
            </motion.h3>
          </div>
          <motion.span
            layout="position"
            layoutId={`experience-date-${experience.id}`}
            className="hidden shrink-0 leading-none whitespace-nowrap text-sm text-neutral-500 sm:inline"
          >
            {experience.startDate} - {experience.endDate}
          </motion.span>
        </div>

        <motion.p
          layout="position"
          layoutId={`experience-company-name-${experience.id}`}
          className="text-sm leading-tight text-neutral-500"
        >
          {experience.companyName}
        </motion.p>

        <motion.span
          layout="position"
          layoutId={`experience-date-mobile-${experience.id}`}
          className="mt-1 text-sm leading-tight text-neutral-500 sm:hidden"
        >
          {experience.startDate} - {experience.endDate}
        </motion.span>
      </div>
    </div>
  );
}
