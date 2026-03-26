import { createOctokit } from "@notra/ai/utils/octokit";
import { z } from "zod";
import { authorizedProcedure } from "@/lib/orpc/base";
import { badRequest, internalServerError } from "@/lib/orpc/utils/errors";

const probeRepositoryInputSchema = z.object({
  owner: z.string().trim().min(1, "owner is required"),
  repo: z.string().trim().min(1, "repo is required"),
  token: z.string().trim().optional(),
});

export const githubRouter = {
  probeRepository: authorizedProcedure
    .input(probeRepositoryInputSchema)
    .handler(async ({ input }) => {
      const octokit = createOctokit(input.token || undefined);

      try {
        const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
          owner: input.owner,
          repo: input.repo,
          headers: { "X-GitHub-Api-Version": "2022-11-28" },
        });

        return {
          defaultBranch: data.default_branch,
          description: data.description,
          status: data.private ? "private" : "public",
        };
      } catch (error) {
        const status =
          error instanceof Error && "status" in error
            ? (error as { status: number }).status
            : 500;

        if (status === 404) {
          throw badRequest("Repository not found", { status: "not_found" });
        }

        if (status === 401 || status === 403) {
          throw badRequest("Repository access denied", {
            status: "unauthorized",
          });
        }

        throw internalServerError("Failed to probe repository", error);
      }
    }),
};
