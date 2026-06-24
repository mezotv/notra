"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateGuidelineAssetInput,
  CreateGuidelineColorInput,
  UpdateGuidelineAssetInput,
  UpdateGuidelineColorInput,
  UpdateGuidelineFontInput,
  UpdateGuidelineScreenshotInput,
  UpdateGuidelineTokenInput,
} from "@/schemas/brand-guidelines";
import type { BrandGuidelinesResponse } from "@/types/hooks/brand-guidelines";
import { dashboardOrpc } from "../orpc/query";

function guidelinesGetKey(organizationId: string, voiceId: string) {
  return dashboardOrpc.brand.guidelines.get.queryKey({
    input: { organizationId, voiceId },
  });
}

export function useBrandGuidelines(organizationId: string, voiceId: string) {
  return useQuery<BrandGuidelinesResponse>(
    dashboardOrpc.brand.guidelines.get.queryOptions({
      input: { organizationId, voiceId },
      enabled: !!organizationId && !!voiceId,
    })
  );
}

export function useRefreshBrandGuidelines(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation<BrandGuidelinesResponse>({
    mutationFn: () =>
      dashboardOrpc.brand.guidelines.refresh.call({ organizationId, voiceId }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: guidelinesGetKey(organizationId, voiceId),
      });
    },
  });
}

export function useUpdateGuidelineColor(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGuidelineColorInput) =>
      dashboardOrpc.brand.guidelines.updateColor.call({
        organizationId,
        voiceId,
        ...input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
  });
}

export function useUpdateGuidelineFont(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGuidelineFontInput) =>
      dashboardOrpc.brand.guidelines.updateFont.call({
        organizationId,
        voiceId,
        ...input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
  });
}

export function useUpdateGuidelineToken(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGuidelineTokenInput) =>
      dashboardOrpc.brand.guidelines.updateToken.call({
        organizationId,
        voiceId,
        ...input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
  });
}

export function useUpdateGuidelineAsset(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGuidelineAssetInput) =>
      dashboardOrpc.brand.guidelines.updateAsset.call({
        organizationId,
        voiceId,
        ...input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
  });
}

export function useUpdateGuidelineScreenshot(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGuidelineScreenshotInput) =>
      dashboardOrpc.brand.guidelines.updateScreenshot.call({
        organizationId,
        voiceId,
        ...input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
  });
}

export function useCreateGuidelineColor(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGuidelineColorInput) =>
      dashboardOrpc.brand.guidelines.createColor.call({
        organizationId,
        voiceId,
        ...input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
  });
}

export function useCreateGuidelineAsset(
  organizationId: string,
  voiceId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGuidelineAssetInput) =>
      dashboardOrpc.brand.guidelines.createAsset.call({
        organizationId,
        voiceId,
        ...input,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(guidelinesGetKey(organizationId, voiceId), data);
    },
  });
}
