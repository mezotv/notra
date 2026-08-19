"use client";

import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { GEO_SAMPLE_DATA_ENABLED } from "@/constants/geo";
import { dashboardOrpc } from "@/lib/orpc/query";
import { errorMessageOr } from "@/lib/utils";
import type { DevSampleDataCardProps } from "@/types/settings/general";

export function DevSampleDataCard({ organizationId }: DevSampleDataCardProps) {
  const queryClient = useQueryClient();
  const seed = useMutation({
    mutationFn: () => dashboardOrpc.geo.sampleData.call({ organizationId }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.key(),
      });
      if (!result.analyticsIngested) {
        toast.success("GEO sample records saved", {
          description:
            "Tinybird is not configured, so charts stay empty until TINYBIRD_TOKEN is set.",
        });
        return;
      }
      toast.success("GEO sample data added", {
        description: `${result.mentionChecks} mention checks and ${result.trafficEvents} traffic events ingested.`,
      });
    },
    onError: (error) => {
      toast.error(
        errorMessageOr(
          error instanceof Error ? error.message : undefined,
          "Failed to add GEO sample data"
        )
      );
    },
  });

  if (!GEO_SAMPLE_DATA_ENABLED) {
    return null;
  }

  return (
    <TitleCard heading="Developer">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sm">Add sample data</p>
          <p className="text-muted-foreground text-xs">
            Local development only. Seeds GEO settings, prompts, competitors,
            and scan/traffic rows for this organization.
          </p>
        </div>
        <Button
          disabled={seed.isPending}
          onClick={() => seed.mutate()}
          size="sm"
          variant="outline"
        >
          {seed.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Adding…
            </>
          ) : (
            "Add sample data"
          )}
        </Button>
      </div>
    </TitleCard>
  );
}
