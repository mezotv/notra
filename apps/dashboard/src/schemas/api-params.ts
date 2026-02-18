import { z } from "zod";

export const triggerIdQuerySchema = z.object({
  triggerId: z.string().min(1),
});

export const webhookLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  integrationType: z
    .enum(["github", "linear", "slack", "webhook", "manual"])
    .default("github"),
  integrationId: z.string().nullish(),
});

export const contentListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  date: z.string().optional(),
});

export const deleteWithTransfersSchema = z.object({
  transfers: z.array(
    z.object({
      orgId: z.string().min(1),
      action: z.enum(["transfer", "delete"]),
    })
  ),
});

export const organizationMembershipActionSchema = z.object({
  organizationId: z.string().min(1),
  action: z.enum(["leave", "delete"]),
});
