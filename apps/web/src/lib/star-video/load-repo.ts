import { Effect } from "effect";
import type { RepoStarData } from "@/types/star-video";
import { fetchRepoStarData } from "./stargazers";

export type LoadRepoResult =
  | { ok: true; data: RepoStarData }
  | { ok: false; kind: "not-found" | "unavailable" };

const inflight = new Map<string, Promise<LoadRepoResult>>();

export function loadRepoStarData(
  owner: string,
  repo: string,
  id: string
): Promise<LoadRepoResult> {
  const existing = inflight.get(id);
  if (existing) {
    return existing;
  }

  const promise = Effect.runPromise(
    fetchRepoStarData(owner, repo).pipe(
      Effect.match({
        onSuccess: (data): LoadRepoResult => ({ ok: true, data }),
        onFailure: (error): LoadRepoResult => ({
          ok: false,
          kind: error._tag === "RepoUnavailable" ? "unavailable" : "not-found",
        }),
      })
    )
  );

  inflight.set(id, promise);
  promise.finally(() => {
    inflight.delete(id);
  });
  return promise;
}
