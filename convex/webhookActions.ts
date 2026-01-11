import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

type RepositoryResult = {
  _id: Id<"githubRepositories">;
  owner: string;
  repo: string;
  enabled: boolean;
  encryptedToken?: string;
  integrationEnabled: boolean;
} | null;

// Action for server-side webhook processing - calls internal query
export const getRepositoryByOwnerRepo = action({
  args: {
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (ctx, args): Promise<RepositoryResult> => {
    const result = await ctx.runQuery(internal.repositories.getByOwnerRepo, {
      owner: args.owner,
      repo: args.repo,
    });
    return result as RepositoryResult;
  },
});

// Action for workflow to set brand analysis progress - calls internal mutation
export const setBrandProgress = action({
  args: {
    organizationId: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"brandAnalysisProgress">> => {
    const result = await ctx.runMutation(internal.brand.setProgress, {
      organizationId: args.organizationId,
      status: args.status,
      progress: args.progress,
      error: args.error,
    });
    return result as Id<"brandAnalysisProgress">;
  },
});
