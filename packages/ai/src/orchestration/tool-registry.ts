import { createMarkdownTools } from "@notra/ai/tools/edit-markdown";
import {
  createGetCommitsByTimeframeTool,
  createGetPullRequestsTool,
  createGetReleaseByTagTool,
} from "@notra/ai/tools/github";
import { getSkillByName, listAvailableSkills } from "@notra/ai/tools/skills";
import type { ResolveIntegrationContext } from "@notra/ai/types/agents";
import type {
  BuildToolSetParams,
  RepoContext,
  ToolSet,
  ValidatedIntegration,
} from "@notra/ai/types/orchestration";
import type { Tool } from "ai";

export interface BuildToolSetDeps {
  resolveContext?: ResolveIntegrationContext;
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
