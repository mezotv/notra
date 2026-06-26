"use client";

import { Data, Effect } from "effect";
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
      Effect.map(({ url }) => {
        openGitHubInstallTab(url);
        return true;
      }),
      Effect.match({
        onFailure: () => false,
        onSuccess: () => true,
      })
    )
  );
}
