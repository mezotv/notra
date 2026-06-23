"use client";

import { GlobalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { useCreateSitemap } from "@/lib/hooks/use-brand-sitemaps";
import {
  getRegistrableHost,
  isUrlWithinBrandHost,
  normalizeSitemapUrl,
} from "@/lib/sitemap/sitemap-url";
import type { AddSitemapDialogProps } from "@/types/hooks/brand-sitemaps";

export function AddSitemapDialog({
  open,
  onOpenChange,
  organizationId,
  voiceId,
  voiceWebsiteUrl,
}: AddSitemapDialogProps) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const createSitemap = useCreateSitemap(organizationId, voiceId);

  const brandHost = getRegistrableHost(voiceWebsiteUrl ?? "");

  const trimmedUrl = url.trim();
  const isOffHost =
    trimmedUrl.length > 0 && !isUrlWithinBrandHost(trimmedUrl, voiceWebsiteUrl);

  const handleClose = () => {
    setUrl("");
    setLabel("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!trimmedUrl) {
      toast.error("Please enter a sitemap URL");
      return;
    }

    if (!isUrlWithinBrandHost(trimmedUrl, voiceWebsiteUrl)) {
      toast.error(
        brandHost
          ? `Sitemaps must stay on ${brandHost} or its subdomains`
          : "Set a website on this brand identity first"
      );
      return;
    }

    const normalizedUrl = normalizeSitemapUrl(trimmedUrl);

    try {
      await createSitemap.mutateAsync({
        url: normalizedUrl,
        label: label.trim() || undefined,
      });
      toast.success("Sitemap added");
      handleClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add sitemap"
      );
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !createSitemap.isPending) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <ResponsiveDialog onOpenChange={handleClose} open={open}>
      <ResponsiveDialogContent className="[&>*]:min-w-0">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add Sitemap</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Track indexed pages and monitor site health for AI discovery.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sitemap-url">Sitemap or site URL</Label>
            <Input
              aria-invalid={isOffHost}
              id="sitemap-url"
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                brandHost
                  ? `https://${brandHost}/sitemap.xml`
                  : "https://example.com/sitemap.xml"
              }
              value={url}
            />
            {isOffHost ? (
              <p className="text-destructive text-xs">
                {brandHost
                  ? `URLs must stay on ${brandHost} or its subdomains.`
                  : "Set a website on this brand identity first."}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <HugeiconsIcon className="size-3.5" icon={GlobalIcon} />
                {brandHost
                  ? `Scoped to ${brandHost} and its subdomains`
                  : "Scoped to this brand identity's website"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sitemap-label">Label (optional)</Label>
            <Input
              id="sitemap-label"
              onChange={(event) => setLabel(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Marketing site"
              value={label}
            />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={createSitemap.isPending || !trimmedUrl || isOffHost}
            onClick={handleSubmit}
          >
            {createSitemap.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Sitemap"
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
