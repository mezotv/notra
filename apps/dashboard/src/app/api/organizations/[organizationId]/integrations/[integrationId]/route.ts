import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import { decryptToken } from "@/lib/crypto/token-encryption";
import { createOctokit } from "@/lib/octokit";
import {
  deleteGitHubIntegration,
  getGitHubIntegrationById,
  updateGitHubIntegration,
  updateRepository,
} from "@/lib/services/github-integration";
import {
  integrationIdParamSchema,
  updateIntegrationBodySchema,
} from "@/schemas/integrations";

interface RouteContext {
  params: Promise<{ organizationId: string; integrationId: string }>;
}

interface ErrorWithStatus {
  status?: number;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, integrationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const paramValidation = integrationIdParamSchema.safeParse({
      integrationId,
    });

    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: paramValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const integration = await getGitHubIntegrationById(integrationId);

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    if (integration.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error fetching integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, integrationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const paramValidation = integrationIdParamSchema.safeParse({
      integrationId,
    });

    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: paramValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const integration = await getGitHubIntegrationById(integrationId);

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    if (integration.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const bodyValidation = updateIntegrationBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: bodyValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const { enabled, displayName, branch } = bodyValidation.data;
    const normalizedBranch =
      branch !== undefined ? branch?.trim() || null : undefined;

    if (normalizedBranch !== undefined) {
      if (integration.repositories.length !== 1) {
        return NextResponse.json(
          {
            error:
              "Branch can only be edited for integrations with a single repository",
          },
          { status: 400 }
        );
      }

      const repository = integration.repositories[0];

      if (!repository) {
        return NextResponse.json(
          { error: "Repository not found" },
          { status: 404 }
        );
      }

      if (normalizedBranch) {
        const token = integration.encryptedToken
          ? decryptToken(integration.encryptedToken)
          : undefined;
        const octokit = createOctokit(token);

        try {
          await octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
            owner: repository.owner,
            repo: repository.repo,
            branch: normalizedBranch,
            headers: {
              "X-GitHub-Api-Version": "2022-11-28",
            },
          });
        } catch (error) {
          const status = (error as ErrorWithStatus).status;

          if (status === 404) {
            return NextResponse.json(
              {
                error: `Branch "${normalizedBranch}" does not exist in ${repository.owner}/${repository.repo}`,
              },
              { status: 400 }
            );
          }

          throw error;
        }
      }

      await updateRepository(repository.id, {
        defaultBranch: normalizedBranch,
      });
    }

    await updateGitHubIntegration(integrationId, {
      enabled,
      displayName,
    });

    const updated = await getGitHubIntegrationById(integrationId);

    if (!updated) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId, integrationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const paramValidation = integrationIdParamSchema.safeParse({
      integrationId,
    });

    if (!paramValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: paramValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const integration = await getGitHubIntegrationById(integrationId);

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    if (integration.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    await deleteGitHubIntegration(integrationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
