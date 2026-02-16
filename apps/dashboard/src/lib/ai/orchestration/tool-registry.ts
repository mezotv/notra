import type { Tool } from "ai";
import { createMarkdownTools } from "@/lib/ai/tools/edit-markdown";
import {
  createGetCommitsByTimeframeTool,
  createGetPullRequestsTool,
  createGetReleaseByTagTool,
} from "@/lib/ai/tools/github";
import { getSkillByName, listAvailableSkills } from "@/lib/ai/tools/skills";
import type {
  BuildToolSetParams,
  RepoContext,
  ToolSet,
  ValidatedIntegration,
} from "@/types/lib/ai/orchestration";

export function buildToolSet(params: BuildToolSetParams): ToolSet {
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
    const allowedRepositories = validatedIntegrations.flatMap((integration) =>
      integration.type === "github"
        ? integration.repositories.map((repository) => ({
            owner: repository.owner,
            repo: repository.repo,
            defaultBranch: repository.defaultBranch,
          }))
        : []
    );

    tools.getPullRequests = createGetPullRequestsTool({
      organizationId,
      allowedRepositories,
    });
    tools.getReleaseByTag = createGetReleaseByTagTool({
      organizationId,
      allowedRepositories,
    });
    tools.getCommitsByTimeframe = createGetCommitsByTimeframeTool({
      organizationId,
      allowedRepositories,
    });

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
  const repos: RepoContext[] = [];
  for (const integration of integrations) {
    if (integration.type === "github") {
      for (const repo of integration.repositories) {
        repos.push({ owner: repo.owner, repo: repo.repo });
      }
    }
  }
  return repos;
}
