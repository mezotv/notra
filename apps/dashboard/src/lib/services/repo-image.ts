import { createOctokit } from "@notra/ai/utils/octokit";
import { Agent, Box } from "@upstash/box";
import {
  buildExtractionPrompt,
  REPO_IMAGE_OUTPUT_HTML_PATH,
} from "@/lib/repo-image/prompt";
import { renderHtmlToImages } from "@/lib/repo-image/render";
import { configureLongFetchTimeouts } from "@/lib/repo-image/undici-dispatcher";
import { shortSha } from "@/lib/repo-image/utils";
import {
  getDecryptedToken,
  getGitHubIntegrationById,
  validateRepositoryBranchExists,
} from "@/lib/services/github-integration";
import type {
  GenerateRepoImageInput,
  GenerateRepoImageResult,
  RepoImageSourceContext,
} from "@/types/repo-image";

const AGENT_TIMEOUT_MS = 480_000;

export class RepoImageError extends Error {
  readonly code: "missing_config" | "agent_failed";

  constructor(code: "missing_config" | "agent_failed", message: string) {
    super(message);
    this.name = "RepoImageError";
    this.code = code;
  }
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
    const prNumber = params.prNumber as number;
    const [{ data: pr }, { data: files }] = await Promise.all([
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

  const sha = params.commitSha as string;
  const { data: commit } = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}",
    {
      owner,
      repo,
      ref: sha,
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    }
  );

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
}): Promise<GenerateRepoImageResult> {
  const { input, userId } = params;

  configureLongFetchTimeouts();

  if (!process.env.UPSTASH_BOX_API_KEY) {
    throw new RepoImageError(
      "missing_config",
      "UPSTASH_BOX_API_KEY is not configured"
    );
  }

  const integration = await getGitHubIntegrationById(input.integrationId);
  if (!integration || integration.organizationId !== input.organizationId) {
    throw new RepoImageError("missing_config", "Integration not found");
  }

  const repository = integration.repositories[0];
  if (!repository) {
    throw new RepoImageError(
      "missing_config",
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

  const box = await Box.create({
    apiKey: process.env.UPSTASH_BOX_API_KEY,
    runtime: "node",
    git: {
      ...(token ? { token } : {}),
      userName: "notra-bot",
      userEmail: "bot@usenotra.com",
    },
    agent: {
      harness: Agent.OpenCode,
      model: "openrouter/anthropic/claude-sonnet-4-6",
    },
    timeout: AGENT_TIMEOUT_MS,
  });

  let html: string;

  try {
    await box.git.clone({
      repo: `https://github.com/${repository.owner}/${repository.repo}.git`,
      branch: input.branch,
    });

    const stream = await box.agent.stream({
      prompt: buildExtractionPrompt({
        owner: repository.owner,
        repo: repository.repo,
        branch: input.branch,
        source,
      }),
      timeout: AGENT_TIMEOUT_MS,
    });

    for await (const chunk of stream) {
      if (chunk.type === "tool-call") {
        console.log(`[repo-image] tool: ${chunk.toolName}`);
      }
    }

    const existsRun = await box.exec.command(
      `test -f ${REPO_IMAGE_OUTPUT_HTML_PATH} && echo ok || echo missing`
    );
    if (existsRun.result.trim() !== "ok") {
      const diag = await box.exec.command(
        `ls -la /workspace/home/ 2>&1 | head -50; echo ---; find /workspace/home -maxdepth 4 -name "output.html" 2>/dev/null`
      );
      console.error("[repo-image] missing output.html, /workspace/home contents:\n", diag.result);
      throw new RepoImageError(
        "agent_failed",
        `Agent did not produce ${REPO_IMAGE_OUTPUT_HTML_PATH}`
      );
    }

    html = await box.files.read(REPO_IMAGE_OUTPUT_HTML_PATH);
  } finally {
    await box.delete().catch((error: unknown) => {
      console.error("Failed to delete repo-image box", error);
    });
  }

  const { svg, pngBase64 } = await renderHtmlToImages(html);

  return { pngBase64, svg, html };
}
