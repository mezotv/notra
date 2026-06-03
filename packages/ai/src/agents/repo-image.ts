import {
  AGENT_TIMEOUT_MS,
  BOX_BASE_URL,
  IMAGE_GEN_AGENT_SKILLS_INSTALL_COMMAND,
  IMAGE_GEN_MODEL_ID,
  RECOVERY_AGENT_TIMEOUT_MS,
  REPO_IMAGE_OUTPUT_HTML_PATH,
  TRAILING_SLASH_RE,
} from "@notra/ai/constants/repo-image";
import {
  getDecryptedToken,
  getGitHubIntegrationById,
  validateRepositoryBranchExists,
} from "@notra/ai/integrations/github";
import {
  buildExtractionPrompt,
  buildRevisionPrompt,
} from "@notra/ai/prompts/repo-image";
import type {
  GenerateRepoImageInput,
  GenerateRepoImageResult,
  RepoImageErrorCode,
  RepoImageSourceContext,
} from "@notra/ai/types/repo-image";
import { createOctokit } from "@notra/ai/utils/octokit";
import { shortSha } from "@notra/ai/utils/repo-image";
import { renderHtmlToImages } from "@notra/ai/utils/repo-image-render";
import { withLongFetchTimeouts } from "@notra/ai/utils/undici-dispatcher";
import { Agent, Box } from "@upstash/box";

export class RepoImageError extends Error {
  readonly code: RepoImageErrorCode;

  constructor(code: RepoImageErrorCode, message: string) {
    super(message);
    this.name = "RepoImageError";
    this.code = code;
  }
}

function getErrorStatus(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : undefined;
}

async function runRepoImageAgentStream(params: {
  box: Awaited<ReturnType<typeof Box.create>>;
  prompt: string;
  timeout: number;
  label: string;
}) {
  const startedAt = Date.now();
  const stream = await params.box.agent.stream({
    prompt: params.prompt,
    timeout: params.timeout,
  });

  for await (const chunk of stream) {
    if (chunk.type === "tool-call") {
      console.log(`[repo-image] ${params.label} tool: ${chunk.toolName}`);
    }
  }

  console.log(
    `[repo-image] ${params.label} stream completed in ${Date.now() - startedAt}ms`
  );

  return {
    cost:
      typeof stream === "object" && stream !== null && "cost" in stream
        ? (stream.cost as unknown)
        : undefined,
  };
}

async function runRepoImageAgentStreamAllowTimeout(
  params: Parameters<typeof runRepoImageAgentStream>[0]
) {
  try {
    return await runRepoImageAgentStream(params);
  } catch (error) {
    if (!isAgentTimeoutError(error)) {
      throw error;
    }

    console.warn(
      `[repo-image] ${params.label} stream timed out after ${params.timeout}ms; checking for ${REPO_IMAGE_OUTPUT_HTML_PATH}`
    );
    return null;
  }
}

async function hasRepoImageOutput(box: Awaited<ReturnType<typeof Box.create>>) {
  const existsRun = await withBoxRetry(() =>
    box.exec.command(
      `test -f ${REPO_IMAGE_OUTPUT_HTML_PATH} && echo ok || echo missing`
    )
  );
  return existsRun.result.trim() === "ok";
}

async function installImageGenAgentSkills(params: {
  box: Awaited<ReturnType<typeof Box.create>>;
}) {
  await withBoxRetry(() =>
    params.box.exec.command(IMAGE_GEN_AGENT_SKILLS_INSTALL_COMMAND)
  );
}

async function withBoxRetry<T>(callback: () => Promise<T>, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransientBoxError(error)) {
        break;
      }
      await sleep(1000 * attempt);
    }
  }

  throw lastError;
}

function isTransientBoxError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes("fetch failed") ||
    error.message.includes("ECONNRESET") ||
    error.message.includes("UND_ERR")
  );
}

