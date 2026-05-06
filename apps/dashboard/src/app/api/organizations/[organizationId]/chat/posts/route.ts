import { contentTypeSchema } from "@notra/ai/schemas/content";
import { supportsPostSlug } from "@notra/ai/schemas/post";
import { sanitizeMarkdownHtml } from "@notra/ai/utils/sanitize";
import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { marked } from "marked";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing.
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";

const createChatPostSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).nullable().optional(),
  markdown: z.string().trim().min(1),
  contentType: contentTypeSchema,
  status: z.enum(["draft", "published"]),
});

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { organizationId } = await params;

  await assertOrganizationAccess({
    headers: request.headers,
    organizationId,
  });

  const parsed = createChatPostSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid post payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { title, contentType, markdown, status } = parsed.data;
  const slug =
    supportsPostSlug(contentType) && parsed.data.slug ? parsed.data.slug : null;
  const content = sanitizeMarkdownHtml(await marked.parse(markdown));
  const id = nanoid();

  await db.insert(posts).values({
    id,
    organizationId,
    title,
    slug,
    content,
    markdown,
    contentType,
    status,
    sourceMetadata: null,
  });

  return NextResponse.json({ postId: id, status });
}
