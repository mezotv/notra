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
import { Raycast } from "@notra/ui/components/ui/svgs/raycast";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";

interface RaycastSetupGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationSlug: string;
}

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

export function RaycastSetupGuideDialog({
  open,
  onOpenChange,
  organizationSlug,
}: RaycastSetupGuideDialogProps) {
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
            <Raycast className="h-7 w-7" />
            <div>
              <ResponsiveDialogTitle className="text-xl">
                Raycast setup
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                Access your Notra content from Raycast
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

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose render={<Button variant="outline" />}>
            Close
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