function isAgentTimeoutError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("stream timed out") || message.includes("run timed out")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMissingOutputRecoveryPrompt() {
  return `Your previous run ended without creating the required deliverable.

You MUST now create this exact file:

  ${REPO_IMAGE_OUTPUT_HTML_PATH}

Do not do more research unless absolutely necessary. If you already made a draft HTML file, copy or rewrite that final HTML to ${REPO_IMAGE_OUTPUT_HTML_PATH}. If no draft exists, immediately create a valid 1200x630 single HTML document that follows the original instructions.

Use the Write tool or shell redirection to create ${REPO_IMAGE_OUTPUT_HTML_PATH}. After the file exists, stop.`;
}

async function buildSourceContext(params: {
  mode: GenerateRepoImageInput["mode"];
  prompt?: string;
  prNumber?: number;
  commitSha?: string;
  owner: string;
  repo: string;
  token: string | null;
}): Promise<RepoImageSourceContext> {
  const { mode, owner, repo, token } = params;

  if (mode === "prompt") {
    return { mode, prompt: params.prompt ?? "" };
  }

  const octokit = createOctokit(token ?? undefined);

  if (mode === "pr") {
    const prNumber = params.prNumber;
    if (prNumber === undefined) {
      throw new RepoImageError("invalid_source", "PR number is required");
    }
    let pr: Awaited<
      ReturnType<
        typeof octokit.request<"GET /repos/{owner}/{repo}/pulls/{pull_number}">
      >
    >["data"];
    let files: Awaited<
      ReturnType<
        typeof octokit.request<"GET /repos/{owner}/{repo}/pulls/{pull_number}/files">
      >
    >["data"];

    try {
      [{ data: pr }, { data: files }] = await Promise.all([
        octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
          owner,
          repo,
          pull_number: prNumber,
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }),
        octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
          owner,
          repo,
          pull_number: prNumber,
          per_page: 10,
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        }),
      ]);
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        throw new RepoImageError(
          "invalid_source",
          `Pull request #${prNumber} was not found`
        );
      }
      throw error;
    }

    return {
      mode,
      prNumber,
      title: pr.title,
      body: pr.body ?? "",
      filesChanged: pr.changed_files ?? files.length,
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      topFiles: files.map((file) => file.filename),
    };
  }

  const sha = params.commitSha;
  if (!sha) {
    throw new RepoImageError("invalid_source", "Commit SHA is required");
  }
  let commit: Awaited<
    ReturnType<
      typeof octokit.request<"GET /repos/{owner}/{repo}/commits/{ref}">
    >
  >["data"];

  try {
    ({ data: commit } = await octokit.request(
      "GET /repos/{owner}/{repo}/commits/{ref}",
      {
        owner,
        repo,
        ref: sha,
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      }
    ));
  } catch (error) {
    if (getErrorStatus(error) === 404) {
      throw new RepoImageError("invalid_source", `Commit ${sha} was not found`);
    }
    throw error;
  }

  return {
    mode,
    sha: commit.sha,
    shortSha: shortSha(commit.sha),
    message: commit.commit.message,
    filesChanged: commit.files?.length ?? 0,
    topFiles: (commit.files ?? []).slice(0, 10).map((file) => file.filename),
  };
}

