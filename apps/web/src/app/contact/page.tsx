import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail } from "@/components/contact/contact-email";
import { ContactForm } from "@/components/contact/contact-form";
import {
  CONTACT_RESOURCE_LINKS,
  CONTACT_RESPONSE_TIME,
} from "@/constants/contact";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Contact Notra";
const description =
  "Talk to the Notra team about sales, support, security disclosures, partnerships, and developer integration help. A real human writes back.";
const url = `${SITE_URL}/contact`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Notra",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_SOCIAL_IMAGE.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

export default function ContactPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <section className="flex w-full items-center justify-center px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-4">
          <h1 className="text-balance text-center font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:text-6xl">
            We read every message.{" "}
            <span className="text-primary">Let's talk.</span>
          </h1>
          <p className="text-pretty text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Tell us what you're working on and a real human will write back.
            Typical response time: {CONTACT_RESPONSE_TIME}
          </p>
        </div>
      </section>

      <section className="w-full border-border/70 border-t px-6 py-12 md:px-24 md:py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <ContactEmail />
          <ContactForm />
        </div>
      </section>

      <section className="w-full border-border/70 border-t px-6 py-12 md:px-24 md:py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
              Looking for something specific?
            </h2>
            <p className="max-w-2xl font-normal font-sans text-muted-foreground text-sm leading-6">
              You might find a faster answer in one of these.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {CONTACT_RESOURCE_LINKS.map((resource) => (
              <Link
                className="group flex flex-col gap-1.5 bg-card p-6 transition-colors hover:bg-muted/40"
                href={resource.href}
                key={resource.href}
                rel={resource.external ? "noopener noreferrer" : undefined}
                target={resource.external ? "_blank" : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <HugeiconsIcon
                    className="size-4 text-primary"
                    icon={resource.icon}
                    strokeWidth={2}
                  />
                  <h3 className="flex items-center gap-1 font-medium font-sans text-base text-foreground">
                    {resource.label}
                    {resource.external ? (
                      <HugeiconsIcon
                        className="group-hover:-translate-y-0.5 size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        icon={ArrowUpRight01Icon}
                        strokeWidth={2}
                      />
                    ) : null}
                  </h3>
                </div>
                <p className="font-normal font-sans text-muted-foreground text-sm leading-6">
                  {resource.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-border/70 border-t px-6 py-12 md:px-24 md:py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <h2 className="font-sans font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
            For developers and AI agents
          </h2>
          <p className="font-normal font-sans text-muted-foreground text-sm leading-7">
            Start with the{" "}
            <Link
              className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
              href="/auth.md"
            >
              agent authentication guide
            </Link>
            , the{" "}
            <Link
              className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
              href="/.well-known/api-catalog"
            >
              API catalog
            </Link>
            , and the scoped{" "}
            <Link
              className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
              href="/developers/llms.txt"
            >
              developer llms.txt
            </Link>
            . These describe API authentication, OpenAPI discovery, MCP usage,
            sandbox reachability, and retry guidance.
          </p>
        </div>
      </section>
    </div>
  );
}
