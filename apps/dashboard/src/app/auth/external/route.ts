import { Effect } from "effect";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import {
  completeExternalLogin,
  describeExternalLoginError,
} from "@/lib/auth/external-login";
import { getAuthSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const externalAuthId = request.nextUrl.searchParams.get("external_auth_id");

  if (!externalAuthId) {
    redirect("/login");
  }

  const session = await getAuthSession();

  if (!session) {
    const returnTo = `/auth/external?external_auth_id=${encodeURIComponent(externalAuthId)}`;
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const outcome = await Effect.runPromise(
    completeExternalLogin(externalAuthId, session.user).pipe(
      Effect.map((redirectUri) => ({ redirectUri, error: null })),
      Effect.catch((error) =>
        Effect.logWarning("External login completion failed").pipe(
          Effect.annotateLogs({
            userId: session.user.id,
            error: describeExternalLoginError(error),
          }),
          Effect.as({ redirectUri: null, error: "external-login-failed" })
        )
      )
    )
  );

  if (!outcome.redirectUri) {
    redirect("/login?error=external-login-failed");
  }

  redirect(outcome.redirectUri);
}
