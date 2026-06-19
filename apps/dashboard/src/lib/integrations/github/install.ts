"use client";

import { Data, Effect } from "effect";
import { dashboardOrpc } from "@/lib/orpc/query";
import { openGitHubInstallPopup } from "./popup";

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
        return openGitHubInstallPopup(url);
      }),
      Effect.match({
        onFailure: () => false,
        onSuccess: () => true,
      })
    )
  );
}
