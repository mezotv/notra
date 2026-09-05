import { Alert02Icon, RainbowIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/button";
import { IrisReadinessList } from "@/components/iris/iris-readiness-list";
import { IRIS_EXPLAINER_STEPS } from "@/constants/iris-ui";
import type { IrisStartStateProps } from "@/types/iris";

export function IrisStartState({
  organizationSlug,
  readiness,
  slackReady,
  isStarting,
  onStart,
}: IrisStartStateProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 py-6">
      <div className="space-y-5 text-center">
        <span className="border-border inline-flex size-11 items-center justify-center rounded-2xl border">
          <HugeiconsIcon className="size-5" icon={RainbowIcon} />
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Iris</h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-balance">
          Iris watches what you ship and does your marketing: it drafts
          changelogs, blog posts with images, and social posts, then asks you on
          Slack before anything goes live.
        </p>
        <div className="flex justify-center pt-1">
          <Button
            className="px-6"
            disabled={isStarting}
            onClick={onStart}
            size="lg"
          >
            {isStarting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Starting Iris
              </>
            ) : (
              "Start Iris"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {IRIS_EXPLAINER_STEPS.map((step) => (
          <div
            className="border-border space-y-2 rounded-xl border p-4"
            key={step.key}
          >
            <HugeiconsIcon
              className="text-muted-foreground size-4"
              icon={step.icon}
            />
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium">
          Before you start
        </h2>
        <IrisReadinessList items={readiness} />
        {slackReady ? null : (
          <div className="border-warning/30 bg-warning/5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm">
            <HugeiconsIcon
              className="text-warning mt-0.5 size-4 shrink-0"
              icon={Alert02Icon}
            />
            <p className="text-muted-foreground">
              Connect a Slack notification channel so Iris can report to you.
              You can still start now and connect it later.{" "}
              <Link
                className="text-foreground font-medium underline underline-offset-4"
                href={`/${organizationSlug}/integrations/slack`}
              >
                Connect Slack
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
