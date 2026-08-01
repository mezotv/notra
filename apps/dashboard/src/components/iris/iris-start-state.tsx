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
        <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-border">
          <HugeiconsIcon className="size-5" icon={RainbowIcon} />
        </span>
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">Iris</h1>
        <p className="mx-auto max-w-xl text-balance text-muted-foreground">
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
            className="space-y-2 rounded-xl border border-border p-4"
            key={step.key}
          >
            <HugeiconsIcon
              className="size-4 text-muted-foreground"
              icon={step.icon}
            />
            <p className="font-medium text-sm">{step.title}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-muted-foreground text-sm">
          Before you start
        </h2>
        <IrisReadinessList items={readiness} />
        {slackReady ? null : (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <HugeiconsIcon
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500"
              icon={Alert02Icon}
            />
            <p className="text-muted-foreground">
              Connect a Slack notification channel so Iris can report to you.
              You can still start now and connect it later.{" "}
              <Link
                className="font-medium text-foreground underline underline-offset-4"
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
