"use client";

import {
  ArrowRight01Icon,
  Cancel01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@notra/ui/components/ui/sheet";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useState } from "react";
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

interface SuggestionDetails {
  description: string | null;
  evidence: string | null;
  id: string;
  title: string;
  type: OnboardingSuggestionsProps["type"];
}

interface SuggestionDetailsSheetProps {
  dismissing: boolean;
  onCreate: () => void;
  onDismiss: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  suggestion: SuggestionDetails;
}

function SuggestionDetailsSheet({
  dismissing,
  onCreate,
  onDismiss,
  onOpenChange,
  open,
  suggestion,
}: SuggestionDetailsSheetProps) {
  const automationLabel =
    suggestion.type === "schedule_automation" ? "schedule" : "event automation";

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="border-b pr-14">
          <Badge className="mb-2 w-fit font-normal text-xs" variant="secondary">
            Suggestion
          </Badge>
          <SheetTitle>{suggestion.title}</SheetTitle>
          <SheetDescription>
            Review the recommendation before creating this {automationLabel}.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          <section className="space-y-2">
            <h3 className="font-medium text-sm">Recommendation</h3>
            <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
              {suggestion.description ?? "No additional details were provided."}
            </p>
          </section>

          {suggestion.evidence ? (
            <section className="space-y-2">
              <h3 className="font-medium text-sm">Why this fits</h3>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
                  {suggestion.evidence}
                </p>
              </div>
            </section>
          ) : null}
        </div>

        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button disabled={dismissing} onClick={onDismiss} variant="outline">
            Dismiss
          </Button>
          <Button onClick={onCreate}>Create {automationLabel}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

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
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<SuggestionDetails | null>(null);

  const matching = (suggestions ?? []).filter(
    (suggestion) => suggestion.type === type
  );

  if (matching.length === 0) {
    return null;
  }

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
                footer={
                  <Button
                    className="ml-auto gap-1"
                    onClick={() => {
                      setSelectedSuggestion({
                        description: suggestion.description,
                        evidence,
                        id: suggestion.id,
                        title: suggestion.title,
                        type: suggestion.type,
                      });
                      setDetailsOpen(true);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    View details
                    <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} />
                  </Button>
                }
                footerClassName="py-2"
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

      {selectedSuggestion ? (
        <SuggestionDetailsSheet
          dismissing={dismissMutation.isPending}
          onCreate={() => {
            setDetailsOpen(false);
            onCreate(selectedSuggestion.id);
          }}
          onDismiss={() =>
            dismissMutation.mutate(
              {
                organizationId,
                suggestionId: selectedSuggestion.id,
              },
              {
                onError: () => toast.error("Couldn't dismiss the suggestion"),
                onSuccess: () => setDetailsOpen(false),
              }
            )
          }
          onOpenChange={setDetailsOpen}
          open={detailsOpen}
          suggestion={selectedSuggestion}
        />
      ) : null}
    </>
  );
}
