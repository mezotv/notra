import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  current: 1 | 2 | 3;
}

const STEPS = [1, 2, 3] as const;

function getStepClasses(step: number, current: number) {
  if (step === current) {
    return "w-6 bg-primary";
  }
  if (step < current) {
    return "w-1.5 bg-primary/60";
  }
  return "w-1.5 bg-muted-foreground/30";
}

export function OnboardingProgress({ current }: OnboardingProgressProps) {
  return (
    <div
      aria-label={`Step ${current} of ${STEPS.length}`}
      className="flex items-center gap-1.5"
      role="progressbar"
    >
      {STEPS.map((step) => (
        <span
          aria-current={step === current ? "step" : undefined}
          className={cn(
            "h-1.5 rounded-full transition-all",
            getStepClasses(step, current)
          )}
          key={step}
        />
      ))}
    </div>
  );
}
