"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Framer } from "@notra/ui/components/ui/svgs/framer";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FramerSetupGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationSlug: string;
}

const STEPS = [
  {
    title: "Install the Notra plugin",
    description:
      "In Framer, open Assets then Plugins. Search 'Notra' and hit install.",
    link: {
      label: "View on Framer Marketplace",
      href: "https://www.framer.com/marketplace/plugins/notra/",
    },
  },
  {
    title: "Create a read-only API key",
    description:
      "Head to API Keys, create a new key with read-only permissions, and copy it.",
    internalLink: true,
  },
  {
    title: "Paste the key in the plugin",
    description:
      "Open the Notra plugin in Framer and paste your API key when prompted.",
  },
  {
    title: "Pick what to import",
    description:
      "Browse your posts in the plugin and choose which ones to pull into your Framer site.",
  },
] as const;

export function FramerSetupGuideDialog({
  open,
  onOpenChange,
  organizationSlug,
}: FramerSetupGuideDialogProps) {
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
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-[540px]">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-3">
            <Framer className="h-7 w-7" />
            <div>
              <ResponsiveDialogTitle className="text-xl">
                Framer setup
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Get your Notra content into Framer
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <div className="space-y-1 py-4">
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
                    className={`font-medium text-sm ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}
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

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose render={<Button variant="outline" />}>
            Close
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
