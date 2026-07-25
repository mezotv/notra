import { Effect } from "effect";
import { type NextRequest, NextResponse } from "next/server";
import { SOCIAL_CONNECTED_PARAMS } from "@/constants/social-connect";
import { completeSocialConnect } from "@/lib/social-connect/connect";
import { socialConnectCallbackQuerySchema } from "@/schemas/social-accounts";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { searchParams } = new URL(request.url);
  const parsed = socialConnectCallbackQuerySchema.safeParse({
    state: searchParams.get("state") ?? undefined,
    accountId: searchParams.get("accountId") ?? undefined,
    username: searchParams.get("username") ?? undefined,
    pendingDataToken: searchParams.get("pendingDataToken") ?? undefined,
    error: searchParams.get("error") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
  }

  if (parsed.data.pendingDataToken && !parsed.data.error) {
    const selectionUrl = new URL("/connect/linkedin", baseUrl);
    selectionUrl.searchParams.set("state", parsed.data.state);
    selectionUrl.searchParams.set("token", parsed.data.pendingDataToken);
    return NextResponse.redirect(selectionUrl.toString());
  }

  try {
    const result = await Effect.runPromise(
      completeSocialConnect(parsed.data).pipe(
        Effect.map((value) => ({ status: "connected" as const, ...value })),
        Effect.catch((error) =>
          Effect.succeed({ status: "failed" as const, code: error.code })
        )
      )
    );

    if (result.status === "failed") {
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(result.code)}`
      );
    }

    const rawPath = result.callbackPath || "/";
    const callbackPath =
      rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";
    const separator = callbackPath.includes("?") ? "&" : "?";
    const connectedParam = SOCIAL_CONNECTED_PARAMS[result.platform];

    return NextResponse.redirect(
      `${baseUrl}${callbackPath}${separator}${connectedParam}=true`
    );
  } catch (error) {
    console.error("Error in social connect callback:", error);
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed`);
  }
}
