import { buttonVariants } from "@notra/ui/components/ui/button";
import { Discord } from "@notra/ui/components/ui/svgs/discord";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linkedin } from "@notra/ui/components/ui/svgs/linkedin";
import { Reddit } from "@notra/ui/components/ui/svgs/reddit";
import { XTwitter } from "@notra/ui/components/ui/svgs/twitter";
import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";
import { AI_SUMMARY_LINKS } from "@/utils/ai-summary-links";
import {
  FOOTER_FREE_TOOL_LINKS,
  FOOTER_INTEGRATION_LINKS,
  FOOTER_PRODUCT_LINKS,
  FOOTER_TOOL_LINKS,
} from "@/utils/navigation";
import { SOCIAL_LINKS } from "../utils/social-links";
import { NotraMark } from "./notra-mark";
import { TrackedAiSummaryLink } from "./tracked-ai-summary-link";

export default function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <div className="flex w-full flex-col items-start justify-start pt-10">
      <div className="flex h-auto flex-col items-stretch justify-between self-stretch pt-0 pr-0 pb-8 md:flex-row">
        <div className="flex h-auto flex-col items-start justify-start gap-8 p-4 md:p-8">
          <div className="flex items-center justify-start gap-3 self-stretch">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-transparent p-1 dark:bg-[#f3eeea]">
              <NotraMark className="h-6 w-6 shrink-0" />
            </div>
            <div className="font-sans font-semibold text-foreground text-xl leading-4">
              Notra
            </div>
          </div>
          <div className="font-medium font-sans text-foreground/90 text-sm leading-4.5">
            Ship more. Write less. Reach more.
          </div>
          <div className="font-normal font-sans text-foreground/60 text-xs leading-5">
            {`© ${year} Notra, Inc. All rights reserved.`}
          </div>

          <div className="flex items-start justify-start gap-2 text-foreground">
            <Link
              aria-label="Visit Notra on X"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.x}
              rel="noopener noreferrer"
              target="_blank"
            >
              <XTwitter className="size-5" />
            </Link>
            <Link
              aria-label="Visit Notra on LinkedIn"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.linkedin}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Linkedin className="size-5" />
            </Link>
            <Link
              aria-label="Visit Notra on GitHub"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="size-5" />
            </Link>
            <Link
              aria-label="Visit Notra on Discord"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.discord}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Discord className="size-5" />
            </Link>
            <Link
              aria-label="Visit Notra on Reddit"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.reddit}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Reddit className="size-5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 self-stretch p-4 sm:flex sm:flex-row sm:flex-wrap sm:items-start sm:justify-between md:gap-8 md:p-8">
          <div className="flex min-w-30 flex-1 flex-col items-start justify-start gap-3">
            <div className="font-medium font-sans text-foreground/50 text-sm leading-5">
              Product
            </div>
            <div className="flex flex-col items-start justify-end gap-2">
              {FOOTER_PRODUCT_LINKS.map((link) => (
                <Link
                  className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                  href={link.href}
                  key={link.href}
                  rel={"rel" in link ? link.rel : undefined}
                  target={"target" in link ? link.target : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex min-w-30 flex-1 flex-col items-start justify-start gap-3">
            <div className="font-medium font-sans text-foreground/50 text-sm leading-5">
              Tools
            </div>
            <div className="flex flex-col items-start justify-end gap-2">
              {FOOTER_TOOL_LINKS.map((link) => (
                <Link
                  className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                  href={link.href}
                  key={link.href}
                  rel={link.rel}
                  target={link.target}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex min-w-30 flex-1 flex-col items-start justify-start gap-3">
            <div className="font-medium font-sans text-foreground/50 text-sm leading-5">
              Free Tools
            </div>
            <div className="flex flex-col items-start justify-end gap-2">
              {FOOTER_FREE_TOOL_LINKS.map((link) => (
                <Link
                  className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex min-w-30 flex-1 flex-col items-start justify-start gap-3">
            <div className="font-medium font-sans text-foreground/50 text-sm leading-5">
              Integrations
            </div>
            <div className="flex flex-col items-start justify-end gap-2">
              {FOOTER_INTEGRATION_LINKS.map((link) => (
                <Link
                  className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                  href={link.href}
                  key={link.href}
                  rel={link.rel}
                  target={link.target}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex min-w-30 flex-1 flex-col items-start justify-start gap-3">
            <div className="font-medium font-sans text-foreground/50 text-sm leading-5">
              Legal
            </div>
            <div className="flex flex-col items-start justify-center gap-2">
              <Link
                className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              <Link
                className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                href="/terms"
              >
                Terms of Service
              </Link>
              <Link
                className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                href="/legal"
              >
                Legal Notice
              </Link>
              <Link
                className="font-normal font-sans text-foreground text-sm leading-5 transition-colors hover:text-primary"
                href="/subprocessors"
              >
                Subprocessors
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 self-stretch border-foreground/10 border-t px-4 py-6 md:px-8">
        <div className="font-medium font-sans text-foreground/50 text-xs uppercase tracking-wider">
          Summarize with AI
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {AI_SUMMARY_LINKS.map(({ name, slug, Icon, href, iconClassName }) => (
            <TrackedAiSummaryLink
              href={href}
              key={name}
              name={name}
              slug={slug}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0 grayscale transition-[filter] group-hover:grayscale-0",
                  iconClassName
                )}
              />
              <span className="font-normal font-sans text-sm leading-5">
                {name}
              </span>
            </TrackedAiSummaryLink>
          ))}
        </div>
      </div>
    </div>
  );
}
