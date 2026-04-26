// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
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

function filterLogs(
  logs: Log[],
  filters: {
    source: z.infer<typeof webhookLogsQuerySchema.shape.source>;
    status: z.infer<typeof webhookLogsQuerySchema.shape.status>;
    search: string;
  }
) {
  const search = filters.search.trim().toLowerCase();
  return logs.filter((log) => {
    if (filters.source !== "all" && log.integrationType !== filters.source) {
      return false;
    }
    if (filters.status !== "all" && log.status !== filters.status) {
      return false;
    }
    if (search.length > 0) {
      const inTitle = log.title.toLowerCase().includes(search);
      const inError = log.errorMessage?.toLowerCase().includes(search) ?? false;
      if (!(inTitle || inError)) {
        return false;
      }
    }
    return true;
  });
}

const listWebhookLogsInputSchema = z.object({
  organizationId: organizationIdSchema,
  page: webhookLogsQuerySchema.shape.page,
  pageSize: webhookLogsQuerySchema.shape.pageSize,
  integrationType: webhookLogsQuerySchema.shape.integrationType,
  integrationId: z.string().nullish(),
  source: webhookLogsQuerySchema.shape.source,
  status: webhookLogsQuerySchema.shape.status,
  search: webhookLogsQuerySchema.shape.search,
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

        const filteredLogs = filterLogs(logs, {
          source: input.source,
          status: input.status,
          search: input.search,
        });

        const paginatedLogs = paginateLogs(
          filteredLogs,
          input.page,
          input.pageSize
        );

        const response: LogsResponse = {
          logs: paginatedLogs,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            totalCount: filteredLogs.length,
            totalPages: Math.max(
              1,
              Math.ceil(filteredLogs.length / input.pageSize)
            ),
          },
        };

        return response;
      }),
  },
};
