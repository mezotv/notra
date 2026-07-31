import { Effect } from "effect";
import { type NextRequest, NextResponse } from "next/server";
import { SOCIAL_CONNECTED_PARAMS } from "@/constants/social-connect";
import { getServerSession } from "@/lib/auth/session";
import { fromProviderPlatform } from "@/lib/social-connect/client";
import { completeSocialConnect } from "@/lib/social-connect/connect";
import { socialConnectCallbackQuerySchema } from "@/schemas/social-accounts";

function readAccountIds(searchParams: URLSearchParams): string[] {
  const accountIds: string[] = [];
  for (const value of searchParams.getAll("accountIds")) {
    for (const part of value.split(",")) {
      const trimmed = part.trim();
      if (trimmed) {
        accountIds.push(trimmed);
      }
    }
  }
  return accountIds;
}

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { searchParams } = new URL(request.url);
  const parsed = socialConnectCallbackQuerySchema.safeParse({
    provider: searchParams.get("provider") ?? undefined,
    isSuccess: searchParams.get("isSuccess") ?? undefined,
    accountIds: readAccountIds(searchParams),
    error: searchParams.get("error") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid_callback`);
  }

  const failed =
    parsed.data.error ||
    parsed.data.isSuccess === "false" ||
    parsed.data.accountIds.length === 0;

  if (failed) {
    return NextResponse.redirect(`${baseUrl}/?error=connection_failed`);
  }

  const { user } = await getServerSession({ headers: request.headers });

  try {
    const result = await Effect.runPromise(
      completeSocialConnect({
        accountIds: parsed.data.accountIds,
        platform: parsed.data.provider
          ? fromProviderPlatform(parsed.data.provider)
          : null,
        userId: user?.id ?? null,
      }).pipe(
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

    if (result.selectionToken) {
      const selectionUrl = new URL("/connect/linkedin", baseUrl);
      selectionUrl.searchParams.set("token", result.selectionToken);
      return NextResponse.redirect(selectionUrl.toString());
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
