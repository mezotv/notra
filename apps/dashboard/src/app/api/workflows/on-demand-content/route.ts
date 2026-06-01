import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { calculateTokenCostCents } from "@notra/ai/billing/token-pricing";
import { getGitHubToolRepositoryContextByIntegrationId } from "@notra/ai/integrations/github";
import { getLinearToolContextByIntegrationId } from "@notra/ai/integrations/linear";
import { getBaseUrl } from "@notra/ai/qstash/triggers";
import { getValidToneProfile } from "@notra/ai/schemas/tone";
import { redis } from "@notra/ai/utils/redis";
import {
  appendContentGenerationJobEvent,
  setContentGenerationJobStatus,
} from "@notra/content-generation/jobs";
import {
  type ContentGenerationWorkflowPayload,
  contentGenerationWorkflowPayloadSchema,
} from "@notra/content-generation/schemas";
import { db } from "@notra/db/drizzle";
import {
  githubIntegrations,
  type PostSourceMetadata,
  postCollections,
  posts,
} from "@notra/db/schema";
import type { WorkflowContext } from "@upstash/workflow";
import { WorkflowAbort } from "@upstash/workflow";
import { serve } from "@upstash/workflow/nextjs";
import { and, count, eq } from "drizzle-orm";
import { createRequestLogger } from "evlog";
import {
  trackScheduledContentCreated,
  trackScheduledContentFailed,
  trackScheduledContentSkipped,
} from "@/lib/databuddy";
import { completeActiveGeneration } from "@/lib/generations/tracking";
import { appendWebhookLog } from "@/lib/webhooks/logging";
import {
  buildDataPointRestrictionInstructions,
  buildSelectedItemsInstructions,
  buildSelectionFilters,
  hasSelectedItemsOutsideTargets,
  refundReservedAiCredit,
  resolveBrandVoiceForManualGeneration,
} from "@/lib/workflows/on-demand/helpers";
import { generateScheduledContent } from "@/lib/workflows/schedule/handlers";
import type { ContentGenerationResult } from "@/lib/workflows/schedule/types";
import {
  formatUtcTodayContext,
  resolveLookbackRange,
} from "@/lib/workflows/shared/lookback";
import type {
  ScheduleBrandSettingsData as BrandSettingsData,
  ScheduleRepositoryData as RepositoryData,
} from "@/types/workflows/workflows";

async function setTrackedJobStatus(
  jobId: string | undefined,
  status: "running" | "completed" | "failed" | "skipped",
  updates?: { postId?: string | null; error?: string | null }
) {
  if (!(jobId && redis)) {
    return;
  }

  await setContentGenerationJobStatus(redis, jobId, status, {
    ...(updates?.postId !== undefined ? { postId: updates.postId } : {}),
    ...(updates?.error !== undefined ? { error: updates.error } : {}),
  });
}

async function appendTrackedJobEvent(
  jobId: string | undefined,
  type:
    | "running"
    | "fetching_repositories"
    | "generating_content"
    | "post_created"
    | "completed"
    | "failed"
    | "skipped",
  message: string,
  metadata?: Record<string, unknown> | null
) {
  if (!(jobId && redis)) {
    return;
  }

  await appendContentGenerationJobEvent(redis, {
    id: crypto.randomUUID(),
    jobId,
    type,
    message,
    createdAt: new Date().toISOString(),
    metadata: metadata ?? null,
  });
}

