"use client";

import {
  Delete02Icon,
  GlobalIcon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { useDeleteSitemap, useSitemaps } from "@/lib/hooks/use-brand-sitemaps";
import { getSafeHttpUrl } from "@/lib/sitemap/sitemap-url";
import type { SitemapListProps } from "@/types/hooks/brand-sitemaps";
import { SITEMAP_STAT_SKELETON_KEYS } from "../constants/sitemap-ui";
import { AddSitemapDialog } from "./add-sitemap-dialog";
import { SitemapPagesTable } from "./sitemap-pages-table";
import { SitemapSelector } from "./sitemap-selector";
import { SitemapStats } from "./sitemap-stats";

export function SitemapList({
  organizationId,
  voiceId,
  voiceWebsiteUrl,
  dialogOpen,
  onDialogOpenChange,
}: SitemapListProps) {
  const { data, isError, isPending, refetch } = useSitemaps(
    organizationId,
    voiceId
  );
  const deleteSitemap = useDeleteSitemap(organizationId, voiceId);
  const sitemaps = data?.sitemaps ?? [];

  const [selectedSitemapId, setSelectedSitemapId] = useState<string | null>(
    null
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const selectedSitemap =
    sitemaps.find((sitemap) => sitemap.id === selectedSitemapId) ??
    sitemaps.at(0) ??
    null;
  const deleteTarget =
    sitemaps.find((sitemap) => sitemap.id === deleteTargetId) ?? null;

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteSitemap.mutateAsync(deleteTarget.id);
      toast.success("Sitemap removed");
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove sitemap"
      );
    }
  };

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SITEMAP_STAT_SKELETON_KEYS.map((key) => (
            <Skeleton className="h-28 w-full" key={key} />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        actionIcon={<HugeiconsIcon className="size-4" icon={GlobalIcon} />}
        actionLabel="Retry"
        description="We couldn't load this brand identity's sitemaps."
        onActionClick={() => refetch()}
        title="Sitemaps unavailable"
      />
    );
  }

  return (
    <div className="space-y-6">
      {sitemaps.length === 0 ? (
        <EmptyState
          actionIcon={<HugeiconsIcon className="size-4" icon={GlobalIcon} />}
          actionLabel="Add Sitemap"
          description="Add a sitemap to track indexed pages and monitor site health for AI discovery."
          onActionClick={() => onDialogOpenChange(true)}
          title="No sitemaps yet"
        />
      ) : (
        <>
          <SitemapSelector
            onSelect={setSelectedSitemapId}
            selectedSitemapId={selectedSitemapId}
            sitemaps={sitemaps}
          />

          {selectedSitemap ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                {(() => {
                  const safeUrl = getSafeHttpUrl(selectedSitemap.url);
                  return safeUrl ? (
                    <a
                      className="group flex min-w-0 items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                      href={safeUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <HugeiconsIcon
                        className="size-4 shrink-0"
                        icon={GlobalIcon}
                      />
                      <span className="truncate group-hover:underline">
                        {selectedSitemap.url}
                      </span>
                      <HugeiconsIcon
                        className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        icon={LinkSquare02Icon}
                      />
                    </a>
                  ) : (
                    <div className="flex min-w-0 items-center gap-2 text-muted-foreground text-sm">
                      <HugeiconsIcon
                        className="size-4 shrink-0"
                        icon={GlobalIcon}
                      />
                      <span className="truncate">{selectedSitemap.url}</span>
                    </div>
                  );
                })()}
                <Button
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTargetId(selectedSitemap.id)}
                  size="sm"
                  variant="ghost"
                >
                  <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                  Remove
                </Button>
              </div>

              <SitemapStats sitemap={selectedSitemap} />

              <SitemapPagesTable
                organizationId={organizationId}
                sitemapId={selectedSitemap.id}
                voiceId={voiceId}
              />
            </div>
          ) : null}
        </>
      )}

      <AddSitemapDialog
        onOpenChange={onDialogOpenChange}
        open={dialogOpen}
        organizationId={organizationId}
        voiceId={voiceId}
        voiceWebsiteUrl={voiceWebsiteUrl}
      />

      <ResponsiveAlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
        open={!!deleteTargetId}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Remove sitemap?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This removes
              {deleteTarget ? ` ${deleteTarget.label}` : " this sitemap"} and
              its crawled pages from this brand identity.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={deleteSitemap.isPending}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSitemap.isPending}
              onClick={handleDelete}
            >
              {deleteSitemap.isPending ? "Removing…" : "Remove Sitemap"}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </div>
  );
}
