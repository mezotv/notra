"use client";

import { Raycast } from "@notra/ui/components/ui/svgs/raycast";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";

const STEPS = [
  {
    title: "Install the Notra extension",
    description:
      "Open the Raycast Store, search for 'Notra', and install the extension.",
    link: {
      label: "View on Raycast Store",
      href: "https://www.raycast.com/dominikdev/notra",
    },
  },
  {
    title: "Create a read and write API key",
    description:
      "Head to API Keys, create a new key with read and write permissions, and copy it.",
    internalLink: true,
  },
  {
    title: "Configure the extension",
    description:
      "Open Raycast, run any Notra command, and paste your API key when prompted.",
  },
  {
    title: "Start using Notra in Raycast",
    description:
      "Search and browse your posts, copy content, and manage workflows — all from Raycast.",
  },
] as const;

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  function toggleStep(index: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Raycast className="h-8 w-8" />
            <div className="space-y-1">
              <h1 className="font-bold text-3xl tracking-tight">
                Raycast setup
              </h1>
              <p className="text-muted-foreground">
                Access your Notra content from Raycast
              </p>
            </div>
          </div>
          <Link href={`/${organizationSlug}/integrations`}>
            <Button size="sm" variant="outline">
              Back to Integrations
            </Button>
          </Link>
        </div>

        <div className="max-w-xl space-y-1">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index);

            return (
              <button
                className="group flex w-full gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/60"
                key={step.title}
                onClick={() => toggleStep(index)}
                type="button"
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-medium text-xs transition-colors ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium text-sm ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                  {"link" in step && step.link ? (
                    <a
                      className="mt-1.5 inline-flex items-center gap-1 text-primary text-xs hover:underline"
                      href={step.link.href}
                      onClick={(e) => e.stopPropagation()}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {step.link.label}
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  ) : null}
                  {"internalLink" in step && step.internalLink ? (
                    <Link
                      className="mt-1.5 inline-flex items-center gap-1 text-primary text-xs hover:underline"
                      href={`/${organizationSlug}/api-keys`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Go to API Keys
                      <ExternalLinkIcon className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
