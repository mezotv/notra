"use client";

import { Data, Effect } from "effect";
import { authClient } from "@/lib/auth/client";
import { dashboardOrpc } from "@/lib/orpc/query";

class GitHubInstallStartError extends Data.TaggedError(
  "GitHubInstallStartError"
)<{
  readonly cause: unknown;
}> {}

function authorizeGitHub(callbackURL: string, scopes?: string[]) {
  return Effect.tryPromise({
    try: () =>
      authClient.linkSocial({
        provider: "github",
        callbackURL,
        ...(scopes ? { scopes } : {}),
      }),
    catch: (cause) => new GitHubInstallStartError({ cause }),
  }).pipe(
    Effect.flatMap((result) =>
      result.error
        ? Effect.fail(new GitHubInstallStartError({ cause: result.error }))
        : Effect.succeed(true)
    )
  );
}

export function reauthorizeGitHub(callbackURL: string) {
  return Effect.runPromise(
    authorizeGitHub(callbackURL, ["read:org"]).pipe(
      Effect.match({
        onFailure: () => false,
        onSuccess: () => true,
      })
    )
  );
}

function reauthorizationAttemptKey(state: string) {
  return `notra:github-reauthorize-attempted:${state}`;
}

export function hasAttemptedGitHubReauthorization(state: string) {
  return (
    window.sessionStorage.getItem(reauthorizationAttemptKey(state)) !== null
  );
}

export function markGitHubReauthorizationAttempted(state: string) {
  window.sessionStorage.setItem(reauthorizationAttemptKey(state), "true");
}

export function startGitHubInstall(params: {
  organizationId: string;
  callbackPath: string;
  allowAccountConnection?: boolean;
}) {
  const allowAccountConnection = params.allowAccountConnection ?? true;

  return Effect.runPromise(
    Effect.tryPromise({
      try: () =>
        dashboardOrpc.github.app.prepareInstallUrl.call({
          organizationId: params.organizationId,
          callbackPath: params.callbackPath,
        }),
      catch: (cause) => new GitHubInstallStartError({ cause }),
    }).pipe(
      Effect.flatMap((preparedInstall) => {
        if (preparedInstall.requiresAccountConnection) {
          if (!allowAccountConnection) {
            return Effect.fail(
              new GitHubInstallStartError({
                cause: new Error("GitHub account connection did not complete"),
              })
            );
          }

          const callbackUrl = new URL(
            params.callbackPath,
            window.location.origin
          );
          callbackUrl.searchParams.set("githubAccountConnected", "true");

          return authorizeGitHub(
            `${callbackUrl.pathname}${callbackUrl.search}`
          );
        }

        return Effect.sync(() => {
          window.location.assign(preparedInstall.url);
          return true;
        });
      }),
      Effect.match({
        onFailure: () => false,
        onSuccess: () => true,
      })
    )
  );
}
