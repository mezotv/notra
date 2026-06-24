"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { PageContainer } from "@/components/layout/container";
import { getModalDescription, getModalTitle } from "@/utils/brand-identity";
import { ModalContent } from "./modal-content";

interface EmptyBrandIdentityStateProps {
  effectiveProgress: {
    status: string;
    currentStep: number;
  };
  handleInitialAnalyze: () => void;
  isAnalyzing: boolean;
  isPending: boolean;
  progressError?: string;
  setUrl: (url: string) => void;
  url: string;
}

export function EmptyBrandIdentityState({
  effectiveProgress,
  handleInitialAnalyze,
  isAnalyzing,
  isPending,
  progressError,
  setUrl,
  url,
}: EmptyBrandIdentityStateProps) {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full px-4 lg:px-6">
        <div className="relative min-h-125">
          <div className="pointer-events-none blur-sm">
            <div className="mb-6 space-y-1">
              <h1 className="font-bold text-3xl tracking-tight">
                Brand Identity
              </h1>
              <p className="text-muted-foreground">
                Configure your brand identity and tone
              </p>
            </div>
            <div className="space-y-8">
              <div className="h-16 w-80 rounded-lg border bg-muted/20" />
              <div className="h-16 w-80 rounded-lg border bg-muted/20" />
              <div className="h-32 w-full max-w-xl rounded-lg border bg-muted/20" />
              <div className="h-24 w-80 rounded-lg border bg-muted/20" />
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="w-full max-w-md border-border/50 shadow-xs">
              <CardHeader className="text-center">
                <CardTitle>
                  {getModalTitle(false, isAnalyzing, effectiveProgress.status)}
                </CardTitle>
                <CardDescription>
                  {getModalDescription(
                    false,
                    isAnalyzing,
                    effectiveProgress.status,
                    progressError
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ModalContent
                  handleAnalyze={handleInitialAnalyze}
                  inlineError={progressError}
                  isAnalyzing={isAnalyzing}
                  isPending={isPending}
                  isPendingSettings={false}
                  progress={effectiveProgress}
                  setUrl={setUrl}
                  url={url}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