async function reconcileUnsuccessfulPostCollectionAttempt(params: {
  collectionId: string;
  organizationId: string;
  runId: string;
}) {
  await db.transaction(async (tx) => {
    const [collection] = await tx
      .select({
        completedPostCount: postCollections.completedPostCount,
        expectedPostCount: postCollections.expectedPostCount,
        sourceMetadata: postCollections.sourceMetadata,
      })
      .from(postCollections)
      .where(
        and(
          eq(postCollections.id, params.collectionId),
          eq(postCollections.organizationId, params.organizationId)
        )
      )
      .for("update");

    if (!collection) {
      return;
    }

    const sourceMetadata: Record<string, unknown> =
      collection.sourceMetadata &&
      typeof collection.sourceMetadata === "object" &&
      !Array.isArray(collection.sourceMetadata)
        ? (collection.sourceMetadata as Record<string, unknown>)
        : {};
    const reconciledRunIds = Array.isArray(
      sourceMetadata.reconciledUnsuccessfulRunIds
    )
      ? sourceMetadata.reconciledUnsuccessfulRunIds.filter(
          (value): value is string => typeof value === "string"
        )
      : [];

    if (reconciledRunIds.includes(params.runId)) {
      return;
    }

    const [postCountResult] = await tx
      .select({ value: count() })
      .from(posts)
      .where(
        and(
          eq(posts.collectionId, params.collectionId),
          eq(posts.organizationId, params.organizationId)
        )
      );

    const successfulPostCount = Math.max(
      collection.completedPostCount,
      postCountResult?.value ?? 0
    );
    const expectedAttempts = collection.expectedPostCount ?? 1;

    if (successfulPostCount === 0 && expectedAttempts <= 1) {
      await tx
        .delete(postCollections)
        .where(
          and(
            eq(postCollections.id, params.collectionId),
            eq(postCollections.organizationId, params.organizationId)
          )
        );
      return;
    }

    if (collection.expectedPostCount !== null) {
      await tx
        .update(postCollections)
        .set({
          expectedPostCount: Math.max(
            successfulPostCount,
            collection.expectedPostCount - 1
          ),
          sourceMetadata: {
            ...sourceMetadata,
            reconciledUnsuccessfulRunIds: [...reconciledRunIds, params.runId],
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(postCollections.id, params.collectionId),
            eq(postCollections.organizationId, params.organizationId)
          )
        );
    }
  });
}

export const { POST } = serve<ContentGenerationWorkflowPayload>(
  async (context: WorkflowContext<ContentGenerationWorkflowPayload>) => {
    const parseResult = contentGenerationWorkflowPayloadSchema.safeParse(
      context.requestPayload
    );
    if (!parseResult.success) {
      console.error(
        "[OnDemandContent] Invalid payload:",
        parseResult.error.flatten()
      );
      await context.cancel();
      return;
    }

    const {
      organizationId,
      userId,
      collectionId,
      runId,
      jobId,
      contentType,
      lookbackWindow,
      repositoryIds,
      brandVoiceId,
      dataPoints,
      selectedItems,
      linearIntegrationIds,
      aiCreditReserved,
      aiCreditMarkup,
      source,
    } = parseResult.data;

    await context.run("mark-job-running", async () => {
      await setTrackedJobStatus(jobId, "running");
      await appendTrackedJobEvent(
        jobId,
        "running",
        `Started ${contentType.replaceAll("_", " ")} generation`
      );
    });

    await context.run("log-fetching-repositories", async () => {
      await appendTrackedJobEvent(
        jobId,
        "fetching_repositories",
        "Resolving repository sources"
      );
    });

    const repositories = await context.run<RepositoryData[]>(
      "fetch-repositories",
      async () => {
        const repos = await db
          .select({
            id: githubIntegrations.id,
            owner: githubIntegrations.owner,
            repo: githubIntegrations.repo,
            defaultBranch: githubIntegrations.defaultBranch,
          })
          .from(githubIntegrations)
          .where(
            and(
              eq(githubIntegrations.organizationId, organizationId),
              eq(githubIntegrations.enabled, true)
            )
          );

        const validRepos = repos.filter(
          (repo): repo is RepositoryData => !!(repo.owner && repo.repo)
        );

        if (repositoryIds !== undefined) {
          if (repositoryIds.length === 0) {
            return [];
          }

          const requestedIds = new Set(repositoryIds);
          return validRepos.filter((repo) => requestedIds.has(repo.id));
        }

        if (linearIntegrationIds && linearIntegrationIds.length > 0) {
          return [];
        }

        return validRepos;
      }
    );

    const hasLinearSources =
      dataPoints.includeLinearData &&
      linearIntegrationIds &&
      linearIntegrationIds.length > 0;

    if (repositories.length === 0 && !hasLinearSources) {
      console.error(
        "[OnDemandContent] No valid data sources found, canceling",
        { organizationId }
      );
      await context.run("complete-no-sources", async () => {
        await completeActiveGeneration(organizationId, {
          runId,
          triggerId: "manual_on_demand",
          outputType: contentType,
          triggerName: contentType,
          status: "failed",
          reason: "No valid data sources found",
          completedAt: new Date().toISOString(),
          source,
        });
      });
      await context.run("refund-no-sources", async () => {
        await refundReservedAiCredit(organizationId, aiCreditReserved, {
          source: "manual",
          output_type: contentType,
          trigger_id: "manual_on_demand",
          trigger_name: contentType,
          refund_reason: "no_sources",
          run_id: runId,
        });
      });
      await context.run("track-content-failed-no-sources", async () => {
        try {
          await trackScheduledContentFailed({
            triggerId: "manual_on_demand",
            organizationId,
            outputType: contentType,
            creationMode: "manual",
            reason: "No valid data sources found",
            lookbackWindow,
            repositoryCount: 0,
            source: "on_demand",
          });
        } catch (trackingError) {
          console.error(
            "[OnDemandContent] Failed to track no-sources failure",
            {
              organizationId,
              contentType,
              error: trackingError,
            }
          );
        }
      });
      await context.run("cleanup-post-collection-no-sources", async () => {
        await reconcileUnsuccessfulPostCollectionAttempt({
          collectionId,
          organizationId,
          runId,
        });
      });
      await context.cancel();
      return;
    }

    const brand = await context.run<BrandSettingsData>(
      "fetch-brand-settings",
      async () => {
        const result = await resolveBrandVoiceForManualGeneration(
          organizationId,
          brandVoiceId
        );
        if (!result.brand) {
          return null;
        }
        return {
          id: result.brand.id,
          name: result.brand.name,
          toneProfile: result.brand.toneProfile,
          companyName: result.brand.companyName,
          companyDescription: result.brand.companyDescription,
          audience: result.brand.audience,
          customInstructions: result.brand.customInstructions,
          language: result.brand.language,
        };
      }
    );

    try {
      await context.run("log-generating-content", async () => {
        await appendTrackedJobEvent(
          jobId,
          "generating_content",
          "Generating content from repository activity"
        );
      });

      const contentResult = await context.run<ContentGenerationResult>(
        "generate-content",
        async () => {
          const targetRepositoryIds = new Set(
            repositories.map((repo) => repo.id)
          );

          if (
            hasSelectedItemsOutsideTargets(selectedItems, targetRepositoryIds)
          ) {
            return {
              status: "generation_failed",
              reason:
                "Selected items must belong to repositories included in this generation request.",
            };
          }

          const selectionFilters = buildSelectionFilters(
            selectedItems,
            targetRepositoryIds,
            dataPoints
          );

          const lookback = resolveLookbackRange(lookbackWindow);
          const todayUtc = formatUtcTodayContext(lookback.end);

          const restrictionInstructions =
            buildDataPointRestrictionInstructions(dataPoints);
          const selectedItemsInstructions =
            buildSelectedItemsInstructions(selectedItems);
          const customInstructions = [
            brand?.customInstructions?.trim() || "",
            restrictionInstructions || "",
            selectedItemsInstructions || "",
          ]
            .filter((value) => value.length > 0)
            .join("\n\n");

          const sourceMetadata: PostSourceMetadata = {
            triggerId: "manual_on_demand",
            triggerSourceType: "manual",
            repositories: repositories.map((repo) => ({
              owner: repo.owner,
              repo: repo.repo,
            })),
            linearIntegrations: linearIntegrationIds?.map((integrationId) => ({
              integrationId,
            })),
            lookbackWindow,
            lookbackRange: {
              start: lookback.start.toISOString(),
              end: lookback.end.toISOString(),
            },
            brandVoiceName: brand?.name,
            brandVoiceId: brand?.id,
            selectedCommitShas: selectedItems?.commitShas?.length
              ? selectedItems.commitShas
              : undefined,
            selectedPullRequests: selectedItems?.pullRequestNumbers?.length
              ? selectedItems.pullRequestNumbers
              : undefined,
            selectedReleases: selectedItems?.releaseTagNames?.length
              ? selectedItems.releaseTagNames.filter(
                  (
                    item: string | { repositoryId: string; tagName: string }
                  ): item is { repositoryId: string; tagName: string } =>
                    typeof item !== "string"
                )
              : undefined,
            selectedLinearIssues: selectedItems?.linearIssueIds?.length
              ? selectedItems.linearIssueIds
              : undefined,
          };

          const sourceTargetParts = repositories.map(
            (repo) => `${repo.owner}/${repo.repo} (integrationId: ${repo.id})`
          );

          const linearIntegrationRefs =
            hasLinearSources && linearIntegrationIds
              ? linearIntegrationIds.map((id) => ({ integrationId: id }))
              : [];

          for (const ref of linearIntegrationRefs) {
            sourceTargetParts.push(
              `Linear (integrationId: ${ref.integrationId})`
            );
          }

          const sourceTargets = sourceTargetParts.join(", ");

          const log = createRequestLogger({
            method: "POST",
            path: "/api/workflows/on-demand-content",
          });

          log.set({
            feature: "on_demand_content_generation",
            organizationId,
            contentType,
            runId,
            jobId: jobId ?? null,
          });

          try {
            return await generateScheduledContent(contentType, {
              organizationId,
              userId,
              collectionId,
              repositories: repositories.map((repo) => ({
                integrationId: repo.id,
                owner: repo.owner,
                repo: repo.repo,
                defaultBranch: repo.defaultBranch,
              })),
              linearIntegrations: linearIntegrationRefs,
              tone: getValidToneProfile(brand?.toneProfile, "Conversational"),
              promptInput: {
                sourceTargets,
                todayUtc,
                lookbackLabel: lookback.label,
                lookbackStartIso: lookback.start.toISOString(),
                lookbackEndIso: lookback.end.toISOString(),
                companyName: brand?.companyName ?? undefined,
                companyDescription: brand?.companyDescription ?? undefined,
                audience: brand?.audience ?? undefined,
                customInstructions: customInstructions || null,
                language: brand?.language ?? undefined,
              },
              sourceMetadata,
              dataPointSettings: dataPoints,
              selectionFilters,
              commitWindow: {
                since: lookback.start.toISOString(),
                until: lookback.end.toISOString(),
              },
              voiceId: brand?.id,
              resolveContext: getGitHubToolRepositoryContextByIntegrationId,
              resolveLinearContext: getLinearToolContextByIntegrationId,
              log,
              telemetryMetadata: {
                contentType,
                feature: "content_generation",
                generationMode: "manual",
                jobId,
                organizationId,
                routeName: "/api/workflows/on-demand-content",
                runId,
                source,
                triggerId: "manual_on_demand",
                voiceId: brand?.id,
              },
            });
          } finally {
            log.emit();
          }
        }
      );

      if (contentResult.status === "skipped") {
        await context.run("complete-skipped", async () => {
          await completeActiveGeneration(organizationId, {
            runId,
            triggerId: "manual_on_demand",
            outputType: contentType,
            triggerName: contentType,
            status: "skipped",
            reason: contentResult.reason,
            completedAt: new Date().toISOString(),
            source,
          });
          await setTrackedJobStatus(jobId, "skipped", {
            error: contentResult.reason,
          });
          await appendTrackedJobEvent(jobId, "skipped", contentResult.reason);
        });

        await context.run("log-generation-skipped", async () => {
          await appendWebhookLog({
            organizationId,
            integrationId: "manual_on_demand",
            integrationType: "manual",
            title: `On-demand generation skipped for ${contentType.replaceAll("_", " ")}`,
            status: "skipped",
            statusCode: null,
            errorMessage: contentResult.reason,
          });
        });

        await context.run("refund-skipped", async () => {
          await refundReservedAiCredit(organizationId, aiCreditReserved, {
            source: "manual",
            output_type: contentType,
            trigger_id: "manual_on_demand",
            trigger_name: contentType,
            refund_reason: "skipped",
            run_id: runId,
          });
        });

        await context.run("track-content-skipped", async () => {
          try {
            await trackScheduledContentSkipped({
              triggerId: "manual_on_demand",
              organizationId,
              outputType: contentType,
              creationMode: "manual",
              reason: contentResult.reason,
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "on_demand",
            });
          } catch (trackingError) {
            console.error("[OnDemandContent] Failed to track generation skip", {
              organizationId,
              contentType,
              error: trackingError,
            });
          }
        });

        console.log(
          `[OnDemandContent] Generation skipped: ${contentResult.reason}`,
          {
            organizationId,
            contentType,
          }
        );

        await context.run("cleanup-post-collection-skipped", async () => {
          await reconcileUnsuccessfulPostCollectionAttempt({
            collectionId,
            organizationId,
            runId,
          });
        });

        await context.cancel();
        return;
      }

      if (
        contentResult.status === "rate_limited" ||
        contentResult.status === "unsupported_output_type" ||
        contentResult.status === "generation_failed"
      ) {
        let reason: string;
        if (contentResult.status === "rate_limited") {
          reason = "GitHub API rate limit reached";
        } else if (contentResult.status === "unsupported_output_type") {
          reason = `Unsupported content type: ${contentResult.outputType}`;
        } else {
          reason = contentResult.reason;
        }

        await context.run("complete-failed", async () => {
          await completeActiveGeneration(organizationId, {
            runId,
            triggerId: "manual_on_demand",
            outputType: contentType,
            triggerName: contentType,
            status: "failed",
            reason,
            completedAt: new Date().toISOString(),
            source,
          });
          await setTrackedJobStatus(jobId, "failed", { error: reason });
          await appendTrackedJobEvent(jobId, "failed", reason);
        });

        await context.run("log-generation-failure", async () => {
          await appendWebhookLog({
            organizationId,
            integrationId: "manual_on_demand",
            integrationType: "manual",
            title: `On-demand generation failed for ${contentType.replaceAll("_", " ")}`,
            status: "failed",
            statusCode: null,
            errorMessage: reason,
          });
        });

        await context.run("refund-failed", async () => {
          await refundReservedAiCredit(organizationId, aiCreditReserved, {
            source: "manual",
            output_type: contentType,
            trigger_id: "manual_on_demand",
            trigger_name: contentType,
            refund_reason: contentResult.status,
            run_id: runId,
          });
        });

        await context.run("track-content-failed", async () => {
          try {
            await trackScheduledContentFailed({
              triggerId: "manual_on_demand",
              organizationId,
              outputType: contentType,
              creationMode: "manual",
              reason,
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "on_demand",
            });
          } catch (trackingError) {
            console.error(
              "[OnDemandContent] Failed to track generation failure",
              {
                organizationId,
                contentType,
                error: trackingError,
              }
            );
          }
        });

        console.error(`[OnDemandContent] Generation failed: ${reason}`, {
          organizationId,
          contentType,
        });

        await context.run(
          "cleanup-post-collection-generation-failure",
          async () => {
            await reconcileUnsuccessfulPostCollectionAttempt({
              collectionId,
              organizationId,
              runId,
            });
          }
        );

        await context.cancel();
        return;
      }

      const createdPosts = contentResult.posts;
      if (createdPosts.length === 0) {
        await context.run("complete-no-posts", async () => {
          await completeActiveGeneration(organizationId, {
            runId,
            triggerId: "manual_on_demand",
            outputType: contentType,
            triggerName: contentType,
            status: "failed",
            reason: "No content was generated",
            completedAt: new Date().toISOString(),
            source,
          });
          await setTrackedJobStatus(jobId, "failed", {
            error: "No content was generated",
          });
          await appendTrackedJobEvent(
            jobId,
            "failed",
            "No content was generated"
          );
        });

        await context.run("log-no-posts", async () => {
          await appendWebhookLog({
            organizationId,
            integrationId: "manual_on_demand",
            integrationType: "manual",
            title: `On-demand generation for ${contentType.replaceAll("_", " ")} produced no content`,
            status: "failed",
            statusCode: null,
            errorMessage: "No content was generated",
          });
        });

        await context.run("refund-no-posts", async () => {
          await refundReservedAiCredit(organizationId, aiCreditReserved, {
            source: "manual",
            output_type: contentType,
            trigger_id: "manual_on_demand",
            trigger_name: contentType,
            refund_reason: "no_posts",
            run_id: runId,
          });
        });

        await context.run("track-content-failed-no-posts", async () => {
          try {
            await trackScheduledContentFailed({
              triggerId: "manual_on_demand",
              organizationId,
              outputType: contentType,
              creationMode: "manual",
              reason: "No content was generated",
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "on_demand",
            });
          } catch (trackingError) {
            console.error(
              "[OnDemandContent] Failed to track no-posts failure",
              {
                organizationId,
                contentType,
                error: trackingError,
              }
            );
          }
        });

        await context.run("cleanup-post-collection-no-posts", async () => {
          await reconcileUnsuccessfulPostCollectionAttempt({
            collectionId,
            organizationId,
            runId,
          });
        });

        await context.cancel();
        return;
      }

      const contentTitle =
        createdPosts.length === 1
          ? (createdPosts[0]?.title ?? contentType)
          : `${createdPosts.length} ${contentType.replaceAll("_", " ")} drafts`;

      await context.run("complete-success", async () => {
        await completeActiveGeneration(organizationId, {
          runId,
          triggerId: "manual_on_demand",
          outputType: contentType,
          triggerName: contentType,
          status: "success",
          title: contentTitle,
          completedAt: new Date().toISOString(),
          source,
        });
        await setTrackedJobStatus(jobId, "completed", {
          postId: createdPosts[0]?.postId ?? null,
          error: null,
        });
        await appendTrackedJobEvent(
          jobId,
          "post_created",
          createdPosts.length === 1
            ? `Created post ${createdPosts[0]?.postId ?? ""}`
            : `Created ${createdPosts.length} posts`,
          { postId: createdPosts[0]?.postId ?? null }
        );
        await appendTrackedJobEvent(
          jobId,
          "completed",
          `Completed ${contentType.replaceAll("_", " ")} generation`,
          { postId: createdPosts[0]?.postId ?? null }
        );
      });

      const autumnClient = autumn;
      const contentUsage = contentResult.usage;
      if (
        aiCreditReserved &&
        autumnClient &&
        Number.isFinite(contentResult.usageCostCents)
      ) {
        await context.run("track-ai-credit-usage-cost", async () => {
          await autumnClient.track({
            customerId: organizationId,
            featureId: FEATURES.AI_CREDITS,
            value: contentResult.usageCostCents ?? 1,
            properties: {
              source: "manual",
              output_type: contentType,
              cost_cents: contentResult.usageCostCents,
            },
          });
        });
      } else if (aiCreditReserved && autumnClient && contentUsage) {
        await context.run("track-ai-credit-usage", async () => {
          const costCents = calculateTokenCostCents(
            contentUsage,
            "anthropic/claude-haiku-4.5",
            aiCreditMarkup
          );
          await autumnClient.track({
            customerId: organizationId,
            featureId: FEATURES.AI_CREDITS,
            value: costCents,
            properties: {
              source: "manual",
              output_type: contentType,
              input_tokens: contentResult.usage?.inputTokens,
              output_tokens: contentResult.usage?.outputTokens,
              cache_read_tokens: contentResult.usage?.cacheReadTokens,
              cache_write_tokens: contentResult.usage?.cacheWriteTokens,
              total_tokens: contentResult.usage?.totalTokens,
              cost_cents: costCents,
            },
          });
        });
      } else if (aiCreditReserved && autumnClient) {
        await context.run("track-ai-credit-fallback", async () => {
          await autumnClient.track({
            customerId: organizationId,
            featureId: FEATURES.AI_CREDITS,
            value: 1,
            properties: {
              source: "manual",
              output_type: contentType,
              fallback: true,
            },
          });
        });
      }

      await context.run("log-generation-success", async () => {
        await appendWebhookLog({
          organizationId,
          integrationId: "manual_on_demand",
          integrationType: "manual",
          title:
            createdPosts.length === 1
              ? `On-demand generation created "${contentTitle}"`
              : `On-demand generation created ${createdPosts.length} drafts`,
          status: "success",
          statusCode: null,
          referenceId: createdPosts[0]?.postId ?? null,
        });
      });

      await context.run("track-content-created", async () => {
        const trackingResults = await Promise.allSettled(
          createdPosts.map((createdPost) =>
            trackScheduledContentCreated({
              triggerId: "manual_on_demand",
              organizationId,
              postId: createdPost.postId,
              outputType: contentType,
              creationMode: "manual",
              lookbackWindow,
              repositoryCount: repositories.length,
              source: "on_demand",
            })
          )
        );

        const failedTracking = trackingResults.flatMap((result, index) =>
          result.status === "rejected"
            ? [
                {
                  postId: createdPosts[index]?.postId ?? "unknown",
                  error: result.reason,
                },
              ]
            : []
        );

        if (failedTracking.length > 0) {
          console.error(
            "[OnDemandContent] Failed to track some created posts",
            {
              organizationId,
              contentType,
              failures: failedTracking,
            }
          );
        }
      });

      return { success: true, postId: contentResult.postId };
    } catch (error) {
      if (error instanceof WorkflowAbort) {
        throw error;
      }

      await context.run("complete-error", async () => {
        await completeActiveGeneration(organizationId, {
          runId,
          triggerId: "manual_on_demand",
          outputType: contentType,
          triggerName: contentType,
          status: "failed",
          reason: "Unexpected workflow error",
          completedAt: new Date().toISOString(),
          source,
        });
        await setTrackedJobStatus(jobId, "failed", {
          error: "Unexpected workflow error",
        });
        await appendTrackedJobEvent(
          jobId,
          "failed",
          "Unexpected workflow error"
        );
      });

      await context.run("refund-error", async () => {
        await refundReservedAiCredit(organizationId, aiCreditReserved, {
          source: "manual",
          output_type: contentType,
          trigger_id: "manual_on_demand",
          trigger_name: contentType,
          refund_reason: "workflow_error",
          run_id: runId,
        });
      });

      await context.run("track-content-failed-error", async () => {
        try {
          await trackScheduledContentFailed({
            triggerId: "manual_on_demand",
            organizationId,
            outputType: contentType,
            creationMode: "manual",
            reason: "Unexpected workflow error",
            lookbackWindow,
            repositoryCount: repositories.length,
            source: "on_demand",
          });
        } catch (trackingError) {
          console.error(
            "[OnDemandContent] Failed to track unexpected workflow error",
            {
              organizationId,
              contentType,
              error: trackingError,
            }
          );
        }
      });

      await context.run("cleanup-post-collection-workflow-error", async () => {
        await reconcileUnsuccessfulPostCollectionAttempt({
          collectionId,
          organizationId,
          runId,
        });
      });

      throw error;
    }
  },
  {
    baseUrl: getBaseUrl(),
    failureFunction: async ({ context, failStatus, failResponse }) => {
      const payload = context.requestPayload;
      console.error(
        `[OnDemandContent] Workflow failed for org ${payload.organizationId}:`,
        { status: failStatus, response: failResponse }
      );

      try {
        await completeActiveGeneration(payload.organizationId, {
          runId: payload.runId,
          triggerId: "manual_on_demand",
          outputType: payload.contentType,
          triggerName: payload.contentType,
          status: "failed",
          reason: "Workflow infrastructure failure",
          completedAt: new Date().toISOString(),
          source: payload.source,
        });
        await setTrackedJobStatus(payload.jobId, "failed", {
          error: "Workflow infrastructure failure",
        });
        await appendTrackedJobEvent(
          payload.jobId,
          "failed",
          "Workflow infrastructure failure"
        );
        await refundReservedAiCredit(
          payload.organizationId,
          payload.aiCreditReserved,
          {
            source: "manual",
            output_type: payload.contentType,
            trigger_id: "manual_on_demand",
            trigger_name: payload.contentType,
            refund_reason: "workflow_infrastructure_failure",
            run_id: payload.runId,
          }
        );
        await trackScheduledContentFailed({
          triggerId: "manual_on_demand",
          organizationId: payload.organizationId,
          outputType: payload.contentType,
          creationMode: "manual",
          reason: "Workflow infrastructure failure",
          lookbackWindow: payload.lookbackWindow,
          source: "on_demand",
        });
        await reconcileUnsuccessfulPostCollectionAttempt({
          collectionId: payload.collectionId,
          organizationId: payload.organizationId,
          runId: payload.runId,
        });
      } catch (cleanupError) {
        console.error(
          "[OnDemandContent] Failed to cleanup after workflow failure:",
          cleanupError
        );
      }
    },
  }
);
