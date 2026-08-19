import { getWorkOS, saveSession } from "@workos-inc/authkit-nextjs";
import { Effect } from "effect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { SOCIAL_AUTH_STATE_COOKIE } from "@/constants/social-auth";
import { UserSyncError, WorkOSAuthError } from "@/lib/auth/errors";
import { authenticateResolvingOrgSelection } from "@/lib/auth/org-selection";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { syncAuthenticatedUser } from "@/lib/auth/sync";
import { readWorkOSError } from "@/lib/auth/workos-error";

const VERIFICATION_REQUIRED_CODE = "email_verification_required";

interface SocialCallbackOutcome {
  kind: "success" | "failed" | "verification-required";
  pendingAuthenticationToken?: string;
  email?: string;
}

const exchangeSocialCode = Effect.fn("auth.social.exchangeCode")(function* (
  code: string
) {
  const response = yield* authenticateResolvingOrgSelection(() =>
    getWorkOS().userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID ?? "",
      code,
    })
  );

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

const mapFailure = (error: WorkOSAuthError | UserSyncError) => {
  if (error instanceof WorkOSAuthError) {
    const info = readWorkOSError(error.error);

    if (
      info.code === VERIFICATION_REQUIRED_CODE &&
      info.pendingAuthenticationToken
    ) {
      const outcome: SocialCallbackOutcome = {
        kind: "verification-required",
        pendingAuthenticationToken: info.pendingAuthenticationToken,
        email: info.email ?? undefined,
      };
      return Effect.succeed(outcome);
    }
  }

  return Effect.logWarning("Social sign-in failed").pipe(
    Effect.annotateLogs({
      error:
        error instanceof WorkOSAuthError
          ? readWorkOSError(error.error).message
          : error.message,
    }),
    Effect.as<SocialCallbackOutcome>({ kind: "failed" })
  );
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const expectedNonce = cookieStore.get(SOCIAL_AUTH_STATE_COOKIE)?.value;
  cookieStore.delete(SOCIAL_AUTH_STATE_COOKIE);

  const separatorIndex = state?.indexOf(":") ?? -1;
  const stateNonce =
    separatorIndex === -1 ? state : (state?.slice(0, separatorIndex) ?? null);
  const stateReturnTo =
    separatorIndex === -1 ? null : (state?.slice(separatorIndex + 1) ?? null);

  if (!(expectedNonce && stateNonce) || expectedNonce !== stateNonce) {
    redirect("/login?error=social-sign-in-failed");
  }

  const outcome = await Effect.runPromise(
    exchangeSocialCode(code).pipe(
      Effect.as<SocialCallbackOutcome>({ kind: "success" }),
      Effect.catch(mapFailure)
    )
  );

  const returnTo = sanitizeReturnTo(stateReturnTo) ?? "/callback";

  if (outcome.kind === "verification-required") {
    const params = new URLSearchParams({
      verify: outcome.pendingAuthenticationToken ?? "",
      returnTo,
    });
    if (outcome.email) {
      params.set("email", outcome.email);
    }
    redirect(`/login?${params.toString()}`);
  }

  if (outcome.kind === "failed") {
    redirect("/login?error=social-sign-in-failed");
  }

  redirect(returnTo);
}
