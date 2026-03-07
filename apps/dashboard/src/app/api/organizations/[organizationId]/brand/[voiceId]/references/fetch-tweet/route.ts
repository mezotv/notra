import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { fetchTweetSchema } from "@/schemas/brand";
import { ratelimit } from "@/utils/ratelimit";
import { fetchTweet } from "@/utils/twitter-fetcher";

interface RouteContext {
  params: Promise<{ organizationId: string; voiceId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, voiceId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);
    if (!auth.success) {
      return auth.response;
    }

    const { success: withinLimit } =
      await ratelimit.fetchTweet.limit(organizationId);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const voice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.id, voiceId),
        eq(brandSettings.organizationId, organizationId)
      ),
      columns: { id: true },
    });
    if (!voice) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = fetchTweetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "A valid URL is required" },
        { status: 400 }
      );
    }

    const tweet = await fetchTweet(result.data.url);
    return NextResponse.json(tweet);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tweet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
