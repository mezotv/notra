"use client";

import { Button } from "@notra/ui/components/ui/button";
import { Card, CardContent } from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { useGeoGenerateFromWebsite } from "@/lib/hooks/use-geo";
import { normalizeWebsiteUrl } from "@/utils/geo-website";

interface WebsiteGenerateCardProps {
  organizationId: string;
  compact?: boolean;
}

export function WebsiteGenerateCard({
  organizationId,
  compact = false,
}: WebsiteGenerateCardProps) {
  const id = useId();
  const [url, setUrl] = useState("");
  const generate = useGeoGenerateFromWebsite(organizationId);

  const handleGenerate = () => {
    const normalized = normalizeWebsiteUrl(url);
    if (!normalized) {
      return;
    }
    generate.mutate({ url: normalized });
  };

  const form = (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
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
      <Button
        className="shrink-0"
        disabled={url.trim().length === 0 || generate.isPending}
        onClick={handleGenerate}
      >
        {generate.isPending && <Loader2Icon className="size-4 animate-spin" />}
        {generate.isPending ? "Analyzing site…" : "Generate"}
      </Button>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <Label className="text-muted-foreground" htmlFor={`${id}-url`}>
          Generate more prompts and competitors from a website
        </Label>
        {form}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="space-y-1">
          <p className="font-medium">Set up from your website</p>
          <p className="text-muted-foreground text-sm">
            We read your site, work out your company, aliases, and competitors,
            and write the prompts your buyers actually ask AI assistants.
          </p>
        </div>
        {form}
      </CardContent>
    </Card>
  );
}
