import "zod/compile";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

import { webhookLogsQuerySchema } from "@/schemas/api-params";
import { organizationIdSchema } from "@/schemas/auth/organization";

export const listWebhookLogsInputSchema = z.object({
  organizationId: organizationIdSchema,
  page: webhookLogsQuerySchema.shape.page,
  pageSize: webhookLogsQuerySchema.shape.pageSize,
  integrationType: webhookLogsQuerySchema.shape.integrationType,
  integrationId: z.string().nullish(),
  source: webhookLogsQuerySchema.shape.source,
  status: webhookLogsQuerySchema.shape.status,
  search: webhookLogsQuerySchema.shape.search,
});
