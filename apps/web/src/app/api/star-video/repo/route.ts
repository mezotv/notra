import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getCachedRepoStarData,
  setCachedRepoStarData,
} from "@/lib/star-video/cache";
import { loadRepoStarData } from "@/lib/star-video/load-repo";
import { enforceStarVideoRateLimit } from "@/lib/star-video/ratelimit";
import { repoQuerySchema } from "@/schemas/star-video";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

  const rateLimited = await Effect.runPromise(
    enforceStarVideoRateLimit(request, "lookup").pipe(
      Effect.match({ onSuccess: () => false, onFailure: () => true })
    )
  );
  if (rateLimited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const { owner, repo } = parsed.data;
  const id = `${owner}/${repo}`.toLowerCase();

  const cached = await Effect.runPromise(getCachedRepoStarData(id));
  if (cached) {
    return NextResponse.json(cached);
  }

  const result = await loadRepoStarData(owner, repo, id);
  if (!result.ok) {
    if (result.kind === "unavailable") {
      return NextResponse.json(
        { error: "GitHub is unavailable right now. Please try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Repository not found." },
      { status: 404 }
    );
  }

  await Effect.runPromise(setCachedRepoStarData(result.data.id, result.data));
  return NextResponse.json(result.data);
}
