import {
  MagicWand01Icon,
  Plug01Icon,
  QuoteUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HowItWorksStep } from "~types/how-it-works";
import { HatchPattern } from "./hatch-pattern";

const STEPS: HowItWorksStep[] = [
  {
    index: "01",
    icon: QuoteUpIcon,
    title: "Add your voice & website",
    description:
      "Drop in tweets, your website, blog posts, or anything you've already written. Notra reads it so the drafts sound like you.",
  },
  {
    index: "02",
    icon: Plug01Icon,
    title: "Plug in your sources",
    description:
      "Hook up GitHub or Linear so Notra sees what your team actually shipped. More sources on the way.",
  },
  {
    index: "03",
    icon: MagicWand01Icon,
    title: "Generate your next post",
    description:
      "Drafts land in Notra. Pull them into your site with the Framer plugin, or fetch them through our API or MCP.",
  },
];

export default function HowItWorksSection() {
  return (
    <div className="flex w-full flex-col items-center justify-center border-border border-b">
      <div className="flex items-center justify-center gap-6 self-stretch border-border border-b px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
          <h2 className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            How <span className="text-primary">Notra works</span>
          </h2>
          <div className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Three steps from your first connection
            <br />
            to your first published post.
          </div>
        </div>
      </div>

      <div className="flex items-stretch justify-center self-stretch">
        <HatchPattern className="w-4 self-stretch sm:w-6 md:w-8 lg:w-12" />

        <div className="grid flex-1 grid-cols-1 gap-0 border-border border-r border-l md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              className={`flex flex-col items-start justify-start gap-6 p-6 sm:p-8 md:p-10 lg:p-12 ${
                index < STEPS.length - 1
                  ? "border-border border-b md:border-r md:border-b-0"
                  : ""
              }`}
              key={step.index}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-md border border-border/70 bg-background">
                  <HugeiconsIcon
                    className="size-5 text-foreground"
                    icon={step.icon}
                  />
                </div>
                <div className="font-medium font-sans text-muted-foreground/70 text-sm tabular-nums">
                  {step.index}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-sans font-semibold text-foreground text-lg leading-tight sm:text-xl">
                  {step.title}
                </h3>
                <p className="font-normal font-sans text-muted-foreground text-sm leading-relaxed md:text-base">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <HatchPattern className="w-4 self-stretch sm:w-6 md:w-8 lg:w-12" />
      </div>
    </div>
  );
}
