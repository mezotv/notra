import { z } from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import { listWebhookLogs } from "@/lib/webhooks/logging";
import { webhookLogsQuerySchema } from "@/schemas/api-params";
import { organizationIdSchema } from "@/schemas/auth/organization";
import type { Log, LogsResponse } from "@/types/webhooks/webhooks";

function paginateLogs(logs: Log[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return logs.slice(startIndex, endIndex);
}

const listWebhookLogsInputSchema = z.object({
  organizationId: organizationIdSchema,
  page: webhookLogsQuerySchema.shape.page,
  pageSize: webhookLogsQuerySchema.shape.pageSize,
  integrationType: webhookLogsQuerySchema.shape.integrationType,
  integrationId: z.string().nullish(),
});

export const logsRouter = {
  webhooks: {
    list: authorizedProcedure
      .input(listWebhookLogsInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        const logs = await listWebhookLogs(
          input.organizationId,
          input.integrationType,
          input.integrationId === "all" ? null : (input.integrationId ?? null)
        );

        const paginatedLogs = paginateLogs(logs, input.page, input.pageSize);

        const response: LogsResponse = {
          logs: paginatedLogs,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            totalCount: logs.length,
            totalPages: Math.max(1, Math.ceil(logs.length / input.pageSize)),
          },
        };

        return response;
      }),
  },
};
