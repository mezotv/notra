import { getMcpStoreListingById } from "@notra/ai/integrations/mcp";
import {
  listMcpIntegrationsPendingReview,
  listMcpIntegrationToolsByIntegrationIds,
  listMcpStoreListingsForCuration,
  setMcpStoreCuration,
  setMcpStoreStatus,
} from "@notra/ai/integrations/mcp-store";
import { assertAdmin } from "@/lib/auth/admin";
import { baseProcedure } from "@/lib/orpc/base";
import {
  reviewMcpServerRequestSchema,
  setStoreListingCategoryRequestSchema,
  setStoreListingFeaturedRequestSchema,
} from "@/schemas/integrations";
import { badRequest, notFound } from "../utils/errors";

export const reviewRouter = {
  list: baseProcedure.handler(async ({ context }) => {
    await assertAdmin({ headers: context.headers });

    const pending = await listMcpIntegrationsPendingReview();
    const tools = await listMcpIntegrationToolsByIntegrationIds(
      pending.map((integration) => integration.id)
    );
    const toolsByIntegrationId = new Map<string, typeof tools>();
    for (const tool of tools) {
      const group = toolsByIntegrationId.get(tool.serverIntegrationId) ?? [];
      group.push(tool);
      toolsByIntegrationId.set(tool.serverIntegrationId, group);
    }

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
      tools: (toolsByIntegrationId.get(integration.id) ?? []).map((tool) => ({
        id: tool.id,
        serverToolName: tool.serverToolName,
        title: tool.title,
        description: tool.description,
        actionPhrasePresent: tool.actionPhrasePresent,
        actionPhrasePast: tool.actionPhrasePast,
      })),
      submittedAt: integration.submittedAt?.toISOString() ?? null,
      organization: integration.organization,
      createdByUser: integration.createdByUser,
    }));
  }),
  decide: baseProcedure
    .input(reviewMcpServerRequestSchema)
    .handler(async ({ context, input }) => {
      await assertAdmin({ headers: context.headers });

      const existing = await getMcpStoreListingById(input.serverId);
      if (!existing) {
        throw notFound("Integration not found");
      }
      if (existing.storeStatus !== "pending_review") {
        throw badRequest("This integration is not awaiting review");
      }
      if (input.action === "reject" && !input.note?.trim()) {
        throw badRequest("Add a note explaining the rejection");
      }
      const existingSubmittedAtMs = existing.submittedAt?.getTime() ?? null;
      const inputSubmittedAtMs = input.submittedAt
        ? new Date(input.submittedAt).getTime()
        : null;
      if (existingSubmittedAtMs !== inputSubmittedAtMs) {
        throw badRequest(
          "This integration was resubmitted since you loaded the queue. Refresh and review the latest version."
        );
      }

      const updated = await setMcpStoreStatus({
        organizationId: existing.organizationId,
        integrationId: input.serverId,
        status: input.action === "approve" ? "live" : "rejected",
        reviewNote: input.action === "reject" ? (input.note ?? null) : null,
        expectedStatus: "pending_review",
        expectedSubmittedAt: input.submittedAt
          ? new Date(input.submittedAt)
          : null,
      });
      if (!updated) {
        throw badRequest("This integration was already reviewed");
      }

      return { success: true };
    }),
  listings: baseProcedure.handler(async ({ context }) => {
    await assertAdmin({ headers: context.headers });

    const listings = await listMcpStoreListingsForCuration();

    return listings.map((listing) => ({
      id: listing.id,
      name: listing.name,
      author: listing.author,
      brandColor: listing.brandColor,
      logoLightUrl: listing.logoLightUrl,
      logoDarkUrl: listing.logoDarkUrl,
      category: listing.category,
      featured: listing.storeFeaturedAt !== null,
    }));
  }),
  setCategory: baseProcedure
    .input(setStoreListingCategoryRequestSchema)
    .handler(async ({ context, input }) => {
      await assertAdmin({ headers: context.headers });

      const updated = await setMcpStoreCuration({
        integrationId: input.serverId,
        category: input.category,
      });
      if (!updated) {
        throw notFound("Integration not found");
      }

      return { category: updated.category };
    }),
  setFeatured: baseProcedure
    .input(setStoreListingFeaturedRequestSchema)
    .handler(async ({ context, input }) => {
      await assertAdmin({ headers: context.headers });

      const updated = await setMcpStoreCuration({
        integrationId: input.serverId,
        featured: input.featured,
      });
      if (!updated) {
        throw notFound("Integration not found");
      }

      return { featured: updated.storeFeaturedAt !== null };
    }),
};
