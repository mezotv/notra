import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import {
  GITHUB_API_BASE,
  README_MAX_LENGTH,
} from "../../../lib/constants/github";
import { githubRepoSchema } from "../../../lib/schemas/github-repo";

export default defineTool({
  description:
    "Fetch a public GitHub repository's metadata and README to research the customer's product during onboarding.",
  inputSchema: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
  }),
  async execute({ owner, repo }) {
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "user-agent": "notra-onboarding-agent",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const repoResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
      { headers }
    );
    if (!repoResponse.ok) {
      throw new Error(
        `GitHub repository request for ${owner}/${repo} failed with status ${repoResponse.status}`
      );
    }
    const repoData = githubRepoSchema.parse(await repoResponse.json());

    const readmeResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
      { headers: { ...headers, accept: "application/vnd.github.raw+json" } }
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
