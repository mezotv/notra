"use client";

import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
  ResponsiveAlertDialogTrigger,
} from "@notra/ui/components/shared/responsive-alert-dialog";
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
  const reset = useMutation({
    mutationFn: () => dashboardOrpc.geo.sampleData.call({ organizationId }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.key(),
      });
      if (!result.analyticsIngested) {
        toast.success("GEO sample data reset", {
          description: `${result.mentionChecks} mention checks added. Tinybird is not configured, so AI traffic stays empty until TINYBIRD_TOKEN is set.`,
        });
        return;
      }
      toast.success("GEO sample data reset", {
        description: `${result.mentionChecks} mention checks and ${result.trafficEvents} traffic events added.`,
      });
    },
    onError: (error) => {
      toast.error(
        errorMessageOr(
          error instanceof Error ? error.message : undefined,
          "Unable to reset GEO sample data"
        )
      );
    },
  });
  const clear = useMutation({
    mutationFn: () =>
      dashboardOrpc.geo.sampleDataClear.call({ organizationId }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.geo.key(),
      });
      toast.success(
        result.cleared ? "GEO sample data cleared" : "No sample data to clear"
      );
    },
    onError: (error) => {
      toast.error(
        errorMessageOr(
          error instanceof Error ? error.message : undefined,
          "Unable to clear GEO sample data"
        )
      );
    },
  });
  const isPending = reset.isPending || clear.isPending;

  if (!GEO_SAMPLE_DATA_ENABLED) {
    return null;
  }

  return (
    <TitleCard heading="Developer">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">GEO sample data</p>
          <p className="text-muted-foreground text-xs">
            Reset replaces the complete demo project with 30 days of prompts,
            conversations, competitors, scans, and traffic. Clear removes only
            the marked demo project and keeps your own data.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ResponsiveAlertDialog>
            <ResponsiveAlertDialogTrigger
              render={
                <Button disabled={isPending} size="sm" variant="outline">
                  Clear sample data
                </Button>
              }
            />
            <ResponsiveAlertDialogContent>
              <ResponsiveAlertDialogHeader>
                <ResponsiveAlertDialogTitle>
                  Clear GEO sample data?
                </ResponsiveAlertDialogTitle>
                <ResponsiveAlertDialogDescription>
                  This removes the marked demo project and its analytics. Your
                  own projects and data remain unchanged.
                </ResponsiveAlertDialogDescription>
              </ResponsiveAlertDialogHeader>
              <ResponsiveAlertDialogFooter>
                <ResponsiveAlertDialogCancel>
                  Cancel
                </ResponsiveAlertDialogCancel>
                <ResponsiveAlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => clear.mutate()}
                >
                  Clear sample data
                </ResponsiveAlertDialogAction>
              </ResponsiveAlertDialogFooter>
            </ResponsiveAlertDialogContent>
          </ResponsiveAlertDialog>
          <Button disabled={isPending} onClick={() => reset.mutate()} size="sm">
            {reset.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Resetting…
              </>
            ) : (
              "Reset sample data"
            )}
          </Button>
        </div>
      </div>
    </TitleCard>
  );
}
