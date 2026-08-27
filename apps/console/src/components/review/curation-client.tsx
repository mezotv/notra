"use client";

import { MCP_STORE_CATEGORIES } from "@notra/ai/constants/mcp-store-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Switch } from "@notra/ui/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

import { getIntegrationInitials } from "@/lib/integrations/form";
import { consoleOrpc } from "@/lib/orpc/query";
import type { CurationRowProps } from "@/types/integrations";

const NONE_CATEGORY_VALUE = "none";

function CurationLogo({ listing }: CurationRowProps) {
  const lightLogo = listing.logoLightUrl ?? listing.logoDarkUrl;
  const darkLogo = listing.logoDarkUrl ?? listing.logoLightUrl;

  if (lightLogo && darkLogo) {
    return (
      <>
        <Image
          alt={`${listing.name} logo`}
          className="size-10 shrink-0 rounded-lg border object-cover dark:hidden"
          height={40}
          src={lightLogo}
          width={40}
        />
        <Image
          alt={`${listing.name} logo`}
          className="hidden size-10 shrink-0 rounded-lg border object-cover dark:block"
          height={40}
          src={darkLogo}
          width={40}
        />
      </>
    );
  }

  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-medium"
      style={{ color: listing.brandColor ?? undefined }}
    >
      {getIntegrationInitials(listing.name)}
    </span>
  );
}

function CurationRow({ listing }: CurationRowProps) {
  const queryClient = useQueryClient();

  function invalidate() {
    return queryClient.invalidateQueries({
      queryKey: consoleOrpc.review.listings.queryKey({}),
    });
  }

  const categoryMutation = useMutation({
    mutationFn: (category: (typeof MCP_STORE_CATEGORIES)[number] | null) =>
      consoleOrpc.review.setCategory.call({
        serverId: listing.id,
        category,
      }),
    onSuccess: invalidate,
  });

  const featuredMutation = useMutation({
    mutationFn: (featured: boolean) =>
      consoleOrpc.review.setFeatured.call({
        serverId: listing.id,
        featured,
      }),
    onSuccess: invalidate,
  });

  const isBusy = categoryMutation.isPending || featuredMutation.isPending;

  return (
    <div className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <CurationLogo listing={listing} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{listing.name}</span>
          {listing.author ? (
            <span className="text-muted-foreground truncate text-xs">
              by {listing.author}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <Select
          onValueChange={(next) => {
            const category =
              next === NONE_CATEGORY_VALUE
                ? null
                : (MCP_STORE_CATEGORIES.find((value) => value === next) ??
                  null);
            categoryMutation.mutate(category);
          }}
          value={listing.category ?? NONE_CATEGORY_VALUE}
        >
          <SelectTrigger className="w-48" disabled={isBusy}>
            <SelectValue placeholder="No category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_CATEGORY_VALUE}>No category</SelectItem>
            {MCP_STORE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Featured</span>
          <Switch
            aria-label={`Feature ${listing.name}`}
            checked={listing.featured}
            disabled={isBusy}
            onCheckedChange={(checked) => {
              featuredMutation.mutate(checked);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function CurationClient() {
  const listingsQuery = useQuery(consoleOrpc.review.listings.queryOptions({}));

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-6 lg:px-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Marketplace curation</h2>
        <p className="text-muted-foreground text-sm">
          Set a category and feature live listings in the public marketplace.
        </p>
      </div>
      {listingsQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : null}
      {listingsQuery.data && listingsQuery.data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {listingsQuery.data.map((listing) => (
            <CurationRow key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
      {listingsQuery.data && listingsQuery.data.length === 0 ? (
        <p className="text-muted-foreground text-sm">No live listings yet.</p>
      ) : null}
    </section>
  );
}
