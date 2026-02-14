"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is Notra and who is it for?",
    answer:
      "Notra is a content automation tool for product and engineering teams. Connect your GitHub repos and Notra picks up merged PRs and shipped features to draft changelogs, blog posts, and social updates.",
  },
  {
    question: "What kind of content does Notra generate?",
    answer:
      "Changelog entries from merged PRs, blog post drafts when you ship features, and social updates when you hit milestones. Every draft matches your brand voice so it reads like your team wrote it.",
  },
  {
    question: "Which integrations are available right now?",
    answer:
      "The beta ships with GitHub. Connect your repos and Notra starts pulling in PRs, commits, and releases right away. Linear, Slack, and more are on the roadmap.",
  },
  {
    question: "How does brand voice matching work?",
    answer:
      "During setup you provide a few examples of your existing content. Notra learns your tone, vocabulary, and style so every draft sounds like your team wrote it.",
  },
  {
    question: "Is my data secure with Notra?",
    answer:
      "Integration tokens are encrypted at rest. Your source code is never stored. Notra only reads the metadata it needs to write drafts, like PR titles, descriptions, and commit messages.",
  },
  {
    question: "How do I get started?",
    answer:
      "Sign up for free, connect your GitHub, and Notra starts generating content within minutes. No credit card required.",
  },
];

export default function FAQSection() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenItem((prev) => (prev === index ? null : index));
  };

  return (
    <div className="flex w-full items-start justify-center">
      <div className="flex flex-1 flex-col items-start justify-start gap-6 px-4 py-16 md:px-12 md:py-20 lg:flex-row lg:gap-12">
        <div className="flex w-full flex-col items-start justify-center gap-4 lg:flex-1 lg:py-5">
          <div className="flex w-full flex-col justify-center text-balance font-sans font-semibold text-4xl text-foreground leading-tight tracking-tight md:leading-[44px]">
            Frequently Asked{" "}
            <span className="whitespace-nowrap">
              Questions<span className="text-primary">.</span>
            </span>
          </div>
          <div className="w-full font-normal font-sans text-base text-muted-foreground leading-7">
            Common questions about how Notra
            <br className="hidden md:block" />
            turns your team's work into content.
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-center lg:flex-1">
          <div className="flex w-full flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItem === index;

              return (
                <Collapsible
                  className="w-full overflow-hidden border-foreground/16 border-b"
                  key={index}
                  onOpenChange={() => toggleItem(index)}
                  open={isOpen}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-5 px-5 py-[18px] text-left transition-colors duration-200 hover:bg-foreground/2">
                    <div className="flex-1 font-medium font-sans text-base text-foreground leading-6">
                      {item.question}
                    </div>
                    <div className="flex items-center justify-center">
                      <HugeiconsIcon
                        className={`size-5 text-foreground/60 transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                        icon={ArrowDown01Icon}
                      />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-ending-style:max-h-0 data-starting-style:max-h-0 data-ending-style:opacity-0 data-starting-style:opacity-0 [[data-open]>&]:max-h-96 [[data-open]>&]:opacity-100">
                    <div className="px-5 pb-[18px] font-normal font-sans text-muted-foreground text-sm leading-6">
                      {item.answer}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
