import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { marked } from "marked";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { updateContentSchema } from "@/schemas/content";

const TITLE_REGEX = /^#\s+(.+)$/m;

interface RouteContext {
  params: Promise<{ organizationId: string; contentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, contentId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, contentId),
        eq(posts.organizationId, organizationId)
      ),
    });

    if (!post) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({
      content: {
        id: post.id,
        title: post.title,
        content: post.content,
        markdown: post.markdown,
        contentType: post.contentType,
        status: post.status,
        date: post.createdAt.toISOString(),
        sourceMetadata: post.sourceMetadata ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, contentId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const validationResult = updateContentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }
    const { title, markdown, status } = validationResult.data;

    const existingPost = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, contentId),
        eq(posts.organizationId, organizationId)
      ),
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (title !== undefined) {
      updateData.title = title;
    }

    if (markdown !== undefined) {
      const titleMatch = markdown.match(TITLE_REGEX);
      updateData.markdown = markdown;
      if (title === undefined) {
        updateData.title = titleMatch?.[1] ?? existingPost.title;
      }
      updateData.content = await marked.parse(markdown);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const [updatedPost] = await db
      .update(posts)
      .set(updateData)
      .where(
        and(eq(posts.id, contentId), eq(posts.organizationId, organizationId))
      )
      .returning();

    if (!updatedPost) {
      return NextResponse.json(
        { error: "Failed to update content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.content,
        markdown: updatedPost.markdown,
        contentType: updatedPost.contentType,
        status: updatedPost.status,
        date: updatedPost.createdAt.toISOString(),
        sourceMetadata: updatedPost.sourceMetadata ?? null,
      },
    });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, contentId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const existingPost = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, contentId),
        eq(posts.organizationId, organizationId)
      ),
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    await db
      .delete(posts)
      .where(
        and(eq(posts.id, contentId), eq(posts.organizationId, organizationId))
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
