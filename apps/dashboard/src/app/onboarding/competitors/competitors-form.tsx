"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AuthFormHeader } from "@notra/ui/components/shared/auth/auth-form-header";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/button";
import { CompetitorBrandLogo } from "@/components/onboarding/competitor-brand-logo";
import { CompetitorChoiceRow } from "@/components/onboarding/competitor-choice-row";
import { CompetitorSearch } from "@/components/onboarding/competitor-search";
import { CompetitorSuggestionsSkeleton } from "@/components/onboarding/competitor-suggestions-skeleton";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { GEO_MAX_COMPETITORS } from "@/constants/geo";
import {
  ONBOARDING_STEP_COMPETITORS,
  ONBOARDING_VISIBLE_SUGGESTIONS,
} from "@/constants/onboarding";
import {
  useGeoCompetitorSuggestions,
  useGeoStartScan,
} from "@/lib/hooks/use-geo";
import { useGeoCompetitorsDb } from "@/lib/hooks/use-geo-db";
import { useHasGeoFeature } from "@/lib/hooks/use-plan";
import { cn } from "@/lib/utils";
import type { GeoCompetitor } from "@/types/geo";
import type {
  CompetitorsFormProps,
  CompetitorsPickerProps,
} from "@/types/onboarding";
import {
  createCompetitor,
  findCompetitor,
} from "@/utils/onboarding-competitors";

function CompetitorsPicker({
  organizationId,
  domain,
  nextHref,
}: CompetitorsPickerProps) {
  const id = useId();
  const router = useRouter();
  const suggestions = useGeoCompetitorSuggestions(organizationId, domain);
  const { competitors, saveCompetitor, removeCompetitor } =
    useGeoCompetitorsDb(organizationId);
  const startScan = useGeoStartScan(organizationId);
  const { isLocked: geoLocked } = useHasGeoFeature();
  const submitLabel = geoLocked ? "Continue" : "Start tracking";
  const [isLeaving, setIsLeaving] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const busy = startScan.isPending || isLeaving;
  const atLimit = competitors.length >= GEO_MAX_COMPETITORS;
  const suggested = suggestions.data?.competitors ?? [];
  const visibleSuggestions = showAllSuggestions
    ? suggested
    : suggested.slice(0, ONBOARDING_VISIBLE_SUGGESTIONS);
  const hiddenSuggestionCount = suggested.length - visibleSuggestions.length;
  const remainingSuggestions = suggested.filter(
    (entry) => !findCompetitor(competitors, entry.domain, entry.name)
  );

  const add = (name: string, competitorDomain: string | null) => {
    if (atLimit || findCompetitor(competitors, competitorDomain, name)) {
      return;
    }
    saveCompetitor(createCompetitor(name, competitorDomain));
  };

  const remove = (competitor: GeoCompetitor) => {
    removeCompetitor(competitor.id);
  };

  const addAllSuggestions = () => {
    for (const entry of remainingSuggestions) {
      add(entry.name, entry.domain);
    }
  };

  const launch = () => {
    if (geoLocked) {
      setIsLeaving(true);
      router.push(nextHref);
      return;
    }
    startScan.mutate(undefined, {
      onSuccess: () => {
        setIsLeaving(true);
        router.push(nextHref);
      },
    });
  };

  return (
    <form
      className="mt-2 space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        launch();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor={`${id}-search`}>Add a brand</Label>
        <CompetitorSearch
          disabled={busy || atLimit}
          onAdd={(result) => add(result.name, result.domain)}
          organizationId={organizationId}
          ownDomain={domain}
          selected={competitors}
        />
      </div>

      {competitors.length > 0 ? (
        <div className="grid gap-2">
          <p className="font-medium text-sm">
            Your competitors{" "}
            <span className="font-normal text-muted-foreground text-xs">
              ({competitors.length} of {GEO_MAX_COMPETITORS})
            </span>
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {competitors.map((entry) => (
              <li
                className="flex items-center gap-1.5 rounded-full border border-input py-1 pr-1 pl-1.5 text-sm"
                key={entry.id}
              >
                <CompetitorBrandLogo
                  className="size-5 rounded-full"
                  domain={entry.domain}
                  logo={null}
                  name={entry.name}
                />
                <span className="max-w-40 truncate">{entry.name}</span>
                <button
                  aria-label={`Remove ${entry.name}`}
                  className="cursor-pointer rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
                  disabled={busy}
                  onClick={() => remove(entry)}
                  type="button"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {domain ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-medium text-sm">
              Suggested for {domain}
            </p>
            {remainingSuggestions.length > 1 ? (
              <Button
                className="h-auto px-0 text-muted-foreground"
                disabled={busy || atLimit}
                onClick={addAllSuggestions}
                size="sm"
                type="button"
                variant="ghost"
              >
                Add all
              </Button>
            ) : null}
          </div>
          {suggestions.data?.field ? (
            <p className="-mt-1 text-muted-foreground text-xs">
              Other companies in {suggestions.data.field}
            </p>
          ) : null}
          {suggestions.isPending ? <CompetitorSuggestionsSkeleton /> : null}
          {suggestions.isError ? (
            <p className="text-muted-foreground text-xs">
              Could not pull suggestions for {domain}. Search above instead.
            </p>
          ) : null}
          {suggestions.isSuccess && suggested.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Nothing obvious for {domain}. Search above instead.
            </p>
          ) : null}
          {suggested.length > 0 ? (
            <ul className="space-y-1.5">
              {visibleSuggestions.map((entry) => {
                const existing = findCompetitor(
                  competitors,
                  entry.domain,
                  entry.name
                );
                return (
                  <CompetitorChoiceRow
                    description={entry.description}
                    disabled={busy || (atLimit && !existing)}
                    domain={entry.domain}
                    key={entry.domain ?? entry.name}
                    name={entry.name}
                    onToggle={() =>
                      existing
                        ? remove(existing)
                        : add(entry.name, entry.domain)
                    }
                    selected={existing !== undefined}
                  />
                );
              })}
            </ul>
          ) : null}
          {hiddenSuggestionCount > 0 ? (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => setShowAllSuggestions(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Show {hiddenSuggestionCount} more
            </Button>
          ) : null}
        </div>
      ) : null}

      <CtaButton className="w-full" disabled={busy} type="submit">
        {busy ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            {geoLocked ? "Saving" : "Running your first scan"}
          </>
        ) : (
          submitLabel
        )}
      </CtaButton>
    </form>
  );
}

export function CompetitorsForm({
  organizationId,
  projectId,
  domain,
  companyName,
  nextHref,
  inOnboardingFlow,
}: CompetitorsFormProps) {
  return (
    <GeoProjectProvider projectId={projectId}>
      <div className="flex w-full flex-col gap-5">
        {inOnboardingFlow ? (
          <div className="flex justify-center">
            <OnboardingProgress current={ONBOARDING_STEP_COMPETITORS} />
          </div>
        ) : null}

        <AuthFormHeader
          description={`When AI recommends someone instead of ${companyName || "you"}, who is it? Pick the brands you want to be measured against.`}
          title="Who do you lose deals to?"
        />

        <CompetitorsPicker
          domain={domain}
          nextHref={nextHref}
          organizationId={organizationId}
        />
      </div>
    </GeoProjectProvider>
  );
}
