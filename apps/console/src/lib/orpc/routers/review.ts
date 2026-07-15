import { getMcpServerIntegrationById } from "@notra/ai/integrations/mcp";
import {
  listMcpIntegrationsPendingReview,
  setMcpStoreStatus,
} from "@notra/ai/integrations/mcp-store";
import { assertAdmin } from "@/lib/auth/admin";
import { baseProcedure } from "@/lib/orpc/base";
import { reviewMcpServerRequestSchema } from "@/schemas/integrations";
import { badRequest, notFound } from "../utils/errors";

export const reviewRouter = {
  list: baseProcedure.handler(async ({ context }) => {
    await assertAdmin({ headers: context.headers });

    const pending = await listMcpIntegrationsPendingReview();

    return pending.map((integration) => ({
      id: integration.id,
      name: integration.name,
      url: integration.url,
      description: integration.description,
      author: integration.author,
      websiteUrl: integration.websiteUrl,
      brandColor: integration.brandColor,
      logoLightUrl: integration.logoLightUrl,
      logoDarkUrl: integration.logoDarkUrl,
      bannerUrl: integration.bannerUrl,
      authType: integration.authType,
      indexedToolCount: integration.indexedToolCount,
      submittedAt: integration.submittedAt?.toISOString() ?? null,
      organization: integration.organization,
      createdByUser: integration.createdByUser,
    }));
  }),
  decide: baseProcedure
    .input(reviewMcpServerRequestSchema)
    .handler(async ({ context, input }) => {
      await assertAdmin({ headers: context.headers });

      const existing = await getMcpServerIntegrationById(input.serverId);
      if (!existing) {
        throw notFound("Integration not found");
      }
      if (existing.storeStatus !== "pending_review") {
        throw badRequest("This integration is not awaiting review");
      }
      if (input.action === "reject" && !input.note?.trim()) {
        throw badRequest("Add a note explaining the rejection");
      }

      const updated = await setMcpStoreStatus({
        organizationId: existing.organizationId,
        integrationId: input.serverId,
        status: input.action === "approve" ? "live" : "rejected",
        reviewNote: input.action === "reject" ? (input.note ?? null) : null,
        expectedStatus: "pending_review",
      });
      if (!updated) {
        throw badRequest("This integration was already reviewed");
      }

      return { success: true };
    }),
};
