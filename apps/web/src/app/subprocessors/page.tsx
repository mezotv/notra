import type { Metadata } from "next";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "../../utils/metadata";
import { SITE_URL } from "../../utils/urls";

const title = "Subprocessors";
const description =
  "Current subprocessors Notra uses to provide hosting, analytics, authentication, billing, email, AI, and integrations.";
const url = `${SITE_URL}/subprocessors`;
const currentAsOf = "May 12, 2026";

const subprocessors = [
  {
    name: "Vercel",
    purpose: "Hosting, deployment, and web analytics infrastructure",
    location: "United States",
    website: "https://vercel.com",
  },
  {
    name: "Neon",
    purpose: "Serverless PostgreSQL database hosting",
    location: "United States",
    website: "https://neon.com",
  },
  {
    name: "Upstash",
    purpose: "Redis caching and queue infrastructure",
    location: "United States / EU",
    website: "https://upstash.com",
  },
  {
    name: "Cloudflare",
    purpose: "CDN, security services, and object storage",
    location: "United States",
    website: "https://cloudflare.com",
  },
  {
    name: "Resend",
    purpose: "Transactional email delivery",
    location: "United States / Ireland",
    website: "https://resend.com",
  },
  {
    name: "Vercel AI Gateway",
    purpose: "AI model access for content generation",
    location: "United States",
    website: "https://vercel.com/ai-gateway",
  },
  {
    name: "The Context Company",
    purpose: "AI observability, tracing, and generation monitoring",
    location: "United States",
    website: "https://www.thecontext.company",
  },
  {
    name: "Autumn",
    purpose: "Subscription management and entitlement tracking",
    location: "United States",
    website: "https://useautumn.com",
  },
  {
    name: "Stripe",
    purpose: "Payment processing and billing",
    location: "United States / Global",
    website: "https://stripe.com",
  },
  {
    name: "databuddy",
    purpose: "Cookie-free product analytics and attribution",
    location: "European Union",
    website: "https://databuddy.cc",
  },
  {
    name: "GitHub",
    purpose: "OAuth authentication and repository integrations",
    location: "United States",
    website: "https://github.com",
  },
  {
    name: "Google",
    purpose: "OAuth authentication",
    location: "United States / Global",
    website: "https://google.com",
  },
  {
    name: "Slack",
    purpose: "Workspace integration and notification delivery",
    location: "United States",
    website: "https://slack.com",
  },
  {
    name: "Linear",
    purpose: "Issue and project management integration",
    location: "United States",
    website: "https://linear.app",
  },
  {
    name: "Firecrawl",
    purpose: "Website crawling and content extraction",
    location: "United States",
    website: "https://firecrawl.dev",
  },
  {
    name: "Supermemory",
    purpose: "Long-term context and memory infrastructure",
    location: "United States",
    website: "https://supermemory.ai",
  },
];

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
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

export default function SubprocessorsPage() {
  return (
    <main className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b pt-20 sm:pt-24 md:pt-28 lg:pt-32">
      <section className="flex w-full flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-6 py-12 md:px-24 md:py-16">
          <div className="flex w-full max-w-[680px] flex-col items-center justify-start gap-4">
            <h1 className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
              Notra <span className="text-primary">Subprocessors</span>
            </h1>
            <p className="self-stretch text-balance text-center font-normal font-sans text-base text-muted-foreground leading-7">
              Know where your data may be processed. These providers help us run
              Notra securely across hosting, authentication, billing, analytics,
              email, AI, and connected integrations.
            </p>
            <p className="font-medium font-sans text-muted-foreground text-sm leading-6">
              Current as of {currentAsOf}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full border-border border-b">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-12 sm:px-6 md:px-8 md:py-16 lg:px-0">
          <div className="overflow-x-auto border-border border-y">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <caption className="sr-only">
                Notra subprocessors, their purposes, processing locations, and
                websites
              </caption>
              <thead>
                <tr className="border-border border-b">
                  <th
                    className="px-5 py-4 font-medium font-sans text-muted-foreground text-xs uppercase tracking-wider"
                    scope="col"
                  >
                    Name
                  </th>
                  <th
                    className="px-5 py-4 font-medium font-sans text-muted-foreground text-xs uppercase tracking-wider"
                    scope="col"
                  >
                    Purpose
                  </th>
                  <th
                    className="px-5 py-4 font-medium font-sans text-muted-foreground text-xs uppercase tracking-wider"
                    scope="col"
                  >
                    Location
                  </th>
                  <th
                    className="px-5 py-4 font-medium font-sans text-muted-foreground text-xs uppercase tracking-wider"
                    scope="col"
                  >
                    Website
                  </th>
                </tr>
              </thead>
              <tbody>
                {subprocessors.map((subprocessor) => (
                  <tr
                    className="border-border/70 border-b last:border-b-0"
                    key={subprocessor.name}
                  >
                    <th
                      className="whitespace-nowrap px-5 py-4 font-medium font-sans text-foreground text-sm leading-6"
                      scope="row"
                    >
                      {subprocessor.name}
                    </th>
                    <td className="px-5 py-4 font-normal font-sans text-muted-foreground text-sm leading-6">
                      {subprocessor.purpose}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-normal font-sans text-muted-foreground text-sm leading-6">
                      {subprocessor.location}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-normal font-sans text-sm leading-6">
                      <a
                        className="text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                        href={subprocessor.website}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {subprocessor.website.replace("https://", "")}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-3xl text-pretty font-normal font-sans text-muted-foreground text-sm leading-6">
            This page is updated when we add or remove subprocessors that may
            process customer data. Provider locations can vary by product,
            configuration, and infrastructure changes; review each provider's
            website for current details.
          </p>
        </div>
      </section>
    </main>
  );
}
