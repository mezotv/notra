"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Card, CardContent } from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { DirectionInstrument } from "@/components/geo/directions/direction-instrument";
import { useGeoGenerateFromWebsite } from "@/lib/hooks/use-geo";
import type { GeoOnboardingOverlayProps } from "@/types/geo";
import { normalizeWebsiteUrl } from "@/utils/geo-website";

export function GeoOnboardingOverlay({
  organizationId,
  onManualSetup,
}: GeoOnboardingOverlayProps) {
  const id = useId();
  const [url, setUrl] = useState("");
  const generate = useGeoGenerateFromWebsite(organizationId);
  const canSubmit = normalizeWebsiteUrl(url) !== null && !generate.isPending;

  const handleGenerate = () => {
    const normalized = normalizeWebsiteUrl(url);
    if (!normalized || generate.isPending) {
      return;
    }
    generate.mutate({ url: normalized });
  };

  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none opacity-60 blur-[0.375rem]"
        inert
      >
        <DirectionInstrument />
      </div>

      <div className="absolute inset-0 z-10 flex items-start justify-center bg-gradient-to-b from-background/40 via-background/80 to-background px-4 py-10 sm:items-center">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <h2 className="font-semibold text-lg tracking-tight">
                See how AI engines talk about you
              </h2>
              <p className="text-muted-foreground text-sm">
                We read your site, work out your company, aliases, and
                competitors, then ask the major AI engines the questions your
                buyers ask and track whether you come up.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${id}-url`}>Your website</Label>
              <Input
                autoComplete="url"
                disabled={generate.isPending}
                id={`${id}-url`}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleGenerate();
                  }
                }}
                placeholder="yourcompany.com"
                value={url}
              />
            </div>

            <Button
              className="w-full"
              disabled={!canSubmit}
              onClick={handleGenerate}
            >
              {generate.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              {generate.isPending ? "Analyzing site…" : "Generate my dashboard"}
            </Button>

            {generate.isError && (
              <p className="text-destructive text-xs">
                We could not read that site. Check the address and try again, or
                set things up manually.
              </p>
            )}

            <div className="text-center">
              <Button
                className="text-muted-foreground"
                onClick={onManualSetup}
                size="sm"
                variant="link"
              >
                Set up manually
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
