import { GitHubBranchNotFoundError } from "@notra/ai/integrations/github";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { baseProcedure } from "@/lib/orpc/base";
import {
  badRequest,
  internalServerError,
  notFound,
} from "@/lib/orpc/utils/errors";
import { generateRepoImage, RepoImageError } from "@/lib/services/repo-image";
import { generateRepoImageInputSchema } from "@/schemas/repo-image";

export const repoImageRouter = {
  generate: baseProcedure
    .input(generateRepoImageInputSchema)
    .handler(async ({ context, input }) => {
      const auth = await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      try {
        return await generateRepoImage({
          input,
          userId: auth.user.id,
        });
      } catch (error) {
        if (error instanceof GitHubBranchNotFoundError) {
          throw badRequest(error.message);
        }
        if (error instanceof RepoImageError) {
          if (error.code === "not_found") {
            throw notFound(error.message);
          }
          if (
            error.code === "missing_config" ||
            error.code === "agent_failed"
          ) {
            throw internalServerError(error.message, error);
          }
          throw badRequest(error.message);
        }
        throw internalServerError("Failed to generate repo image", error);
      }
    }),
};
