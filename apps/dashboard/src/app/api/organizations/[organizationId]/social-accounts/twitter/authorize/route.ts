import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { redis } from "@/lib/redis";

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

    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Twitter OAuth is not configured" },
        { status: 500 }
      );
    }

    if (!redis) {
      return NextResponse.json(
        { error: "Redis is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const callbackPath = searchParams.get("callbackPath") ?? "/";

    const state = crypto.randomUUID();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const baseUrl =
      process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
    const redirectUri = `${baseUrl}/api/social-accounts/twitter/callback`;

    await redis.set(
      `twitter_oauth:${state}`,
      JSON.stringify({
        organizationId,
        codeVerifier,
        callbackPath,
      }),
      { ex: 600 }
    );

    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set(
      "scope",
      "tweet.read tweet.write users.read offline.access"
    );
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    return NextResponse.json({ url: authUrl.toString() });
  } catch (error) {
    console.error("Error initiating Twitter OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Twitter OAuth" },
      { status: 500 }
    );
  }
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
