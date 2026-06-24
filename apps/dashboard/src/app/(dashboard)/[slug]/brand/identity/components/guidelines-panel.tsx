"use client";

import { RefreshIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@notra/ui/components/ui/alert";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { GUIDELINES_SKELETON_KEYS } from "@/constants/brand-guideline-ui";
import {
  useBrandGuidelines,
  useRefreshBrandGuidelinesAction,
} from "@/lib/hooks/use-brand-guidelines";
import type { GuidelinesPanelProps } from "@/types/brand-identity";
import { formatRelativeTime } from "@/utils/format";
import { GuidelinesAssetsSection } from "./guidelines-assets-section";
import { GuidelinesColorsSection } from "./guidelines-colors-section";
import { GuidelinesScreenshotsSection } from "./guidelines-screenshots-section";
import { GuidelinesTokensSection } from "./guidelines-tokens-section";
import { GuidelinesTypographySection } from "./guidelines-typography-section";

export function GuidelinesPanel({
  organizationId,
  voiceId,
}: GuidelinesPanelProps) {
  const { data, isError, isPending, refetch } = useBrandGuidelines(
    organizationId,
    voiceId
  );
  const refresh = useRefreshBrandGuidelinesAction(organizationId, voiceId);

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDELINES_SKELETON_KEYS.map((key) => (
            <Skeleton className="h-44 w-full" key={key} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        actionIcon={<HugeiconsIcon className="size-4" icon={RefreshIcon} />}
        actionLabel="Retry"
        description="We couldn't load this brand identity's guidelines."
        onActionClick={() => refetch()}
        title="Guidelines unavailable"
      />
    );
  }

  const { guideline, assets, colors, fonts, tokens, screenshots } = data;

  if (!guideline) {
    return (
      <EmptyState
        action={
          <Button
            disabled={refresh.isPending}
            onClick={refresh.refreshGuidelines}
            size="sm"
          >
            {refresh.isPending ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <span className="mr-2">
                <HugeiconsIcon className="size-4" icon={SparklesIcon} />
              </span>
            )}
            {refresh.isPending ? "Generating…" : "Generate Guidelines"}
          </Button>
        }
        description="Brand guidelines have not been generated yet. Generate them to pull logos, colors, typography, and landing page screenshots from your website."
        title="No guidelines yet"
      />
    );
  }

  const isFailed = guideline.status === "failed";
  const hasData =
    assets.length > 0 ||
    colors.length > 0 ||
    fonts.length > 0 ||
    tokens.length > 0 ||
    screenshots.length > 0;

  return (
    <div className="space-y-6">
      {guideline.lastGeneratedAt ? (
        <p className="text-right text-muted-foreground text-xs">
          Updated {formatRelativeTime(new Date(guideline.lastGeneratedAt))}
        </p>
      ) : null}

      {isFailed ? (
        <Alert variant="destructive">
          <AlertTitle>Guideline generation failed</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {guideline.lastGenerationError ??
                "Something went wrong while generating guidelines."}
            </p>
            <Button
              disabled={refresh.isPending}
              onClick={refresh.refreshGuidelines}
              size="sm"
              variant="outline"
            >
              {refresh.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <HugeiconsIcon className="size-4" icon={RefreshIcon} />
              )}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {hasData ? (
        <>
          <GuidelinesAssetsSection
            assets={assets}
            organizationId={organizationId}
            voiceId={voiceId}
          />
          <GuidelinesColorsSection
            colors={colors}
            organizationId={organizationId}
            voiceId={voiceId}
          />
          <GuidelinesTypographySection
            fonts={fonts}
            organizationId={organizationId}
            voiceId={voiceId}
          />
          <GuidelinesTokensSection
            organizationId={organizationId}
            tokens={tokens}
            voiceId={voiceId}
          />
          <GuidelinesScreenshotsSection
            organizationId={organizationId}
            screenshots={screenshots}
            voiceId={voiceId}
          />
        </>
      ) : null}

      {hasData || isFailed ? null : (
        <EmptyState
          action={
            <Button
              disabled={refresh.isPending}
              onClick={refresh.refreshGuidelines}
              size="sm"
            >
              {refresh.isPending ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <span className="mr-2">
                  <HugeiconsIcon className="size-4" icon={RefreshIcon} />
                </span>
              )}
              {refresh.isPending ? "Refreshing…" : "Refresh Guidelines"}
            </Button>
          }
          description="No brand assets were detected for this identity yet. Refresh to pull the latest logos, colors, and screenshots."
          title="Guidelines are empty"
        />
      )}
    </div>
  );
}
