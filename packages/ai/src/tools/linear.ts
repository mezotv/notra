import type { ResolveLinearIntegrationContext } from "@notra/ai/types/agents";
import type {
  BuildLinearDataToolsOptions,
  LinearToolContext,
  LinearToolsAccessConfig,
} from "@notra/ai/types/tools";
import { toolDescription } from "@notra/ai/utils/description";
import { createLinearClient } from "@notra/ai/utils/linear";
import { type Tool, tool } from "ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { getAICachedTools } from "./tool-cache";

function createLinearIntegrationContextResolver(
  config?: LinearToolsAccessConfig,
  resolveContext?: ResolveLinearIntegrationContext
) {
  const cache = new Map<string, Promise<LinearToolContext>>();

  return async (integrationId: string) => {
    if (
      config?.allowedIntegrationIds !== undefined &&
      !config.allowedIntegrationIds.includes(integrationId)
    ) {
      throw new Error(
        `Linear integration access denied. Integration ID ${integrationId} is not in the allowed list.`
      );
    }

    let cached = cache.get(integrationId);
    if (!cached) {
      if (!resolveContext) {
        throw new Error(
          "No resolveContext callback provided for Linear tool integration resolution."
        );
      }
      cached = resolveContext(integrationId, {
        organizationId: config?.organizationId,
      });
      cache.set(integrationId, cached);
      cached.catch(() => {
        cache.delete(integrationId);
      });
    }
    return cached;
  };
}

export function createGetLinearIssuesTool(
  config?: LinearToolsAccessConfig,
  resolveContext?: ResolveLinearIntegrationContext
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "linear",
  });
  const resolveIntegrationContext = createLinearIntegrationContextResolver(
    config,
    resolveContext
  );

  return cached(
    tool({
      description: toolDescription({
        toolName: "get_linear_issues",
        intro:
          "Gets issues from a Linear team within a specific timeframe, including title, description, state, priority, assignee, and labels.",
        whenToUse:
          "When the user asks about Linear issues, wants to see what was worked on, needs issue details for changelogs, or wants to understand recent development activity from Linear.",
        usageNotes:
          "Requires integrationId. Supports filtering by timeframe via since/until ISO timestamps. Returns paginated results with cursor-based pagination.",
      }),
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe("The integration ID for the configured Linear workspace"),
        since: z
          .string()
          .datetime()
          .optional()
          .describe(
            "UTC ISO timestamp for the start of the range (filters by updatedAt)"
          ),
        until: z
          .string()
          .datetime()
          .optional()
          .describe(
            "UTC ISO timestamp for the end of the range (filters by updatedAt)"
          ),
        cursor: z
          .string()
          .optional()
          .describe("Pagination cursor from a previous response"),
        includeCompleted: z
          .boolean()
          .default(true)
          .describe("Whether to include completed/cancelled issues"),
      }),
      execute: async ({
        integrationId,
        since,
        until,
        cursor,
        includeCompleted,
      }) => {
        const resolved = await resolveIntegrationContext(integrationId);
        const client = createLinearClient(resolved.accessToken);

        const filter: Record<string, unknown> = {};

        if (resolved.linearTeamId) {
          filter.team = { id: { eq: resolved.linearTeamId } };
        }

        if (since || until) {
          filter.updatedAt = {};
          if (since) {
            (filter.updatedAt as Record<string, string>).gte = since;
          }
          if (until) {
            (filter.updatedAt as Record<string, string>).lte = until;
          }
        }

        if (!includeCompleted) {
          filter.completedAt = { null: true };
        }

        const issues = await client.issues({
          filter,
          first: 50,
          after: cursor,
          orderBy: "updatedAt" as never,
        });

        const results = await Promise.all(
          issues.nodes.map(async (issue) => {
            const [state, assignee, labels] = await Promise.all([
              issue.state,
              issue.assignee,
              issue.labels(),
            ]);

            return {
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              description: issue.description
                ? issue.description.slice(0, 500)
                : null,
              state: state?.name ?? null,
              stateType: state?.type ?? null,
              priority: issue.priority,
              priorityLabel: issue.priorityLabel,
              assignee: assignee?.name ?? assignee?.displayName ?? null,
              labels: labels.nodes.map((l) => l.name),
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt,
              completedAt: issue.completedAt ?? null,
              url: issue.url,
            };
          })
        );

        return {
          issues: results,
          pagination: {
            hasNextPage: issues.pageInfo.hasNextPage,
            endCursor: issues.pageInfo.endCursor ?? null,
          },
        };
      },
    }),
    {
      ttl: 5 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, since, until, cursor } = params as {
          integrationId: string;
          since?: string;
          until?: string;
          cursor?: string;
        };
        return `get_linear_issues:integration=${integrationId}:since=${since ?? "none"}:until=${until ?? "none"}:cursor=${cursor ?? "start"}`;
      },
    }
  );
}

