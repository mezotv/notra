import { Effect } from "effect";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { GITHUB_CONNECTION_REQUIRED_MESSAGE } from "@/lib/star-video/github-cookies";
import {
  clearGithubCookies,
  readGithubToken,
} from "@/lib/star-video/github-oauth";
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
  const githubToken = readGithubToken(request);
  if (!githubToken) {
    return NextResponse.json(
      { error: GITHUB_CONNECTION_REQUIRED_MESSAGE },
      { status: 401 }
    );
  }

  const result = await loadRepoStarData(owner, repo, id, githubToken);
  if (!result.ok) {
    if (result.kind === "unauthorized") {
      const response = NextResponse.json(
        { error: GITHUB_CONNECTION_REQUIRED_MESSAGE },
        { status: 401 }
      );
      clearGithubCookies(response);
      return response;
    }
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

  return NextResponse.json(result.data);
}
