import {
  getLiveMcpStoreIntegrationById,
  getLiveMcpStoreIntegrationBySlug,
  listLiveMcpStoreIntegrations,
  listMcpIntegrationToolsByIntegrationIds,
} from "@notra/ai/integrations/mcp-store";
import { STORE_TOOL_PREVIEW_LIMIT } from "@/constants/store";
import type {
  IndexedStoreTool,
  PublicStoreIntegration,
  PublicStoreTool,
  StoreListingRow,
} from "@/types/store";

function toPublicTool(tool: IndexedStoreTool): PublicStoreTool {
  return {
    name: tool.serverToolName,
    title: tool.title ?? null,
    description: tool.description ?? null,
  };
}

function toPublicIntegration(
  integration: StoreListingRow,
  tools: PublicStoreTool[]
): PublicStoreIntegration {
  return {
    id: integration.id,
    name: integration.name,
    description: integration.description ?? null,
    author: integration.author ?? null,
    websiteUrl: integration.websiteUrl ?? null,
    brandColor: integration.brandColor ?? null,
    logoLightUrl: integration.logoLightUrl ?? null,
    logoDarkUrl: integration.logoDarkUrl ?? null,
    bannerUrl: integration.bannerUrl ?? null,
    slug: integration.slug ?? null,
    authType: integration.authType,
    indexedToolCount: integration.indexedToolCount,
    tools,
  };
}

function groupToolsByIntegration(tools: IndexedStoreTool[]) {
  const grouped = new Map<string, PublicStoreTool[]>();
  for (const tool of tools) {
    const existing = grouped.get(tool.serverIntegrationId);
    if (existing) {
      existing.push(toPublicTool(tool));
    } else {
      grouped.set(tool.serverIntegrationId, [toPublicTool(tool)]);
    }
  }
  return grouped;
}

export async function listPublicStoreIntegrations(): Promise<
  PublicStoreIntegration[]
> {
  const integrations = await listLiveMcpStoreIntegrations();
  const integrationIds = integrations.map((integration) => integration.id);
  const tools = await listMcpIntegrationToolsByIntegrationIds(integrationIds);
  const toolsByIntegration = groupToolsByIntegration(tools);

  return integrations.map((integration) =>
    toPublicIntegration(
      integration,
      (toolsByIntegration.get(integration.id) ?? []).slice(
        0,
        STORE_TOOL_PREVIEW_LIMIT
      )
    )
  );
}

const INTEGRATION_ID_PREFIX_REGEX = /^mcp_/;

export async function getPublicStoreIntegration(
  slugOrId: string
): Promise<PublicStoreIntegration | null> {
  const integration = INTEGRATION_ID_PREFIX_REGEX.test(slugOrId)
    ? await getLiveMcpStoreIntegrationById(slugOrId)
    : await getLiveMcpStoreIntegrationBySlug(slugOrId);

  if (!integration) {
    return null;
  }

  const tools = await listMcpIntegrationToolsByIntegrationIds([integration.id]);

  return toPublicIntegration(integration, tools.map(toPublicTool));
}