export async function generateRepoImage(params: {
  input: GenerateRepoImageInput;
  userId: string;
  restoreSnapshotId?: string | null;
  snapshotName?: string;
}): Promise<GenerateRepoImageResult> {
  const { input, restoreSnapshotId, snapshotName, userId } = params;

  if (!process.env.UPSTASH_BOX_API_KEY) {
    throw new RepoImageError(
      "missing_config",
      "UPSTASH_BOX_API_KEY is not configured"
    );
  }

  const integration = await getGitHubIntegrationById(input.integrationId);
  if (
    !integration ||
    integration.organizationId !== input.organizationId ||
    !integration.enabled
  ) {
    throw new RepoImageError("not_found", "Integration not found");
  }

  const repository = integration.repositories[0];
  if (!repository || !repository.enabled) {
    throw new RepoImageError(
      "not_found",
      "Integration has no repository configured"
    );
  }

  const token = await getDecryptedToken(input.integrationId, userId);

  await validateRepositoryBranchExists({
    owner: repository.owner,
    repo: repository.repo,
    branch: input.branch,
    token: token ?? undefined,
  });

  const source = await buildSourceContext({
    mode: input.mode,
    prompt: input.prompt,
    prNumber: input.prNumber,
    commitSha: input.commitSha,
    owner: repository.owner,
    repo: repository.repo,
    token,
  });

  return await withLongFetchTimeouts(async () => {
    const boxConfig = {
      apiKey: process.env.UPSTASH_BOX_API_KEY,
      runtime: "node" as const,
      git: {
        ...(token ? { token } : {}),
        userName: "notra-bot",
        userEmail: "bot@usenotra.com",
      },
      agent: {
        harness: Agent.OpenCode,
        model: IMAGE_GEN_MODEL_ID,
      },
      timeout: AGENT_TIMEOUT_MS,
    };
    const box = restoreSnapshotId
      ? await withBoxRetry(() => Box.fromSnapshot(restoreSnapshotId, boxConfig))
      : await withBoxRetry(() => Box.create(boxConfig));

    let html: string;
    let usage: GenerateRepoImageResult["usage"];
    let snapshot: Awaited<ReturnType<typeof box.snapshot>> | null = null;

    try {
      if (!restoreSnapshotId) {
        await box.git.clone({
          repo: `https://github.com/${repository.owner}/${repository.repo}.git`,
          branch: input.branch,
        });
      }
      await withBoxRetry(() => box.cd(repository.repo));

      if (!restoreSnapshotId) {
        await installImageGenAgentSkills({ box });
      }

      const runInitialRepoImageAgent = restoreSnapshotId
        ? runRepoImageAgentStream
        : runRepoImageAgentStreamAllowTimeout;
      const initialRun = await runInitialRepoImageAgent({
        box,
        prompt: restoreSnapshotId
          ? buildRevisionPrompt({ prompt: input.prompt ?? "" })
          : buildExtractionPrompt({
              owner: repository.owner,
              repo: repository.repo,
              branch: input.branch,
              source,
            }),
        timeout: AGENT_TIMEOUT_MS,
        label: restoreSnapshotId ? "revision" : "initial",
      });
      usage = extractRepoImageUsage(initialRun?.cost, IMAGE_GEN_MODEL_ID);

      if (!(await hasRepoImageOutput(box))) {
        console.warn(
          `[repo-image] missing ${REPO_IMAGE_OUTPUT_HTML_PATH}; asking agent to recover`
        );
        const recoveryRun = await runRepoImageAgentStreamAllowTimeout({
          box,
          prompt: buildMissingOutputRecoveryPrompt(),
          timeout: RECOVERY_AGENT_TIMEOUT_MS,
          label: "recovery",
        });
        usage = mergeRepoImageUsage(
          usage,
          extractRepoImageUsage(recoveryRun?.cost, IMAGE_GEN_MODEL_ID)
        );
      }

      if (!(await hasRepoImageOutput(box))) {
        const diag = await withBoxRetry(() =>
          box.exec.command(
            `ls -la /workspace/home/ 2>&1 | head -50; echo ---; find /workspace/home -maxdepth 4 -name "output.html" 2>/dev/null`
          )
        );
        console.error(
          "[repo-image] missing output.html, /workspace/home contents:\n",
          diag.result
        );
        throw new RepoImageError(
          "agent_failed",
          `Agent did not produce ${REPO_IMAGE_OUTPUT_HTML_PATH}`
        );
      }

      html = await withBoxRetry(() =>
        box.files.read(REPO_IMAGE_OUTPUT_HTML_PATH)
      );
      snapshot = await withBoxRetry(() =>
        box.snapshot({
          name:
            snapshotName ??
            `repo-image-${repository.owner}-${repository.repo}-${Date.now()}`,
        })
      );
    } finally {
      await box.delete().catch((error: unknown) => {
        console.error("Failed to delete repo-image box", error);
      });
    }

    const { svg, pngBase64 } = await renderHtmlToImages(html);

    return {
      pngBase64,
      svg,
      html,
      sandbox: snapshot
        ? {
            boxId: readSnapshotString(snapshot, "boxId"),
            snapshotId: readSnapshotString(snapshot, "id"),
            snapshotName: readSnapshotString(snapshot, "name"),
            snapshotSizeBytes: readSnapshotNumber(snapshot, "sizeBytes"),
            snapshotCreatedAt: readSnapshotString(snapshot, "createdAt"),
          }
        : null,
      usage,
    };
  });
}

