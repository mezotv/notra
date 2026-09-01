import { GRANOLA_API_BASE_URL } from "@notra/ai/constants/granola";
import type { ResolveGranolaIntegrationContext } from "@notra/ai/types/agents";
import type {
  GranolaToolContext,
  GranolaToolsAccessConfig,
} from "@notra/ai/types/tools";
import { type Tool, tool } from "ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import { getAICachedTools } from "./tool-cache";

function createGranolaIntegrationContextResolver(
  config?: GranolaToolsAccessConfig,
  resolveContext?: ResolveGranolaIntegrationContext
) {
  const cache = new Map<string, Promise<GranolaToolContext>>();

  return async (integrationId: string) => {
    if (
      config?.allowedIntegrationIds !== undefined &&
      !config.allowedIntegrationIds.includes(integrationId)
    ) {
      throw new Error(
        `Granola integration access denied. Integration ID ${integrationId} is not in the allowed list.`
      );
    }

    const organizationId = config?.organizationId;
    if (!organizationId) {
      throw new Error(
        "Granola tools require an organizationId for integration resolution."
      );
    }

    let cached = cache.get(integrationId);
    if (!cached) {
      if (!resolveContext) {
        throw new Error(
          "No resolveContext callback provided for Granola tool integration resolution."
        );
      }
      cached = resolveContext(integrationId, { organizationId });
      cache.set(integrationId, cached);
      cached.catch(() => {
        cache.delete(integrationId);
      });
    }
    return cached;
  };
}

async function granolaApiRequest(
  apiKey: string,
  path: string,
  searchParams: Record<string, string | undefined>
) {
  const url = new URL(`${GRANOLA_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Granola API request failed with status ${response.status} for ${path}.`
    );
  }

  return response.json();
}

export function createGetGranolaNotesTool(
  config?: GranolaToolsAccessConfig,
  resolveContext?: ResolveGranolaIntegrationContext
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "granola",
  });
  const resolveIntegrationContext = createGranolaIntegrationContextResolver(
    config,
    resolveContext
  );

  const inputSchema = z.object({
    integrationId: z
      .string()
      .describe("The integration ID for the configured Granola workspace"),
    createdAfter: z
      .string()
      .optional()
      .describe("Only return notes created after this ISO timestamp"),
    createdBefore: z
      .string()
      .optional()
      .describe("Only return notes created before this ISO timestamp"),
    folderId: z
      .string()
      .optional()
      .describe("Only return notes in this folder and its child folders"),
    cursor: z
      .string()
      .optional()
      .describe("Pagination cursor from a previous response"),
  });

  return cached(
    tool({
      description:
        "List Granola meeting notes with AI summaries (title, summary, attendees, timestamps). Supports createdAfter/createdBefore ISO timestamps, folder filtering, and cursor pagination. Use getGranolaNote to fetch a full note with its transcript.",
      inputSchema,
      execute: async ({
        integrationId,
        createdAfter,
        createdBefore,
        folderId,
        cursor,
      }) => {
        const resolved = await resolveIntegrationContext(integrationId);

        return granolaApiRequest(resolved.apiKey, "/notes", {
          created_after: createdAfter,
          created_before: createdBefore,
          folder_id: folderId,
          cursor,
          page_size: "30",
        });
      },
    }),
    {
      ttl: 5 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, createdAfter, createdBefore, folderId, cursor } =
          inputSchema.parse(params);
        return `get_granola_notes:integration=${integrationId}:after=${createdAfter ?? "none"}:before=${createdBefore ?? "none"}:folder=${folderId ?? "all"}:cursor=${cursor ?? "start"}`;
      },
    }
  );
}

export function createGetGranolaNoteTool(
  config?: GranolaToolsAccessConfig,
  resolveContext?: ResolveGranolaIntegrationContext
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "granola",
  });
  const resolveIntegrationContext = createGranolaIntegrationContextResolver(
    config,
    resolveContext
  );

  const inputSchema = z.object({
    integrationId: z
      .string()
      .describe("The integration ID for the configured Granola workspace"),
    noteId: z.string().describe("The ID of the Granola note to fetch"),
    includeTranscript: z
      .boolean()
      .default(false)
      .describe("Whether to include the full meeting transcript"),
  });

  return cached(
    tool({
      description:
        "Get a single Granola meeting note by ID, including its AI summary and metadata. Set includeTranscript to also fetch the full meeting transcript.",
      inputSchema,
      execute: async ({ integrationId, noteId, includeTranscript }) => {
        const resolved = await resolveIntegrationContext(integrationId);

        return granolaApiRequest(
          resolved.apiKey,
          `/notes/${encodeURIComponent(noteId)}`,
          {
            include: includeTranscript ? "transcript" : undefined,
          }
        );
      },
    }),
    {
      ttl: 10 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, noteId, includeTranscript } =
          inputSchema.parse(params);
        return `get_granola_note:integration=${integrationId}:note=${noteId}:transcript=${String(includeTranscript)}`;
      },
    }
  );
}

export function createGetGranolaFoldersTool(
  config?: GranolaToolsAccessConfig,
  resolveContext?: ResolveGranolaIntegrationContext
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "granola",
  });
  const resolveIntegrationContext = createGranolaIntegrationContextResolver(
    config,
    resolveContext
  );

  const inputSchema = z.object({
    integrationId: z
      .string()
      .describe("The integration ID for the configured Granola workspace"),
    cursor: z
      .string()
      .optional()
      .describe("Pagination cursor from a previous response"),
  });

  return cached(
    tool({
      description:
        "List Granola folders (sorted alphabetically) with cursor pagination. Use folder IDs to filter notes with getGranolaNotes.",
      inputSchema,
      execute: async ({ integrationId, cursor }) => {
        const resolved = await resolveIntegrationContext(integrationId);

        return granolaApiRequest(resolved.apiKey, "/folders", {
          cursor,
        });
      },
    }),
    {
      ttl: 10 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, cursor } = inputSchema.parse(params);
        return `get_granola_folders:integration=${integrationId}:cursor=${cursor ?? "start"}`;
      },
    }
  );
}
