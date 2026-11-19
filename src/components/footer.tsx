import { cn } from "@/lib/utils";
import { SOCIALS } from "@/constants/socials";
import { FadeIn } from "./fade-in";

const FOOTER_SOCIALS = ["Twitter", "Github", "LinkedIn"];

export default function Footer({ className }: { className?: string }) {
  return (
    <FadeIn
      className={cn("border-t border-dashed border-neutral-200 py-2 md:py-4", className)}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-500 sm:text-base">
          Design & Developed by <span className="font-medium text-neutral-800">Rohit</span>{" "}
          aka <span className="font-medium text-neutral-800">Negativ</span>
        </p>

        <nav aria-label="Footer social links" className="hidden items-center gap-4 sm:flex">
          {FOOTER_SOCIALS.map((label) => {
            const social = SOCIALS.find((s) => s.label === label);
            if (!social) return null;
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target={social.download ? undefined : "_blank"}
                rel={social.download ? undefined : "noopener noreferrer"}
                download={social.download}
                aria-label={social.label}
                title={social.label}
                className="flex shrink-0 items-center text-neutral-500 transition-[color,scale] duration-150 hover:text-neutral-950 active:scale-[0.98]"
              >
                <Icon className="size-4 shrink-0" />
              </a>
            );
          })}
        </nav>
      </div>
    </FadeIn>
  );
}
