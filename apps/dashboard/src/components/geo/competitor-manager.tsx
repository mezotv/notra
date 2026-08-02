"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import type { GeoSettings } from "@/types/geo";

interface CompetitorManagerProps {
  organizationId: string;
  settings: GeoSettings;
}

export function CompetitorManager({
  organizationId,
  settings,
}: CompetitorManagerProps) {
  const [draft, setDraft] = useState("");
  const upsert = useGeoSettingsUpsert(organizationId);

  const save = (competitors: string[]) => {
    upsert.mutate({
      organizationId,
      companyName: settings.companyName,
      aliases: settings.aliases,
      competitors,
      languages: settings.languages,
      enabled: settings.enabled,
    });
  };

  const handleAdd = () => {
    const name = draft.trim();
    if (name.length === 0 || settings.competitors.includes(name)) {
      return;
    }
    save([...settings.competitors, name]);
    setDraft("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watched competitors</CardTitle>
        <CardDescription>
          Named competitors get called out in scans; unlisted brands are still
          detected automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAdd();
              }
            }}
            placeholder="Competitor name"
            value={draft}
          />
          <Button
            disabled={draft.trim().length === 0 || upsert.isPending}
            onClick={handleAdd}
          >
            {upsert.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {settings.competitors.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No competitors added yet
            </p>
          )}
          {settings.competitors.map((competitor) => (
            <Badge className="gap-1 pr-1" key={competitor} variant="secondary">
              {competitor}
              <button
                aria-label={`Remove ${competitor}`}
                className="cursor-pointer rounded-full p-0.5 hover:bg-muted"
                onClick={() =>
                  save(
                    settings.competitors.filter((name) => name !== competitor)
                  )
                }
                type="button"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