export async function deleteRepoImageSnapshot(params: {
  boxId?: string;
  snapshotId?: string;
}) {
  if (!(params.boxId && params.snapshotId)) {
    return;
  }
  if (!process.env.UPSTASH_BOX_API_KEY) {
    throw new RepoImageError(
      "missing_config",
      "UPSTASH_BOX_API_KEY is not configured"
    );
  }

  await withLongFetchTimeouts(async () =>
    withBoxRetry(async () => {
      const response = await fetch(
        `${BOX_BASE_URL.replace(TRAILING_SLASH_RE, "")}/v2/box/${
          params.boxId
        }/snapshots/${params.snapshotId}`,
        {
          method: "DELETE",
          headers: {
            "X-Box-Api-Key": process.env.UPSTASH_BOX_API_KEY ?? "",
          },
        }
      );

      if (response.status === 404) {
        return;
      }

      if (!response.ok) {
        throw new RepoImageError(
          "agent_failed",
          `Failed to delete repo image snapshot ${params.snapshotId}: ${response.status} ${response.statusText}`
        );
      }
    })
  );
}

function readSnapshotString(snapshot: unknown, key: string) {
  if (typeof snapshot !== "object" || snapshot === null || !(key in snapshot)) {
    return undefined;
  }
  const value = (snapshot as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function readSnapshotNumber(snapshot: unknown, key: string) {
  if (typeof snapshot !== "object" || snapshot === null || !(key in snapshot)) {
    return undefined;
  }
  const value = (snapshot as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

function extractRepoImageUsage(
  cost: unknown,
  modelId: string
): GenerateRepoImageResult["usage"] {
  if (!cost || typeof cost !== "object") {
    return undefined;
  }

  const inputTokens =
    "inputTokens" in cost && typeof cost.inputTokens === "number"
      ? cost.inputTokens
      : 0;
  const outputTokens =
    "outputTokens" in cost && typeof cost.outputTokens === "number"
      ? cost.outputTokens
      : 0;
  const computeMs =
    "computeMs" in cost && typeof cost.computeMs === "number"
      ? cost.computeMs
      : undefined;
  const totalUsd =
    "totalUsd" in cost && typeof cost.totalUsd === "number"
      ? cost.totalUsd
      : undefined;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    modelId,
    ...(computeMs === undefined ? {} : { computeMs }),
    ...(totalUsd === undefined ? {} : { totalUsd }),
    raw: cost,
  };
}

function mergeRepoImageUsage(
  current: GenerateRepoImageResult["usage"],
  next: GenerateRepoImageResult["usage"]
): GenerateRepoImageResult["usage"] {
  if (!current) {
    return next;
  }
  if (!next) {
    return current;
  }
  return {
    inputTokens: current.inputTokens + next.inputTokens,
    outputTokens: current.outputTokens + next.outputTokens,
    totalTokens: current.totalTokens + next.totalTokens,
    cacheReadTokens: current.cacheReadTokens + next.cacheReadTokens,
    cacheWriteTokens: current.cacheWriteTokens + next.cacheWriteTokens,
    modelId: current.modelId ?? next.modelId,
    computeMs:
      current.computeMs === undefined && next.computeMs === undefined
        ? undefined
        : (current.computeMs ?? 0) + (next.computeMs ?? 0),
    totalUsd:
      current.totalUsd === undefined && next.totalUsd === undefined
        ? undefined
        : (current.totalUsd ?? 0) + (next.totalUsd ?? 0),
    raw: [current.raw, next.raw],
  };
}
