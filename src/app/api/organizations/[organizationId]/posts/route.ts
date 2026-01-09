import { desc, eq, lt } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { db } from "@/lib/db/drizzle";
import { posts } from "@/lib/db/schema";

const DEFAULT_LIMIT = 12;

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT;

    const conditions = [eq(posts.organizationId, organizationId)];

    if (cursor) {
      conditions.push(lt(posts.createdAt, new Date(cursor)));
    }

    const results = await db.query.posts.findMany({
      where: (_posts, { and }) => and(...conditions),
      orderBy: [desc(posts.createdAt)],
      limit: limit + 1,
    });

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? items.at(-1)?.createdAt : null;

    return NextResponse.json({
      posts: items.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        markdown: post.markdown,
        contentType: post.contentType,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      nextCursor: nextCursor?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
