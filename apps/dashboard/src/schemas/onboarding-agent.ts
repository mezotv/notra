// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const onboardingAgentWorkflowPayloadSchema = z.object({
  organizationId: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  email: z.email().optional(),
  organizationSlug: z.string().trim().min(1).optional(),
  reservedAt: z.iso.datetime(),
});

export const triggerOnboardingAgentSetupSchema = z.object({
  organizationId: z.string().trim().min(1),
  websiteUrl: z.string().trim().min(1).optional(),
});

export const eveSessionResponseSchema = z.object({
  sessionId: z.string().min(1),
});

export const startAgentRunInputSchema = z.object({
  organizationId: z.string().trim().min(1),
  domain: z.string().trim().min(1),
});

export const listSuggestionsInputSchema = z.object({
  organizationId: z.string().trim().min(1),
  includeDismissed: z.boolean().optional(),
});

export const dismissSuggestionInputSchema = z.object({
  organizationId: z.string().trim().min(1),
  suggestionId: z.string().min(1),
});
