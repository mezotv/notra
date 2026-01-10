import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

async function getAuthenticatedUser(ctx: { auth: unknown }) {
  const user = await authComponent.getAuthUser(
    ctx as Parameters<typeof authComponent.getAuthUser>[0]
  );
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

async function verifyOrgAccess(
  ctx: { db: unknown },
  userId: string,
  organizationId: string
) {
  const db = ctx.db as {
    query: (table: "members") => {
      withIndex: (
        index: string,
        fn: (q: {
          eq: (
            field: string,
            value: string
          ) => { eq: (field: string, value: string) => unknown };
        }) => unknown
      ) => { first: () => Promise<{ _id: string; role: string } | null> };
    };
  };
  const membership = await db
    .query("members")
    .withIndex("by_user_org", (q) =>
      q.eq("userId", userId).eq("organizationId", organizationId)
    )
    .first();
  if (!membership) {
    throw new Error("You do not have access to this organization");
  }
  return membership;
}

export const listByRepository = query({
  args: {
    repositoryId: v.id("githubRepositories"),
  },
  returns: v.array(
    v.object({
      _id: v.id("repositoryOutputs"),
      _creationTime: v.number(),
      repositoryId: v.id("githubRepositories"),
      outputType: v.string(),
      enabled: v.boolean(),
      config: v.optional(v.any()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) {
      return [];
    }

    const integration = await ctx.db.get(repo.integrationId);
    if (!integration) {
      return [];
    }

    await verifyOrgAccess(ctx, user._id, integration.organizationId);

    return await ctx.db
      .query("repositoryOutputs")
      .withIndex("by_repository", (q) =>
        q.eq("repositoryId", args.repositoryId)
      )
      .collect();
  },
});

export const get = query({
  args: {
    outputId: v.id("repositoryOutputs"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("repositoryOutputs"),
      _creationTime: v.number(),
      repositoryId: v.id("githubRepositories"),
      outputType: v.string(),
      enabled: v.boolean(),
      config: v.optional(v.any()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const output = await ctx.db.get(args.outputId);
    if (!output) {
      return null;
    }

    const repo = await ctx.db.get(output.repositoryId);
    if (!repo) {
      return null;
    }

    const integration = await ctx.db.get(repo.integrationId);
    if (!integration) {
      return null;
    }

    await verifyOrgAccess(ctx, user._id, integration.organizationId);

    return output;
  },
});

export const update = mutation({
  args: {
    outputId: v.id("repositoryOutputs"),
    enabled: v.optional(v.boolean()),
    config: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const output = await ctx.db.get(args.outputId);
    if (!output) {
      throw new Error("Output not found");
    }

    const repo = await ctx.db.get(output.repositoryId);
    if (!repo) {
      throw new Error("Repository not found");
    }

    const integration = await ctx.db.get(repo.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    await verifyOrgAccess(ctx, user._id, integration.organizationId);

    const updates: Partial<{
      enabled: boolean;
      config: unknown;
    }> = {};

    if (args.enabled !== undefined) {
      updates.enabled = args.enabled;
    }
    if (args.config !== undefined) {
      updates.config = args.config;
    }

    await ctx.db.patch(args.outputId, updates);
    return null;
  },
});

export const toggle = mutation({
  args: {
    outputId: v.id("repositoryOutputs"),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const output = await ctx.db.get(args.outputId);
    if (!output) {
      throw new Error("Output not found");
    }

    const repo = await ctx.db.get(output.repositoryId);
    if (!repo) {
      throw new Error("Repository not found");
    }

    const integration = await ctx.db.get(repo.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    await verifyOrgAccess(ctx, user._id, integration.organizationId);

    await ctx.db.patch(args.outputId, {
      enabled: args.enabled,
    });
    return null;
  },
});

export const upsert = mutation({
  args: {
    repositoryId: v.id("githubRepositories"),
    outputType: v.string(),
    enabled: v.boolean(),
    config: v.optional(v.any()),
  },
  returns: v.id("repositoryOutputs"),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) {
      throw new Error("Repository not found");
    }

    const integration = await ctx.db.get(repo.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    await verifyOrgAccess(ctx, user._id, integration.organizationId);

    const existing = await ctx.db
      .query("repositoryOutputs")
      .withIndex("by_repository_type", (q) =>
        q
          .eq("repositoryId", args.repositoryId)
          .eq("outputType", args.outputType)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        config: args.config,
      });
      return existing._id;
    }

    return await ctx.db.insert("repositoryOutputs", {
      repositoryId: args.repositoryId,
      outputType: args.outputType,
      enabled: args.enabled,
      config: args.config,
    });
  },
});
