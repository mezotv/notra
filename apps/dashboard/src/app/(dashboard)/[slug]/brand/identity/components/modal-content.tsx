import { MinusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@notra/ui/components/ui/stepper";
import { Loader2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { ANALYSIS_STEPS } from "../constants/brand-identity";
import type { ModalContentProps, StepIconState } from "../types/brand-identity";
import { getStepIconState, getStepperValue } from "../utils/brand-identity";

const STEP_ICONS: Record<StepIconState, () => ReactNode> = {
  completed: () => <HugeiconsIcon className="size-4" icon={Tick02Icon} />,
  active: () => <Loader2Icon className="size-4 animate-spin" />,
  pending: () => (
    <HugeiconsIcon
      className="size-4 text-muted-foreground"
      icon={MinusSignIcon}
    />
  ),
};

export function ModalContent({
  isPendingSettings,
  isAnalyzing,
  progress,
  url,
  setUrl,
  handleAnalyze,
  isPending,
  inlineError,
}: ModalContentProps) {
  if (isPendingSettings) {
    return (
      <div className="flex justify-center py-4">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <Stepper
        nonInteractive
        value={getStepperValue(progress.status, progress.currentStep)}
      >
        <StepperList>
          {ANALYSIS_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const iconState = getStepIconState(
              progress.currentStep,
              stepNumber
            );
            return (
              <StepperItem
                completed={progress.currentStep > stepNumber}
                key={step.value}
                value={step.value}
              >
                <StepperTrigger className="gap-2 px-2">
                  <StepperIndicator className="size-8">
                    {STEP_ICONS[iconState]()}
                  </StepperIndicator>
                  <StepperTitle className="text-sm">{step.label}</StepperTitle>
                </StepperTrigger>
                <StepperSeparator className="h-0.5" />
              </StepperItem>
            );
          })}
        </StepperList>
      </Stepper>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div
          className={`flex w-full flex-row items-center overflow-hidden rounded-lg border bg-background transition-all focus-within:ring-2 focus-within:ring-ring/20 ${progress.status === "failed" ? "border-destructive" : "border-input"}`}
        >
          <span className="flex h-10 items-center border-input border-r bg-muted/50 px-3 text-muted-foreground text-sm">
            https://
          </span>
          <input
            aria-label="Website URL"
            className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            disabled={isPending}
            id="brand-url-input"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isPending) {
                handleAnalyze();
              }
            }}
            placeholder="example.com"
            type="text"
            value={url}
          />
        </div>
        <Button
          className="h-10 px-6"
          disabled={isPending}
          onClick={handleAnalyze}
        >
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Analyzing</span>
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>
      {progress.status === "failed" && (
        <p className="text-center text-destructive text-sm">
          Try again with a different URL
        </p>
      )}
      {inlineError && (
        <p className="text-center text-destructive text-sm">{inlineError}</p>
      )}
    </div>
  );
}
