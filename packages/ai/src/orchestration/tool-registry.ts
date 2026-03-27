import { createMarkdownTools } from "@notra/ai/tools/edit-markdown";
import {
  createGetCommitsByTimeframeTool,
  createGetPullRequestsTool,
  createGetReleaseByTagTool,
} from "@notra/ai/tools/github";
import {
  createGetLinearCyclesTool,
  createGetLinearIssuesTool,
  createGetLinearProjectsTool,
} from "@notra/ai/tools/linear";
import { getSkillByName, listAvailableSkills } from "@notra/ai/tools/skills";
import type {
  ResolveIntegrationContext,
  ResolveLinearIntegrationContext,
} from "@notra/ai/types/agents";
import type {
  BuildToolSetParams,
  LinearContext,
  RepoContext,
  ToolSet,
  ValidatedIntegration,
} from "@notra/ai/types/orchestration";
import type { Tool } from "ai";

export interface BuildToolSetDeps {
  resolveContext?: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
}

export function buildToolSet(
  params: BuildToolSetParams,
  deps?: BuildToolSetDeps
): ToolSet {
  const {
    organizationId,
    currentMarkdown,
    onMarkdownUpdate,
    validatedIntegrations,
  } = params;

  const { getMarkdown, editMarkdown } = createMarkdownTools({
    currentMarkdown,
    onUpdate:
      onMarkdownUpdate ??
      (() => {
        console.log("onMarkdownUpdate is not set");
      }),
  });

  const tools: Record<string, Tool> = {
    getMarkdown,
    editMarkdown,
    listAvailableSkills: listAvailableSkills(),
    getSkillByName: getSkillByName(),
  };

  const descriptions: string[] = [
    "**Markdown Editing**: View and edit the document using getMarkdown and editMarkdown",
    "**Skills**: Access knowledge and writing guidelines using listAvailableSkills and getSkillByName",
  ];

  const hasGitHub = validatedIntegrations.some(
    (i) => i.type === "github" && i.repositories.length > 0
  );

  if (hasGitHub) {
    const allowedIntegrationIds = Array.from(
      new Set(
        validatedIntegrations
          .filter((integration) => integration.type === "github")
          .map((integration) => integration.id)
      )
    );

    tools.getPullRequests = createGetPullRequestsTool(
      {
        organizationId,
        allowedIntegrationIds,
      },
      deps?.resolveContext
    );
    tools.getReleaseByTag = createGetReleaseByTagTool(
      {
        organizationId,
        allowedIntegrationIds,
      },
      deps?.resolveContext
    );
    tools.getCommitsByTimeframe = createGetCommitsByTimeframeTool(
      {
        organizationId,
        allowedIntegrationIds,
      },
      deps?.resolveContext
    );

    const repos = getGitHubRepoList(validatedIntegrations);
    descriptions.push(
      `**GitHub Integration**: Fetch PRs, releases, and commits from: ${repos}`
    );
  }

  const hasLinear = validatedIntegrations.some((i) => i.type === "linear");

  if (hasLinear) {
    const allowedLinearIntegrationIds = Array.from(
      new Set(
        validatedIntegrations
          .filter((integration) => integration.type === "linear")
          .map((integration) => integration.id)
      )
    );

    tools.getLinearIssues = createGetLinearIssuesTool(
      { organizationId, allowedIntegrationIds: allowedLinearIntegrationIds },
      deps?.resolveLinearContext
    );
    tools.getLinearProjects = createGetLinearProjectsTool(
      { organizationId, allowedIntegrationIds: allowedLinearIntegrationIds },
      deps?.resolveLinearContext
    );
    tools.getLinearCycles = createGetLinearCyclesTool(
      { organizationId, allowedIntegrationIds: allowedLinearIntegrationIds },
      deps?.resolveLinearContext
    );

    const teams = getLinearTeamList(validatedIntegrations);
    descriptions.push(
      `**Linear Integration**: Fetch issues, projects, and cycles${teams ? ` from: ${teams}` : ""}`
    );
  }

  return { tools, descriptions };
}

function getGitHubRepoList(integrations: ValidatedIntegration[]): string {
  const repos: string[] = [];
  for (const integration of integrations) {
    if (integration.type === "github") {
      for (const repo of integration.repositories) {
        repos.push(`${repo.owner}/${repo.repo}`);
      }
    }
  }
  return repos.join(", ");
}

function getLinearTeamList(integrations: ValidatedIntegration[]): string {
  const teams: string[] = [];
  for (const integration of integrations) {
    if (integration.type === "linear") {
      teams.push(integration.linearTeamName ?? integration.displayName);
    }
  }
  return teams.join(", ");
}

export function getRepoContextFromIntegrations(
  integrations: ValidatedIntegration[]
): RepoContext[] {
  return Array.from(
    new Set(
      integrations
        .filter((integration) => integration.type === "github")
        .map((integration) => integration.id)
    )
  ).map((integrationId) => ({ integrationId }));
}

export function getLinearContextFromIntegrations(
  integrations: ValidatedIntegration[]
): LinearContext[] {
  return Array.from(
    new Set(
      integrations
        .filter((integration) => integration.type === "linear")
        .map((integration) => integration.id)
    )
  ).map((integrationId) => ({ integrationId }));
}
