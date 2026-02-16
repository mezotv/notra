import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  deleteRepository,
  GitHubBranchNotFoundError,
  getRepositoryById,
  updateRepository,
  validateRepositoryBranchExists,
} from "@/lib/services/github-integration";
import {
  repositoryIdParamSchema,
  updateRepositoryBodySchema,
} from "@/schemas/integrations";

interface RouteContext {
  params: Promise<{ organizationId: string; repositoryId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, repositoryId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const paramValidation = repositoryIdParamSchema.safeParse({ repositoryId });

    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: paramValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const repository = await getRepositoryById(repositoryId);

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    if (repository.integration.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(repository);
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, repositoryId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const paramValidation = repositoryIdParamSchema.safeParse({ repositoryId });

    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: paramValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const repository = await getRepositoryById(repositoryId);

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    if (repository.integration.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const bodyValidation = updateRepositoryBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: bodyValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const { enabled, defaultBranch } = bodyValidation.data;
    const normalizedDefaultBranch =
      defaultBranch !== undefined ? defaultBranch || null : undefined;

    if (normalizedDefaultBranch) {
      try {
        await validateRepositoryBranchExists({
          owner: repository.owner,
          repo: repository.repo,
          branch: normalizedDefaultBranch,
          encryptedToken: repository.integration.encryptedToken,
        });
      } catch (error) {
        if (error instanceof GitHubBranchNotFoundError) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        throw error;
      }
    }

    const updated = await updateRepository(repositoryId, {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(normalizedDefaultBranch !== undefined
        ? { defaultBranch: normalizedDefaultBranch }
        : {}),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, repositoryId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const paramValidation = repositoryIdParamSchema.safeParse({ repositoryId });

    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: paramValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const repository = await getRepositoryById(repositoryId);

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    if (repository.integration.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    await deleteRepository(repositoryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
