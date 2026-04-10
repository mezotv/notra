import { buttonVariants } from "@notra/ui/components/ui/button";
import { Discord } from "@notra/ui/components/ui/svgs/discord";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linkedin } from "@notra/ui/components/ui/svgs/linkedin";
import { XTwitter } from "@notra/ui/components/ui/svgs/twitter";
import Link from "next/link";
import {
  FOOTER_EXTENSION_LINKS,
  FOOTER_PRODUCT_LINKS,
} from "@/utils/navigation";
import { SOCIAL_LINKS } from "../utils/constants";
import { NotraMark } from "./notra-mark";

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
            <div className="text-center font-sans font-semibold text-foreground text-xl leading-4">
              Notra
            </div>
          </div>
          <div className="font-medium font-sans text-foreground/90 text-sm leading-4.5">
            Turn your daily work into publish-ready content!
          </div>
          <div className="font-normal font-sans text-foreground/60 text-xs leading-5">
            {`© ${year} Notra. All rights reserved.`}
          </div>

          <div className="flex items-start justify-start gap-2 text-foreground">
            <Link
              aria-label="Visit Notra on X"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.x}
              target="_blank"
            >
              <XTwitter className="size-5" />
            </Link>
            <Link
              aria-label="Visit Notra on LinkedIn"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
            >
              <Linkedin className="size-5" />
            </Link>
            <Link
              aria-label="Visit Notra on GitHub"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.github}
              target="_blank"
            >
              <Github className="size-5" />
            </Link>
            <Link
              aria-label="Visit Notra on Discord"
              className={buttonVariants({ size: "icon", variant: "ghost" })}
              href={SOCIAL_LINKS.discord}
              target="_blank"
            >
              <Discord className="size-5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col flex-wrap items-start justify-start gap-6 self-stretch p-4 sm:flex-row sm:justify-between md:gap-8 md:p-8">
          <div className="flex min-w-30 flex-1 flex-col items-start justify-start gap-3">
            <div className="self-stretch font-medium font-sans text-foreground/50 text-sm leading-5">
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
            <div className="self-stretch font-medium font-sans text-foreground/50 text-sm leading-5">
              Extensions
            </div>
            <div className="flex flex-col items-start justify-end gap-2">
              {FOOTER_EXTENSION_LINKS.map((link) => (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
