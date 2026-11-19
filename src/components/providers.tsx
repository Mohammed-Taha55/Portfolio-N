"use client";

import { MotionConfig } from "motion/react";

/**
 * Honour prefers-reduced-motion for every Motion animation below.
 * Mounted only around the parts of the site that use Motion (hero, lab,
 * about), so pages without them - the case studies - never download it.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
