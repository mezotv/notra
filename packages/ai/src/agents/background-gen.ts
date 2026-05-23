import { AGENT_DEFAULT_MODEL } from "@notra/ai/constants/models";
import { createModel } from "@notra/ai/model";
import type { AILogTarget } from "@notra/ai/observability";
import { getUserPrompt } from "@notra/ai/prompts/user";
import type { ContentType } from "@notra/ai/schemas/content";
import {
  createGetBrandReferencesTool,
  createSearchBrandReferencesTool,
} from "@notra/ai/tools/brand-references";
import { buildGitHubDataTools } from "@notra/ai/tools/github";
import { buildLinearDataTools } from "@notra/ai/tools/linear";
import {
  createCreatePostTool,
  createFailTool,
  createSkipTool,
  createUpdatePostTool,
  createViewPostTool,
} from "@notra/ai/tools/post";
import { getSkillByName, listAvailableSkills } from "@notra/ai/tools/skills";
import {
  createWebSearchTool,
  isWebSearchAvailable,
  WEB_SEARCH_TOOL_DESCRIPTION,
  WEB_SEARCH_TOOL_NAME,
} from "@notra/ai/tools/web-search";
import type {
  AgentDataPointSettings,
  AgentTokenUsage,
  LinearIntegrationRef,
  ResolveIntegrationContext,
  ResolveLinearIntegrationContext,
} from "@notra/ai/types/agents";
import type { AgentType } from "@notra/ai/types/brand-references";
import type {
  PostToolsConfig,
  PostToolsResult,
} from "@notra/ai/types/post-tools";
import type { PostSummary } from "@notra/ai/types/posts";
import type { BaseTonePromptInput } from "@notra/ai/types/prompts";
import type { TccMetadata } from "@notra/ai/types/tcc";
import type {
  CommitWindow,
  GitHubSelectionFilters,
} from "@notra/ai/types/tools";
import { buildExperimentalTelemetry } from "@notra/ai/utils/tcc";
import type { PostSourceMetadata } from "@notra/db/schema";
import { stepCountIs, ToolLoopAgent } from "ai";

export interface BackgroundGenOptions {
  organizationId: string;
  skillName: string;
  contentType: ContentType;
  brandAgentType: AgentType;
  contentLabel: string;
  voiceId?: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  linearIntegrations?: LinearIntegrationRef[];
  promptInput: BaseTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
  resolveContext: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
  log?: AILogTarget;
  telemetryMetadata?: TccMetadata;
  includeSearchBrandReferencesTool?: boolean;
}

export interface BackgroundGenResult {
  postId: string;
  title: string;
  posts: PostSummary[];
  usage?: AgentTokenUsage;
}

export class ContentGenerationSkippedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentGenerationSkippedError";
  }
}

function buildDispatcherInstructions(options: {
  contentLabel: string;
  contentType: string;
  hasWebSearch: boolean;
  primarySkillName: string;
}): string {
  const sourceTools = options.hasWebSearch
    ? "brand references, GitHub, Linear, web search"
    : "brand references, GitHub, Linear";
  const webSearchRule = options.hasWebSearch
    ? "\n- Use webSearch when public, current, or external context would improve accuracy, especially for source-aware claims, market context, docs, or news. Prefer limit: 5 unless broader coverage is needed."
    : "";

  return `You are a content generation agent for this organization. Your task: produce ${options.contentLabel} (contentType: ${options.contentType}).

Skills drive your behavior. Skill content is NOT injected into this prompt. You load skills on demand via tools.

Do these steps in order:

1. Call listAvailableSkills to see every writing skill this organization has. Study the names and descriptions.

2. Identify the primary skill that matches your task. The hint from the trigger is "${options.primarySkillName}". Confirm it exists and is the right fit. If a differently-named skill looks like a better match based on its description, use that instead.

3. Call getSkillByName to load the primary skill's full instructions. Read them carefully and follow them exactly. They override these dispatcher instructions on any overlap.

4. Execute the primary skill: gather source data via the provided tools (${sourceTools}), then draft the post according to the skill's format and rules.

5. Before finalizing, scan the skill list again for supporting skills (for example, a "humanizer" skill for polishing AI-sounding output, or any org-specific skill whose description applies). Load any that apply via getSkillByName and apply their guidance to your near-final draft.

6. When the content is finalized, call createPost. If source lookup succeeds but there is no meaningful source material, call skip with a concise reason. Use skip for expected no-op cases such as no commits, no PRs, no releases, no Linear issues, or only low-signal/internal changes in the requested lookback window. Use fail only for actual errors, impossible requests, invalid inputs, or tool/API failures. Do not return the content as plain text.

## Output rules (hard)
- NEVER use em dashes (—) or en dashes (–) anywhere in the post content, title, recommendations, or any text you emit. Use commas, periods, semicolons, parentheses, or a hyphen (-). If a loaded skill's examples contain em/en dashes, ignore that part of the style and substitute safe punctuation.
${webSearchRule}

Skills are the source of truth for how to write. This prompt tells you how to orchestrate them.`;
}

