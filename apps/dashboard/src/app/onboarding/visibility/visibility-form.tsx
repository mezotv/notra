"use client";

import { AuthFormHeader } from "@notra/ui/components/shared/auth/auth-form-header";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/button";
import { BrandReviewSkeleton } from "@/components/onboarding/brand-review-skeleton";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import {
  ONBOARDING_FIELD_CLASS,
  ONBOARDING_STEP_VISIBILITY,
} from "@/constants/onboarding";
import {
  useGeoDiscoverWebsite,
  useGeoOnboardingBrand,
} from "@/lib/hooks/use-geo";
import type {
  VisibilityFormProps,
  VisibilityReviewProps,
} from "@/types/onboarding";
import { normalizeWebsiteUrl } from "@/utils/geo-website";
import { stripWebsitePrefix } from "@/utils/onboarding";
import {
  toVisibilityBrandInput,
  uniqueVisibilityPrompts,
} from "@/utils/onboarding-brand";

function VisibilityReview({
  organizationId,
  websiteUrl,
  discovery,
  fallbackCompanyName,
  nextHref,
  skipHref,
}: VisibilityReviewProps) {
  const id = useId();
  const router = useRouter();
  const [companyName, setCompanyName] = useState(
    () => discovery?.companyName ?? fallbackCompanyName
  );
  const save = useGeoOnboardingBrand(organizationId);
  const [isLeaving, setIsLeaving] = useState(false);
  const busy = save.isPending || isLeaving;
  const canSubmit = companyName.trim().length > 0 && !busy;
  const promptCount = uniqueVisibilityPrompts(discovery?.prompts ?? []).length;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    save.mutate(
      toVisibilityBrandInput({
        companyName,
        aliases: discovery?.aliases ?? [],
        prompts: discovery?.prompts ?? [],
      }),
      {
        onSuccess: () => {
          setIsLeaving(true);
          router.push(nextHref);
        },
      }
    );
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        handleSubmit();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor={`${id}-company`}>Brand name</Label>
        <Input
          aria-invalid={companyName.trim().length === 0}
          className={ONBOARDING_FIELD_CLASS}
          disabled={busy}
          id={`${id}-company`}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Acme"
          value={companyName}
        />
        <p className="text-muted-foreground text-xs">
          What we look for in answers. Usually the name on{" "}
          {stripWebsitePrefix(websiteUrl)}.
        </p>
        {promptCount > 0 ? (
          <p className="text-muted-foreground text-xs">
            We pulled {promptCount} questions from your site to start with. Edit
            them later under Prompts.
          </p>
        ) : null}
      </div>

      <CtaButton className="w-full" disabled={!canSubmit} type="submit">
        {busy ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Saving
          </>
        ) : (
          "Continue"
        )}
      </CtaButton>

      <div className="text-center">
        <Button
          className="text-muted-foreground"
          disabled={busy}
          nativeButton={false}
          render={<Link href={skipHref} />}
          size="sm"
          variant="link"
        >
          Skip for now
        </Button>
      </div>
    </form>
  );
}

export function VisibilityForm({
  organizationId,
  projectId,
  websiteUrl,
  companyName,
  nextHref,
  skipHref,
  inOnboardingFlow,
}: VisibilityFormProps) {
  const id = useId();
  const [websiteInput, setWebsiteInput] = useState(() =>
    stripWebsitePrefix(websiteUrl)
  );
  const [analyzedUrl, setAnalyzedUrl] = useState(
    () => normalizeWebsiteUrl(websiteUrl) ?? null
  );
  const discover = useGeoDiscoverWebsite(organizationId, analyzedUrl);
  const isAnalyzing = analyzedUrl !== null && discover.isPending;
  const analyzedHost = analyzedUrl ? stripWebsitePrefix(analyzedUrl) : "";

  const commitWebsite = () => {
    const normalized = normalizeWebsiteUrl(websiteInput);
    if (normalized && normalized !== analyzedUrl) {
      setAnalyzedUrl(normalized);
    }
  };

  return (
    <GeoProjectProvider projectId={projectId}>
      <div className="flex w-full flex-col gap-5">
        {inOnboardingFlow ? (
          <div className="flex justify-center">
            <OnboardingProgress current={ONBOARDING_STEP_VISIBILITY} />
          </div>
        ) : null}

        <AuthFormHeader
          description="We ask ChatGPT, Claude, Gemini and Perplexity what your buyers ask them, then check if you come up."
          title="See what AI says about you"
        />

        <div className="mt-2 space-y-5">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-website`}>Website</Label>
            <div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex h-11 w-full flex-row items-center overflow-hidden rounded-xl border transition-colors focus-within:ring-[3px]">
              <label
                className="border-input bg-muted/30 text-muted-foreground flex h-full items-center border-r px-3.5 text-sm"
                htmlFor={`${id}-website`}
              >
                https://
              </label>
              <input
                className="h-full flex-1 bg-transparent px-3.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isAnalyzing}
                id={`${id}-website`}
                onBlur={commitWebsite}
                onChange={(event) => setWebsiteInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitWebsite();
                  }
                }}
                placeholder="acme.com"
                type="text"
                value={websiteInput}
              />
              {isAnalyzing ? (
                <span className="text-muted-foreground flex h-full items-center px-3.5">
                  <Loader2Icon className="size-4 animate-spin" />
                </span>
              ) : null}
            </div>
            {isAnalyzing ? (
              <p className="text-muted-foreground text-xs">
                Reading {analyzedHost}. Takes about 20 seconds.
              </p>
            ) : null}
            {discover.isError ? (
              <p className="text-destructive text-sm">
                Could not read {analyzedHost}. Check the address, or just type
                your brand name below.
              </p>
            ) : null}
          </div>

          {isAnalyzing ? (
            <BrandReviewSkeleton />
          ) : (
            <VisibilityReview
              discovery={discover.data?.discovery ?? null}
              fallbackCompanyName={companyName ?? ""}
              key={`${analyzedUrl ?? ""}:${discover.status}`}
              nextHref={nextHref}
              organizationId={organizationId}
              skipHref={skipHref}
              websiteUrl={analyzedUrl ?? websiteUrl}
            />
          )}
        </div>
      </div>
    </GeoProjectProvider>
  );
}
