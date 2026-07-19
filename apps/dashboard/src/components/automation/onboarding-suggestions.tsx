"use client";

import { Cancel01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { toast } from "sonner";
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

  const matching = (suggestions ?? []).filter(
    (suggestion) => suggestion.type === type
  );

  if (matching.length === 0) {
    return null;
  }

  return (
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
          return (
            <TitleCard
              accentColor={EVE_ACCENT_COLOR}
              action={
                <div className="flex items-center gap-1.5">
                  <Button onClick={() => onCreate(suggestion.id)} size="sm">
                    Create
                  </Button>
                  <Button
                    aria-label={`Dismiss suggestion "${suggestion.title}"`}
                    disabled={dismissMutation.isPending}
                    onClick={() =>
                      dismissMutation.mutate(
                        { organizationId, suggestionId: suggestion.id },
                        {
                          onError: () =>
                            toast.error("Couldn't dismiss the suggestion"),
                        }
                      )
                    }
                    size="icon-sm"
                    variant="ghost"
                  >
                    <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                  </Button>
                </div>
              }
              className="h-full"
              heading={suggestion.title}
              icon={<HugeiconsIcon icon={SparklesIcon} />}
              key={suggestion.id}
            >
              <div className="space-y-1.5">
                <Badge className="font-normal text-xs" variant="secondary">
                  Suggestion
                </Badge>
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
              </div>
            </TitleCard>
          );
        })}
      </div>
    </div>
  );
}
