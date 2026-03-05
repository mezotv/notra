import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { fetchTweetSchema } from "@/schemas/brand";
import { fetchTweet } from "@/utils/twitter-fetcher";

interface RouteContext {
  params: Promise<{ organizationId: string; voiceId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);
    if (!auth.success) {
      return auth.response;
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
