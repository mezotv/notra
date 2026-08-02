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
  id: string,
  token?: string
): Promise<LoadRepoResult> {
  const inflightKey = token ? `${id}:user` : id;
  const existing = inflight.get(inflightKey);
  if (existing) {
    return existing;
  }

  const promise = Effect.runPromise(
    fetchRepoStarData(owner, repo, token).pipe(
      Effect.match({
        onSuccess: (data): LoadRepoResult => ({ ok: true, data }),
        onFailure: (error): LoadRepoResult => ({
          ok: false,
          kind: error._tag === "RepoUnavailable" ? "unavailable" : "not-found",
        }),
      })
    )
  );

  inflight.set(inflightKey, promise);
  promise.finally(() => {
    inflight.delete(inflightKey);
  });
  return promise;
}
