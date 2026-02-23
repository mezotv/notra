import { db } from "@notra/db/drizzle";
import { contentTriggers } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  deleteGitHubIntegration,
  GitHubBranchNotFoundError,
  getGitHubIntegrationById,
  updateGitHubIntegration,
  updateRepository,
  validateRepositoryBranchExists,
} from "@/lib/services/github-integration";
import { deleteQstashSchedule } from "@/lib/triggers/qstash";
import {
  integrationIdParamSchema,
  triggerTargetsSchema,
  updateIntegrationBodySchema,
} from "@/schemas/integrations";

interface RouteContext {
  params: Promise<{ organizationId: string; integrationId: string }>;
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

    // Check if caller wants to know about affected schedules
    const { searchParams } = new URL(request.url);
    const checkSchedules = searchParams.get("checkSchedules") === "true";

    if (checkSchedules) {
      const allSchedules = await db.query.contentTriggers.findMany({
        where: and(
          eq(contentTriggers.organizationId, organizationId),
          eq(contentTriggers.sourceType, "cron")
        ),
      });

      const affectedSchedules = allSchedules.filter((schedule) => {
        const parsed = triggerTargetsSchema.safeParse(schedule.targets);
        if (!parsed.success) return false;
        return parsed.data.repositoryIds.includes(integrationId);
      });

      return NextResponse.json({
        ...integration,
        affectedSchedules: affectedSchedules.map((s) => ({
          id: s.id,
          name: s.name,
          enabled: s.enabled,
        })),
      });
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
    const normalizedBranch = branch !== undefined ? branch || null : undefined;

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
        try {
          await validateRepositoryBranchExists({
            owner: repository.owner,
            repo: repository.repo,
            branch: normalizedBranch,
            encryptedToken: integration.encryptedToken,
          });
        } catch (error) {
          if (error instanceof GitHubBranchNotFoundError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
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

    // Find all schedules that use this integration
    const allSchedules = await db.query.contentTriggers.findMany({
      where: and(
        eq(contentTriggers.organizationId, organizationId),
        eq(contentTriggers.sourceType, "cron")
      ),
    });

    const affectedSchedules = allSchedules.filter((schedule) => {
      const parsed = triggerTargetsSchema.safeParse(schedule.targets);
      if (!parsed.success) return false;
      return parsed.data.repositoryIds.includes(integrationId);
    });

    // Disable affected schedules and delete their qstash schedules
    for (const schedule of affectedSchedules) {
      if (schedule.qstashScheduleId) {
        await deleteQstashSchedule(schedule.qstashScheduleId).catch((err) => {
          console.error(
            `Failed to delete qstash schedule ${schedule.qstashScheduleId}:`,
            err
          );
        });
      }

      await db
        .update(contentTriggers)
        .set({
          enabled: false,
          qstashScheduleId: null,
          updatedAt: new Date(),
        })
        .where(eq(contentTriggers.id, schedule.id));
    }

    await deleteGitHubIntegration(integrationId);

    return NextResponse.json({
      success: true,
      disabledSchedules: affectedSchedules.map((s) => ({
        id: s.id,
        name: s.name,
      })),
    });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