export async function runBackgroundGen(
  options: BackgroundGenOptions
): Promise<BackgroundGenResult> {
  const {
    organizationId,
    skillName,
    contentType,
    brandAgentType,
    contentLabel,
    voiceId,
    repositories,
    linearIntegrations,
    promptInput,
    sourceMetadata,
    dataPointSettings,
    selectionFilters,
    commitWindow,
    autoPublish,
    resolveContext,
    resolveLinearContext,
    log,
    telemetryMetadata,
    includeSearchBrandReferencesTool,
  } = options;

  if (
    (!repositories || repositories.length === 0) &&
    (!linearIntegrations || linearIntegrations.length === 0)
  ) {
    throw new Error(
      `At least one repository or Linear integration must be provided to generate ${contentLabel}.`
    );
  }

  const hasWebSearch = isWebSearchAvailable();
  const instructions = buildDispatcherInstructions({
    contentLabel,
    contentType,
    hasWebSearch,
    primarySkillName: skillName,
  });

  const model = createModel(
    organizationId,
    AGENT_DEFAULT_MODEL,
    undefined,
    log
  );

  const prompt = getUserPrompt(contentLabel, promptInput);

  const allowedIntegrationIds = Array.from(
    new Set((repositories ?? []).map((repo) => repo.integrationId))
  );

  const allowedLinearIntegrationIds = Array.from(
    new Set((linearIntegrations ?? []).map((li) => li.integrationId))
  );

  const postToolsResult: PostToolsResult = {};
  const postToolsConfig: PostToolsConfig = {
    organizationId,
    contentType,
    sourceMetadata,
    autoPublish,
  };

  const brandReferenceTools: Record<
    string,
    ReturnType<typeof createGetBrandReferencesTool>
  > = {
    getBrandReferences: createGetBrandReferencesTool({
      organizationId,
      voiceId,
      agentType: brandAgentType,
    }),
  };

  if (includeSearchBrandReferencesTool) {
    brandReferenceTools.searchBrandReferences = createSearchBrandReferencesTool(
      {
        organizationId,
        voiceId,
        agentType: brandAgentType,
      }
    );
  }

  const agent = new ToolLoopAgent({
    model,
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 4096 },
      },
    },
    tools: {
      ...brandReferenceTools,
      ...buildGitHubDataTools({
        organizationId,
        allowedIntegrationIds,
        dataPointSettings,
        selectionFilters,
        commitWindow,
        resolveContext,
      }),
      ...buildLinearDataTools({
        organizationId,
        allowedIntegrationIds: allowedLinearIntegrationIds,
        dataPointSettings,
        resolveContext: resolveLinearContext,
      }),
      listAvailableSkills: listAvailableSkills({ organizationId }),
      getSkillByName: getSkillByName({ organizationId }),
      ...(hasWebSearch
        ? { [WEB_SEARCH_TOOL_NAME]: createWebSearchTool() }
        : {}),
      createPost: createCreatePostTool(postToolsConfig, postToolsResult),
      updatePost: createUpdatePostTool(postToolsConfig, postToolsResult),
      viewPost: createViewPostTool(postToolsConfig),
      skip: createSkipTool(postToolsResult),
      fail: createFailTool(postToolsResult),
    },
    instructions: hasWebSearch
      ? `${instructions}\n\n## Additional Capability\n- ${WEB_SEARCH_TOOL_DESCRIPTION}`
      : instructions,
    stopWhen: stepCountIs(35),
    experimental_telemetry: buildExperimentalTelemetry(telemetryMetadata),
  });

  const result = await agent.generate({ prompt });

  if (postToolsResult.skipReason) {
    throw new ContentGenerationSkippedError(postToolsResult.skipReason);
  }

  if (postToolsResult.failReason) {
    throw new Error(postToolsResult.failReason);
  }

  if (!postToolsResult.posts?.length) {
    throw new Error(
      `${contentLabel} agent completed without creating a post. No createPost tool call was made.`
    );
  }

  const primaryPost = postToolsResult.posts[0];

  if (!primaryPost) {
    throw new Error(`${contentLabel} agent did not return a primary post.`);
  }

  return {
    postId: primaryPost.postId,
    title: primaryPost.title,
    posts: postToolsResult.posts,
    usage: {
      inputTokens: result.totalUsage.inputTokens ?? 0,
      outputTokens: result.totalUsage.outputTokens ?? 0,
      totalTokens: result.totalUsage.totalTokens ?? 0,
      cacheReadTokens:
        result.totalUsage.inputTokenDetails?.cacheReadTokens ?? 0,
      cacheWriteTokens:
        result.totalUsage.inputTokenDetails?.cacheWriteTokens ?? 0,
      raw: result.totalUsage,
    },
  };
}
