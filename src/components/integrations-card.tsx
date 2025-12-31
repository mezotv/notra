"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS } from "@/utils/query-keys";

export type InstalledIntegration = {
  id: string;
  displayName: string;
  type: string;
  enabled: boolean;
  createdAt: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  repositories: Array<{
    id: string;
    owner: string;
    repo: string;
    enabled: boolean;
  }>;
};

export type InstalledIntegrationCardProps = {
  integration: InstalledIntegration;
  organizationId: string;
  organizationSlug: string;
  icon?: React.ReactNode;
  onUpdate?: () => void;
};

export function InstalledIntegrationCard({
  integration,
  organizationId,
  organizationSlug,
  icon,
  onUpdate,
}: InstalledIntegrationCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${integration.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update integration");
      }

      return response.json();
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.base,
      });
      toast.success(enabled ? "Integration enabled" : "Integration disabled");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to update integration");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${integration.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete integration");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.base,
      });
      toast.success("Integration deleted");
      onUpdate?.();
    },
    onError: () => {
      toast.error("Failed to delete integration");
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate(!integration.enabled);
  };

  const handleDelete = () => {
    // biome-ignore lint: Using browser confirm for simple deletion confirmation
    if (!window.confirm("Are you sure you want to delete this integration?")) {
      return;
    }
    deleteMutation.mutate();
  };

  const isLoading = toggleMutation.isPending || deleteMutation.isPending;

  const handleCardClick = () => {
    router.push(
      `/${organizationSlug}/integrations/${integration.type}/${integration.id}`
    );
  };

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={handleCardClick}
    >
      <CardHeader>
        {icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center text-muted-foreground sm:size-10 [&_svg]:size-7 sm:[&_svg]:size-8">
            {icon}
          </div>
        ) : null}
        <CardTitle>{integration.displayName}</CardTitle>
        <CardDescription>
          {integration.createdByUser ? (
            <>
              Added by {integration.createdByUser.name} on{" "}
              {new Date(integration.createdAt).toLocaleDateString()}
            </>
          ) : (
            <>
              Created on {new Date(integration.createdAt).toLocaleDateString()}
            </>
          )}
        </CardDescription>
        <CardAction>
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Badge variant={integration.enabled ? "default" : "secondary"}>
              {integration.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button disabled={isLoading} size="icon-sm" variant="ghost">
                    <svg
                      aria-label="More options"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>More options</title>
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggle}>
                  {integration.enabled ? "Disable" : "Enable"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-sm">
          {integration.repositories.length === 0 ? (
            <p>No repositories configured</p>
          ) : (
            <p>
              {integration.repositories.length} repository
              {integration.repositories.length !== 1 ? "ies" : ""} configured
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function InstalledIntegrationCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="size-9 shrink-0 rounded-md sm:size-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 sm:h-6 sm:w-40" />
          <Skeleton className="h-4 w-48 sm:w-56" />
        </div>
        <CardAction>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  );
}