export function createGetLinearProjectsTool(
  config?: LinearToolsAccessConfig,
  resolveContext?: ResolveLinearIntegrationContext
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "linear",
  });
  const resolveIntegrationContext = createLinearIntegrationContextResolver(
    config,
    resolveContext
  );

  return cached(
    tool({
      description: toolDescription({
        toolName: "get_linear_projects",
        intro:
          "Gets projects from a Linear workspace or team, including name, description, state, progress, and timeline.",
        whenToUse:
          "When the user asks about Linear projects, wants to understand project progress, or needs project context for content generation.",
        usageNotes:
          "Requires integrationId. Returns active and completed projects with progress data.",
      }),
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe("The integration ID for the configured Linear workspace"),
        includeCompleted: z
          .boolean()
          .default(false)
          .describe("Whether to include completed projects"),
      }),
      execute: async ({ integrationId, includeCompleted }) => {
        const resolved = await resolveIntegrationContext(integrationId);
        const client = createLinearClient(resolved.accessToken);

        const filter: Record<string, unknown> = {};

        if (resolved.linearTeamId) {
          filter.accessibleTeams = {
            some: { id: { eq: resolved.linearTeamId } },
          };
        }

        if (!includeCompleted) {
          filter.state = { type: { nin: ["completed", "canceled"] } };
        }

        const projects = await client.projects({
          filter,
          first: 25,
          orderBy: "updatedAt" as never,
        });

        const results = await Promise.all(
          projects.nodes.map(async (project) => {
            const lead = await project.lead;
            return {
              id: project.id,
              name: project.name,
              description: project.description
                ? project.description.slice(0, 300)
                : null,
              state: project.state,
              progress: project.progress,
              startDate: project.startDate ?? null,
              targetDate: project.targetDate ?? null,
              lead: lead?.name ?? lead?.displayName ?? null,
              url: project.url,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
            };
          })
        );

        return { projects: results };
      },
    }),
    {
      ttl: 15 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId, includeCompleted } = params as {
          integrationId: string;
          includeCompleted?: boolean;
        };
        return `get_linear_projects:integration=${integrationId}:completed=${String(includeCompleted ?? false)}`;
      },
    }
  );
}

export function createGetLinearCyclesTool(
  config?: LinearToolsAccessConfig,
  resolveContext?: ResolveLinearIntegrationContext
): Tool {
  const cached = getAICachedTools({
    organizationId: config?.organizationId,
    namespace: "linear",
  });
  const resolveIntegrationContext = createLinearIntegrationContextResolver(
    config,
    resolveContext
  );

  return cached(
    tool({
      description: toolDescription({
        toolName: "get_linear_cycles",
        intro:
          "Gets current and recent cycles from a Linear team, including progress, issue counts, and timeline.",
        whenToUse:
          "When the user asks about Linear cycles or sprints, wants to see cycle progress, or needs sprint context for content generation.",
        usageNotes:
          "Requires integrationId. Returns the most recent cycles including the current active one.",
      }),
      inputSchema: z.object({
        integrationId: z
          .string()
          .describe("The integration ID for the configured Linear workspace"),
      }),
      execute: async ({ integrationId }) => {
        const resolved = await resolveIntegrationContext(integrationId);
        const client = createLinearClient(resolved.accessToken);

        if (!resolved.linearTeamId) {
          return {
            cycles: [],
            note: "No team scoped for this integration. Cycles are team-specific in Linear.",
          };
        }

        const team = await client.team(resolved.linearTeamId);
        const cycles = await team.cycles({
          first: 5,
          orderBy: "startsAt" as never,
        });

        const results = cycles.nodes.map((cycle) => ({
          id: cycle.id,
          name: cycle.name ?? null,
          number: cycle.number,
          startsAt: cycle.startsAt,
          endsAt: cycle.endsAt,
          progress: cycle.progress,
          completedAt: cycle.completedAt ?? null,
        }));

        return { cycles: results };
      },
    }),
    {
      ttl: 10 * 60 * 1000,
      keyGenerator: (params: unknown) => {
        const { integrationId } = params as { integrationId: string };
        return `get_linear_cycles:integration=${integrationId}`;
      },
    }
  );
}

export function buildLinearDataTools(
  options: BuildLinearDataToolsOptions
): Record<string, Tool> {
  const {
    organizationId,
    allowedIntegrationIds,
    dataPointSettings,
    resolveContext,
  } = options;

  const includeLinearData = dataPointSettings?.includeLinearData !== false;

  if (!includeLinearData) {
    return {};
  }

  return {
    getLinearIssues: createGetLinearIssuesTool(
      { organizationId, allowedIntegrationIds },
      resolveContext
    ),
    getLinearProjects: createGetLinearProjectsTool(
      { organizationId, allowedIntegrationIds },
      resolveContext
    ),
    getLinearCycles: createGetLinearCyclesTool(
      { organizationId, allowedIntegrationIds },
      resolveContext
    ),
  };
}
