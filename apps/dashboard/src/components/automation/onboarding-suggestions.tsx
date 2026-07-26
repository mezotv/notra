"use client";

import {
  ArrowRight01Icon,
  Cancel01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useState } from "react";
import { toast } from "sonner";
import { SuggestionDetailsSheet } from "@/components/automation/suggestion-details-sheet";
import { BrailleLoader } from "@/components/braille-loader";
import { Button } from "@/components/button";
import { EVE_ACCENT_COLOR } from "@/constants/onboarding-agent";
import {
  useDismissOnboardingSuggestion,
  useOnboardingAgentRun,
  useOnboardingSuggestions,
} from "@/lib/hooks/use-onboarding";
import type { OnboardingSuggestionsProps } from "@/types/components/onboarding-suggestions";
import { getOnboardingSuggestionEvidence } from "@/utils/onboarding-suggestions";

export function OnboardingSuggestions({
  organizationId,
  type,
  onCreate,
}: OnboardingSuggestionsProps) {
  const { data: agentRun } = useOnboardingAgentRun(organizationId);
  const agentRunning = agentRun?.running ?? false;
  const { data: suggestions } = useOnboardingSuggestions(organizationId, {
    agentRunning,
  });
  const dismissMutation = useDismissOnboardingSuggestion();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dismissPendingId = dismissMutation.isPending
    ? (dismissMutation.variables?.suggestionId ?? null)
    : null;

  const dismissSuggestion = (suggestionId: string, onSuccess?: () => void) => {
    dismissMutation.mutate(
      { organizationId, suggestionId },
      {
        onError: () => toast.error("Couldn't dismiss the suggestion"),
        onSuccess,
      }
    );
  };

  const matching = (suggestions ?? []).filter(
    (suggestion) => suggestion.type === type
  );

  if (matching.length === 0) {
    return null;
  }

  const selectedSuggestion = matching.find(
    (suggestion) => suggestion.id === selectedId
  );

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            className="size-4 text-muted-foreground"
            icon={SparklesIcon}
          />
          <h2 className="font-medium text-sm">Suggestions</h2>
          {agentRunning && <BrailleLoader className="text-xs" />}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matching.map((suggestion) => {
            const evidence = getOnboardingSuggestionEvidence(suggestion.data);
            const openDetails = () => {
              setSelectedId(suggestion.id);
              setDetailsOpen(true);
            };
            return (
              <TitleCard
                accentColor={EVE_ACCENT_COLOR}
                action={
                  <div className="relative z-10 flex items-center gap-1.5">
                    <Button onClick={() => onCreate(suggestion.id)} size="sm">
                      Create
                    </Button>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            aria-label={`Dismiss suggestion "${suggestion.title}"`}
                            disabled={dismissPendingId === suggestion.id}
                            onClick={() => dismissSuggestion(suggestion.id)}
                            size="icon-sm"
                            variant="ghost"
                          />
                        }
                      >
                        <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                      </TooltipTrigger>
                      <TooltipContent>Dismiss suggestion</TooltipContent>
                    </Tooltip>
                  </div>
                }
                className="h-full"
                heading={suggestion.title}
                icon={<HugeiconsIcon icon={SparklesIcon} />}
                key={suggestion.id}
              >
                <div className="space-y-1.5">
                  {suggestion.description ? (
                    <p className="line-clamp-3 text-muted-foreground text-sm">
                      {suggestion.description}
                    </p>
                  ) : null}
                  {evidence ? (
                    <p className="line-clamp-2 text-muted-foreground/70 text-xs">
                      {evidence}
                    </p>
                  ) : null}
                  <button
                    aria-label={`View details for "${suggestion.title}"`}
                    className="absolute inset-0 cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={openDetails}
                    type="button"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-background via-background/90 to-transparent pt-6 pb-2 font-medium text-foreground text-sm opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
                    Click to expand
                    <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} />
                  </span>
                </div>
              </TitleCard>
            );
          })}
        </div>
      </div>

      {selectedSuggestion ? (
        <SuggestionDetailsSheet
          dismissing={dismissPendingId === selectedSuggestion.id}
          onCreate={() => {
            setDetailsOpen(false);
            onCreate(selectedSuggestion.id);
          }}
          onDismiss={() =>
            dismissSuggestion(selectedSuggestion.id, () =>
              setDetailsOpen(false)
            )
          }
          onOpenChange={setDetailsOpen}
          open={detailsOpen}
          suggestion={{
            description: selectedSuggestion.description,
            evidence: getOnboardingSuggestionEvidence(selectedSuggestion.data),
            id: selectedSuggestion.id,
            title: selectedSuggestion.title,
            type: selectedSuggestion.type,
          }}
        />
      ) : null}
    </>
  );
}
