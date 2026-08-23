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
} from "@notra/ui/components/shared/responsive-alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { ApiKeyRevealField } from "@/components/api-keys/api-key-reveal-field";
import { Button } from "@/components/button";
import {
  useGeoIngestSetup,
  useGeoIngestTokenRotate,
} from "@/lib/hooks/use-geo";
import type { TrackingTokenCardProps } from "@/types/api-keys";

export function TrackingTokenCard({ organizationId }: TrackingTokenCardProps) {
  const { data, isPending } = useGeoIngestSetup(organizationId);
  const rotate = useGeoIngestTokenRotate(organizationId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const token = data?.token ?? "";

  if (!(isPending || token)) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-medium text-sm">
            Tracking token
            <Badge variant="secondary">Write-only</Badge>
          </h2>
          <p className="text-muted-foreground text-sm">
            Authenticates the AI traffic proxy on your site. It can only send
            traffic events, nothing else.
          </p>
        </div>
        <Button
          disabled={isPending || rotate.isPending}
          onClick={() => setConfirmOpen(true)}
          size="sm"
          variant="outline"
        >
          {rotate.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Rotate
        </Button>
      </div>
      {isPending ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <ApiKeyRevealField value={token} />
      )}

      <ResponsiveAlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Rotate the tracking token?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Every deployed copy stops working right away, including
              project-scoped tokens. Update the token on your site after
              rotating.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                rotate.mutate();
              }}
            >
              Rotate token
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </section>
  );
}
