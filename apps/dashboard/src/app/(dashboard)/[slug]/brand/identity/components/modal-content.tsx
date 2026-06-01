import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/button";
import type { ModalContentProps } from "../types/brand-identity";
import { AnalysisStepper } from "./analysis-stepper";

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
    return <AnalysisStepper progress={progress} />;
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
      {(inlineError || progress.status === "failed") && (
        <p className="text-center text-destructive text-sm">
          {inlineError ?? "Try again with a different URL"}
        </p>
      )}
    </div>
  );
}
