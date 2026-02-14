"use client";

import { Button } from "@notra/ui/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ActivityFeed } from "../components/activity-feed";
import BrandVoicePreview from "../components/brand-voice-preview";
import CTASection from "../components/cta-section";
import DocumentationSection from "../components/documentation-section";
import FAQSection from "../components/faq-section";
import IntegrationOrbit from "../components/integration-orbit";
import PricingSection from "../components/pricing-section";
import TestimonialsSection from "../components/testimonials-section";
import { SOCIAL_PROOF_LOGOS } from "../utils/constants";

export default function LandingPage() {
  return (
    <div className="flex w-full flex-col items-center justify-start overflow-hidden border-border/70 border-b">
      <main className="flex w-full flex-col items-center justify-start pt-28 sm:pt-20 md:pt-24 lg:pt-54">
        <div className="flex w-full max-w-234.25 flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <div className="flex flex-col items-center justify-center gap-4 self-stretch rounded-[3px] sm:gap-5 md:gap-6 lg:gap-8">
            <div className="flex w-full max-w-[46.8rem] flex-col justify-center px-2 text-center font-normal font-serif text-[2rem] text-foreground leading-[1.1] sm:px-4 sm:text-[2.625rem] sm:leading-[1.15] md:px-0 md:text-[3.25rem] md:leading-[1.2] lg:text-[5rem] lg:leading-24">
              Turn your daily work
              <br />
              into publish-ready content
            </div>
            <div className="flex w-full max-w-[31.63rem] flex-col justify-center px-2 text-center font-medium font-sans text-foreground/80 text-sm leading-[1.4] sm:px-4 sm:text-lg sm:leading-[1.45] md:px-0 md:text-xl md:leading-normal lg:text-lg lg:leading-7">
              Now in public beta. Notra connects to GitHub, Linear
              <br className="hidden sm:block" />
              and Slack to turn shipped work into ready-to-publish content.
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 mb-16 flex w-full max-w-124.25 flex-col items-center justify-center gap-6 sm:mt-8 sm:mb-0 sm:gap-8 md:mt-10 md:gap-10 lg:mt-12 lg:gap-12">
          <div className="flex items-center justify-start gap-4 backdrop-blur-[0.515625rem]">
            <Link href="https://app.usenotra.com">
              <Button className="h-10 overflow-hidden rounded-lg border-transparent bg-primary px-6 py-2 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] hover:bg-primary-hover sm:h-11 sm:px-8 sm:py-1.5 md:h-12 md:px-10 lg:px-12">
                <span className="flex flex-col justify-center font-medium font-sans text-primary-foreground text-sm leading-5 sm:text-base md:text-[0.9375rem]">
                  Start for free
                </span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 hidden items-stretch justify-center self-stretch border-border border-y sm:mt-10 md:mt-12 md:flex lg:mt-14">
          <div className="relative w-4 overflow-hidden sm:w-6 md:w-8 lg:w-12">
            <div className="-top-30 -left-10 sm:-left-12.5 md:-left-14.5 absolute flex w-30 flex-col items-start justify-start sm:w-35 md:w-40.5">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  className="h-3 origin-top-right rotate-45 self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                  key={i}
                />
              ))}
            </div>
          </div>

          <div className="relative z-5 flex max-w-240 flex-1 flex-col">
            <div className="flex aspect-video w-full max-w-240 flex-col items-start justify-start overflow-hidden rounded-md bg-card shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] sm:rounded-lg lg:rounded-[0.566rem]">
              <Image
                alt="Notra product demo"
                className="h-full w-full object-cover"
                height={1080}
                src="/demo.webp"
                width={1920}
              />
            </div>
          </div>

          <div className="relative w-4 overflow-hidden sm:w-6 md:w-8 lg:w-12">
            <div className="-right-10 sm:-right-12.5 -top-30 md:-right-14.5 absolute flex w-30 flex-col items-start justify-start sm:w-35 md:w-40.5">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  className="h-3 origin-top-right rotate-45 self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                  key={i}
                />
              ))}
            </div>
          </div>
        </div>

        <section
          className="flex w-full flex-col items-center justify-center border-border border-b"
          id="social-proof"
        >
          <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-4 py-8 sm:px-6 sm:py-12 md:px-24 md:py-16">
            <div className="flex w-full max-w-146.5 flex-col items-center justify-start gap-3 sm:gap-4">
              <div className="w-full max-w-[29.53rem] text-balance text-center font-sans font-semibold text-foreground text-xl leading-tight tracking-tight sm:text-2xl md:text-3xl md:leading-15 lg:text-5xl">
                Teams that ship faster, write less
                <span className="text-primary">.</span>
              </div>
              <div className="self-stretch text-center font-normal font-sans text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
                People at these companies use Notra to keep their
                <br className="hidden sm:block" />
                audience in the loop without slowing down development.
              </div>
            </div>
          </div>

          <div className="flex items-start justify-center self-stretch sm:hidden">
            <div className="relative w-4 self-stretch overflow-hidden">
              <div className="-top-30 -left-10 absolute flex w-30 flex-col items-start justify-start">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    key={i}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col border-border border-r border-l">
              {SOCIAL_PROOF_LOGOS.map((logo, index) => (
                <a
                  className={`flex h-24 items-center justify-center gap-2.5 transition-opacity hover:opacity-80 ${
                    index < SOCIAL_PROOF_LOGOS.length - 1
                      ? "border-border border-b"
                      : ""
                  }`}
                  href={logo.href}
                  key={logo.name}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {logo.type === "wordmark" ? (
                    <Image
                      alt={logo.name}
                      className={`w-auto opacity-80 ${logo.name === "Consent" ? "h-6" : "h-8"}`}
                      height={40}
                      src={logo.src}
                      width={180}
                    />
                  ) : (
                    <>
                      <Image
                        alt={logo.name}
                        className="h-8 w-8"
                        height={32}
                        src={logo.src}
                        width={32}
                      />
                      <span className="font-medium font-sans text-foreground text-lg leading-tight">
                        {logo.name}
                      </span>
                    </>
                  )}
                </a>
              ))}
            </div>

            <div className="relative w-4 self-stretch overflow-hidden">
              <div className="-left-10 -top-30 absolute flex w-30 flex-col items-start justify-start">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    key={i}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hidden items-start justify-center self-stretch sm:flex">
            <div className="relative w-6 self-stretch overflow-hidden md:w-8 lg:w-12">
              <div className="-top-30 -left-12.5 md:-left-14.5 absolute flex w-35 flex-col items-start justify-start md:w-40.5">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-4 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    key={i}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-wrap border-border border-r border-l">
              {SOCIAL_PROOF_LOGOS.map((logo, index) => (
                <a
                  className={`flex h-32 items-center justify-center gap-2 transition-opacity hover:opacity-80 md:h-36 lg:h-40 ${
                    index < SOCIAL_PROOF_LOGOS.length - 1
                      ? "border-border border-r-[0.5px]"
                      : ""
                  }`}
                  href={logo.href}
                  key={logo.name}
                  rel="noopener noreferrer"
                  style={{
                    flexBasis: `${100 / Math.min(SOCIAL_PROOF_LOGOS.length, 4)}%`,
                  }}
                  target="_blank"
                >
                  {logo.type === "wordmark" ? (
                    <Image
                      alt={logo.name}
                      className="h-6 w-auto opacity-80 md:h-7"
                      height={28}
                      src={logo.src}
                      width={120}
                    />
                  ) : (
                    <>
                      <Image
                        alt={logo.name}
                        className="h-6 w-6"
                        height={24}
                        src={logo.src}
                        width={24}
                      />
                      <span className="font-medium font-sans text-base text-foreground leading-tight md:text-lg">
                        {logo.name}
                      </span>
                    </>
                  )}
                </a>
              ))}
            </div>

            <div className="relative w-6 self-stretch overflow-hidden md:w-8 lg:w-12">
              <div className="-left-12.5 -top-30 md:-left-14.5 absolute flex w-35 flex-col items-start justify-start md:w-40.5">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-4 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    key={i}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="flex w-full flex-col items-center justify-center border-border border-b"
          id="features"
        >
          <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-6 py-12 md:px-24 md:py-16">
            <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
              <div className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
                Your team ships<span className="text-primary">.</span> Notra
                writes it up
                <span className="text-primary">.</span>
              </div>
              <div className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
                Notra watches your team's activity in the background
                <br />
                and drafts content that matches your brand voice.
              </div>
            </div>
          </div>

          <div className="flex items-start justify-center self-stretch">
            <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
              <div className="-top-30 -left-10 sm:-left-12.5 md:-left-14.5 absolute flex w-30 flex-col items-start justify-start sm:w-35 md:w-40.5">
                {Array.from({ length: 200 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                    key={i}
                  />
                ))}
              </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-0 border-border border-r border-l md:grid-cols-2">
              <div className="flex flex-col items-start justify-start gap-4 border-border border-r-0 border-b p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    Activity feed
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    Every PR, issue, and conversation lands in one organized
                    timeline your whole team can read.
                  </p>
                </div>
                <div className="relative flex w-full items-end justify-center overflow-hidden rounded-lg pt-4">
                  <ActivityFeed />
                  <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-linear-to-t from-background to-transparent" />
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-4 border-border border-b p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    Brand voice matching
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    Notra learns your tone and style so every draft sounds like
                    your team wrote it.
                  </p>
                </div>
                <div className="w-full pt-2">
                  <BrandVoicePreview />
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-4 border-border border-r-0 bg-transparent p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    One-click integrations
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    GitHub, Linear, Slack, and more plug in with a single click.
                    You'll be connected in under a minute.
                  </p>
                </div>
                <div className="relative flex h-50 w-full items-center justify-center overflow-hidden rounded-lg sm:h-62.5 md:h-75">
                  <IntegrationOrbit className="h-full w-full" />
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                <div className="flex flex-col gap-2">
                  <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                    More to come
                  </h3>
                  <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                    We're building new features every week. Stay tuned for
                    what's next.
                  </p>
                </div>
                <div className="flex h-50 w-full items-center justify-center sm:h-62.5 md:h-75">
                  <span className="font-sans text-muted-foreground/50 text-sm">
                    Coming soon
                  </span>
                </div>
              </div>
            </div>

            <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
              <div className="-top-30 -left-10 sm:-left-12.5 md:-left-14.5 absolute flex w-30 flex-col items-start justify-start sm:w-35 md:w-40.5">
                {Array.from({ length: 200 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                    key={i}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full" id="documentation">
          <DocumentationSection />
        </section>

        <section className="w-full" id="testimonials">
          <TestimonialsSection />
        </section>

        <section className="w-full" id="pricing">
          <PricingSection />
        </section>

        <section className="w-full" id="faq">
          <FAQSection />
        </section>

        <section className="w-full" id="cta">
          <CTASection />
        </section>
      </main>
    </div>
  );
}
