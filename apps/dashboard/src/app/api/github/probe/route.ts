import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { createOctokit } from "@/lib/octokit";

const probeRepoRequestSchema = z.object({
  owner: z.string().trim().min(1, "owner is required"),
  repo: z.string().trim().min(1, "repo is required"),
  token: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { session } = await getServerSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = probeRepoRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { owner, repo, token } = validationResult.data;

    const octokit = createOctokit(token || undefined);

    try {
      const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
        owner,
        repo,
        headers: { "X-GitHub-Api-Version": "2022-11-28" },
      });

      return NextResponse.json({
        status: data.private ? "private" : "public",
        defaultBranch: data.default_branch,
        description: data.description,
      });
    } catch (error) {
      const status =
        error instanceof Error && "status" in error
          ? (error as { status: number }).status
          : 500;

      if (status === 404) {
        return NextResponse.json({ status: "not_found" }, { status: 404 });
      }

      if (status === 401 || status === 403) {
        return NextResponse.json(
          { status: "unauthorized" },
          { status: status === 401 ? 401 : 403 }
        );
      }

      return NextResponse.json(
        { error: "Failed to probe repository" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
