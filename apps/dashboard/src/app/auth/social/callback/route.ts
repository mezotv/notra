import { getWorkOS, saveSession } from "@workos-inc/authkit-nextjs";
import { Effect } from "effect";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { UserSyncError, WorkOSAuthError } from "@/lib/auth/errors";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { syncAuthenticatedUser } from "@/lib/auth/sync";
import { readWorkOSError } from "@/lib/auth/workos-error";

const exchangeSocialCode = Effect.fn("auth.social.exchangeCode")(function* (
  code: string
) {
  const response = yield* Effect.tryPromise({
    try: () =>
      getWorkOS().userManagement.authenticateWithCode({
        clientId: process.env.WORKOS_CLIENT_ID ?? "",
        code,
      }),
    catch: (error) => new WorkOSAuthError({ error }),
  });

  yield* Effect.tryPromise({
    try: () =>
      saveSession(response, process.env.APP_URL ?? "http://localhost:3000"),
    catch: (cause) =>
      new UserSyncError({ message: "Failed to persist session", cause }),
  });

  yield* syncAuthenticatedUser({
    workosUser: response.user,
    oauthTokens: response.oauthTokens,
    authenticationMethod: response.authenticationMethod,
  });
});

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code) {
    redirect("/login");
  }

  const succeeded = await Effect.runPromise(
    exchangeSocialCode(code).pipe(
      Effect.as(true),
      Effect.catch((error) =>
        Effect.logWarning("Social sign-in failed").pipe(
          Effect.annotateLogs({
            error:
              error instanceof WorkOSAuthError
                ? readWorkOSError(error.error).message
                : error.message,
          }),
          Effect.as(false)
        )
      )
    )
  );

  if (!succeeded) {
    redirect("/login?error=social-sign-in-failed");
  }

  redirect(sanitizeReturnTo(state) ?? "/callback");
}
