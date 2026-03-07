"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReferenceInput } from "@/schemas/brand";
import type {
  BrandReference,
  FetchedTweetResponse,
} from "@/types/hooks/brand-references";
import { QUERY_KEYS } from "@/utils/query-keys";

function baseUrl(organizationId: string, voiceId: string) {
  return `/api/organizations/${organizationId}/brand/${voiceId}/references`;
}

export function useReferences(organizationId: string, voiceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BRAND.references(organizationId, voiceId),
    queryFn: async (): Promise<{ references: BrandReference[] }> => {
      const res = await fetch(baseUrl(organizationId, voiceId));
      if (!res.ok) {
        throw new Error("Failed to fetch references");
      }
      return res.json();
    },
    enabled: !!organizationId && !!voiceId,
  });
}

export function useCreateReference(organizationId: string, voiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReferenceInput) => {
      const res = await fetch(baseUrl(organizationId, voiceId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create reference");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.references(organizationId, voiceId),
      });
    },
  });
}

export function useDeleteReference(organizationId: string, voiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referenceId: string) => {
      const res = await fetch(
        `${baseUrl(organizationId, voiceId)}?id=${referenceId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete reference");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.references(organizationId, voiceId),
      });
    },
  });
}

export function useUpdateReference(organizationId: string, voiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referenceId,
      data,
    }: {
      referenceId: string;
      data: { note?: string | null; content?: string; applicableTo?: string[] };
    }) => {
      const res = await fetch(
        `${baseUrl(organizationId, voiceId)}?id=${referenceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update reference");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.references(organizationId, voiceId),
      });
    },
  });
}

export function useImportTweets(organizationId: string, voiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      accountId: string;
      maxResults?: number;
    }): Promise<{
      count: number;
      references: BrandReference[];
    }> => {
      const res = await fetch(
        `${baseUrl(organizationId, voiceId)}/import-tweets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to import tweets");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BRAND.references(organizationId, voiceId),
      });
    },
  });
}

export function useFetchTweet(organizationId: string, voiceId: string) {
  return useMutation({
    mutationFn: async (url: string): Promise<FetchedTweetResponse> => {
      const res = await fetch(
        `${baseUrl(organizationId, voiceId)}/fetch-tweet`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch tweet");
      }
      return res.json();
    },
  });
}
