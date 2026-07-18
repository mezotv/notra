"use client";

import { Data, Effect } from "effect";
import { authClient } from "@/lib/auth/client";
import { dashboardOrpc } from "@/lib/orpc/query";
import { openGitHubInstallTab } from "./tab";

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

export function startGitHubInstall(params: {
  organizationId: string;
  callbackPath: string;
}) {
  return Effect.runPromise(
    Effect.tryPromise({
      try: () => dashboardOrpc.github.app.prepareInstallUrl.call(params),
      catch: (cause) => new GitHubInstallStartError({ cause }),
    }).pipe(
      Effect.flatMap((preparedInstall) => {
        if (preparedInstall.requiresAccountConnection) {
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
          openGitHubInstallTab(preparedInstall.url);
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
