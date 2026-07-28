import { defineTool } from "eve/tools";
import {
  GITHUB_API_BASE,
  README_MAX_LENGTH,
} from "../../../lib/constants/github";
import { githubRepoSchema } from "../../../lib/schemas/github-repo";
import { githubRepositoryInputSchema } from "../../../lib/schemas/research-tools";
import { fetchWithTransientRetry } from "../../../lib/utils/retry";

export default defineTool({
  description:
    "Fetch a public GitHub repository's metadata and README to research the customer's product during onboarding.",
  inputSchema: githubRepositoryInputSchema,
  async execute({ owner, repo }) {
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "user-agent": "notra-onboarding-agent",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const repoResponse = await fetchWithTransientRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
      { headers },
      `GitHub repository lookup for ${owner}/${repo}`
    );
    if (!repoResponse.ok) {
      throw new Error(
        `GitHub repository request for ${owner}/${repo} failed with status ${repoResponse.status}`
      );
    }
    const repoData = githubRepoSchema.parse(await repoResponse.json());

    const readmeResponse = await fetchWithTransientRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
      { headers: { ...headers, accept: "application/vnd.github.raw+json" } },
      `GitHub README lookup for ${owner}/${repo}`
    );
    const readme = readmeResponse.ok
      ? (await readmeResponse.text()).slice(0, README_MAX_LENGTH)
      : null;

    return {
      fullName: repoData.full_name,
      description: repoData.description,
      homepage: repoData.homepage,
      topics: repoData.topics,
      language: repoData.language,
      stars: repoData.stargazers_count,
      readme,
    };
  },
});
