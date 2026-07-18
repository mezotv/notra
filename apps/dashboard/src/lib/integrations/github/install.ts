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
        if (preparedInstall.requiresReauthorization) {
          const callbackUrl = new URL(
            params.callbackPath,
            window.location.origin
          );
          callbackUrl.searchParams.set("githubReauthorized", "true");

          return Effect.tryPromise({
            try: () =>
              authClient.linkSocial({
                provider: "github",
                scopes: ["read:org"],
                callbackURL: `${callbackUrl.pathname}${callbackUrl.search}`,
              }),
            catch: (cause) => new GitHubInstallStartError({ cause }),
          }).pipe(Effect.as(true));
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
