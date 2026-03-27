import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const callbackPath = searchParams.get("callbackPath") ?? "/";

    if (!organizationId) {
      return NextResponse.redirect(`${baseUrl}/?error=missing_organization`);
    }

    const { session } = await getServerSession({ headers: request.headers });
    if (!session?.userId) {
      return NextResponse.redirect(`${baseUrl}/?error=not_authenticated`);
    }

    const clientId = process.env.LINEAR_CLIENT_ID;
    if (!clientId || !redis) {
      return NextResponse.redirect(`${baseUrl}/?error=linear_not_configured`);
    }

    const state = crypto.randomUUID();
    const redirectUri = `${baseUrl}/api/integrations/linear/callback`;

    await redis.set(
      `linear_oauth:${state}`,
      JSON.stringify({
        organizationId,
        userId: session.userId,
        callbackPath,
      }),
      { ex: 600 }
    );

    const authUrl = new URL("https://linear.app/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "read");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "consent");

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Linear OAuth:", error);
    return NextResponse.redirect(`${baseUrl}/?error=linear_auth_failed`);
  }
}
