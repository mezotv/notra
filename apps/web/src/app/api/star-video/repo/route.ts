import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getCachedRepoStarData,
  setCachedRepoStarData,
} from "@/lib/star-video/cache";
import { enforceStarVideoRateLimit } from "@/lib/star-video/ratelimit";
import { fetchRepoStarData } from "@/lib/star-video/stargazers";
import { repoQuerySchema } from "@/schemas/star-video";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = repoQuerySchema.safeParse({
    owner: searchParams.get("owner") ?? "",
    repo: searchParams.get("repo") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid repository" },
      { status: 400 }
    );
  }

  const { owner, repo } = parsed.data;
  const id = `${owner}/${repo}`.toLowerCase();

  return Effect.runPromise(
    Effect.gen(function* () {
      yield* enforceStarVideoRateLimit(request, "lookup");

      const cached = yield* getCachedRepoStarData(id);
      if (cached) {
        return NextResponse.json(cached);
      }

      const data = yield* fetchRepoStarData(owner, repo);
      yield* setCachedRepoStarData(data.id, data);

      return NextResponse.json(data);
    }).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error._tag === "StarVideoRateLimitExceeded") {
            return NextResponse.json(
              { error: "Too many requests. Please try again shortly." },
              { status: 429 }
            );
          }
          return NextResponse.json(
            { error: "Repository not found or GitHub is unavailable." },
            { status: 404 }
          );
        },
        onSuccess: (response) => response,
      })
    )
  );
}
