import type { ComponentType, CSSProperties } from "react";
import {
  GithubLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

/** One number on the hover card, with the word it counts. */
export interface SocialStat {
  value: string;
  label: string;
}

/**
 * Copy for the hover card. The counts are the ones on the live profiles
 * (X 338 / 82, GitHub 17 / 9, LinkedIn 400 connections) - change them here
 * and every tooltip follows, rather than editing the card component.
 */
export interface SocialProfile {
  /** Display name, as the platform shows it. */
  name: string;
  /** Handle or vanity path, shown under the name. */
  handle: string;
  bio: string;
  /** Location or link line, whichever the platform leads with. */
  meta: string;
  verified?: boolean;
  stats: SocialStat[];
}

/** Badge face colours - the hover card's header reuses them, so the
    card visibly belongs to the icon it came from. */
export interface SocialSkin {
  /** face fill */
  bg: string;
  /** 1px stroke, one shade darker than the face */
  edge: string;
}

export interface Social {
  label: string;
  /** Platform name as the platform writes it today. */
  platform: string;
  href: string;
  skin: SocialSkin;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  download?: boolean;
  profile: SocialProfile;
}

export const SOCIALS: Social[] = [
  {
    label: "Twitter",
    platform: "X",
    href: "https://x.com/rohitmehta_twt",
    skin: { bg: "#0a0a0a", edge: "#000000" },
    icon: XLogoIcon,
    profile: {
      name: "Negativ",
      handle: "@rohitmehta_twt",
      bio: "23 · Engineer",
      meta: "portfolio.negativ.in · Joined March 2024",
      verified: true,
      stats: [
        { value: "338", label: "Followers" },
        { value: "82", label: "Following" },
      ],
    },
  },
  {
    label: "Github",
    platform: "GitHub",
    href: "https://github.com/negativ14",
    skin: { bg: "#8b5cf6", edge: "#7c3aed" },
    icon: GithubLogoIcon,
    profile: {
      name: "Rohit Mehta",
      handle: "negativ14",
      bio: "Design engineer. Coding anyway.",
      meta: "Ballari, India · UTC+05:30",
      stats: [
        { value: "17", label: "Followers" },
        { value: "9", label: "Following" },
      ],
    },
  },
  // {
  //   label: "Email",
  //   href: "mailto:email.rohitmehta@gmail.com",
  //   icon: EnvelopeSimpleIcon,
  // },
  {
    label: "LinkedIn",
    platform: "LinkedIn",
    href: "https://www.linkedin.com/in/rohitmehta14",
    skin: { bg: "#3b82f6", edge: "#2563eb" },
    icon: LinkedinLogoIcon,
    profile: {
      name: "Rohit Mehta",
      handle: "in/rohitmehta14",
      bio: "Design Engineer · Available for work",
      meta: "Ballari, Karnataka, India",
      stats: [{ value: "400", label: "Connections" }],
    },
  },
];
