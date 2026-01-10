import { v } from "convex/values";
import { query } from "./_generated/server";
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

export const list = query({
  args: {
    organizationId: v.string(),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await verifyOrgAccess(ctx, user._id, args.organizationId);

    const page = args.page ?? 1;
    const pageSize = args.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const logs = await ctx.db
      .query("webhookLogs")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();

    const totalCount = logs.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedLogs = logs.slice(skip, skip + pageSize);

    return {
      logs: paginatedLogs.map((log) => ({
        id: log._id,
        organizationId: log.organizationId,
        status: log.status,
        method: log.method,
        path: log.path,
        payload: log.payload,
        response: log.response,
        createdAt: new Date(log._creationTime).toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  },
});
