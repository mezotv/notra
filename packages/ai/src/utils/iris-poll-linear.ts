import { IrisPollError } from "@notra/ai/autonomy/errors";
import {
  IRIS_POLL_LINEAR_DESCRIPTION_LIMIT,
  IRIS_POLL_LINEAR_ISSUE_LIMIT,
  IRIS_POLL_MAX_LINEAR_INTEGRATIONS,
} from "@notra/ai/constants/autonomy-poll";
import {
  SIGNAL_KIND_LINEAR_ISSUE_COMPLETED,
  SIGNAL_SOURCE_LINEAR,
} from "@notra/ai/constants/autonomy-signals";
import {
  getDecryptedLinearToken,
  getLinearIntegrationsByOrganization,
} from "@notra/ai/integrations/linear";
import type {
  IrisPollItem,
  IrisPollWindow,
  IrisSourcePollResult,
} from "@notra/ai/types/autonomy-poll";
import { computeSignalDedupeHash } from "@notra/ai/utils/autonomy-hash";
import { createLinearClient } from "@notra/ai/utils/linear";
import { Effect } from "effect";

const NO_INTEGRATIONS_REASON = "No enabled Linear workspaces are connected";

const toLinearPollError = (message: string) => (cause: unknown) =>
  new IrisPollError({ message, source: SIGNAL_SOURCE_LINEAR, cause });

const truncate = (value: string, limit: number): string =>
  value.length <= limit ? value : `${value.slice(0, limit).trimEnd()}...`;

const listPollableIntegrations = Effect.fn("iris.poll.linear.integrations")(
  function* (organizationId: string) {
    const integrations = yield* Effect.tryPromise({
      try: () => getLinearIntegrationsByOrganization(organizationId),
      catch: toLinearPollError("Failed to load Linear integrations to poll"),
    });

    return integrations
      .filter((integration) => integration.enabled)
      .slice(0, IRIS_POLL_MAX_LINEAR_INTEGRATIONS);
  }
);

const pollIntegration = Effect.fn("iris.poll.linear.integration")(function* (
  integration: { id: string; linearTeamId: string | null },
  since: Date
) {
  const token = yield* Effect.tryPromise({
    try: () => getDecryptedLinearToken(integration.id),
    catch: toLinearPollError("Failed to resolve a Linear access token"),
  });

  if (!token) {
    return [];
  }

  const filter: Record<string, unknown> = {
    completedAt: { gte: since },
  };
  if (integration.linearTeamId) {
    filter.team = { id: { eq: integration.linearTeamId } };
  }

  const client = createLinearClient(token);
  const issues = yield* Effect.tryPromise({
    try: () =>
      client.issues({
        filter,
        first: IRIS_POLL_LINEAR_ISSUE_LIMIT,
      }),
    catch: toLinearPollError("Failed to list completed Linear issues"),
  });

  return issues.nodes
    .filter((issue) => issue.completedAt !== undefined)
    .map((issue): IrisPollItem => ({
      source: SIGNAL_SOURCE_LINEAR,
      kind: SIGNAL_KIND_LINEAR_ISSUE_COMPLETED,
      dedupeHash: computeSignalDedupeHash(
        SIGNAL_SOURCE_LINEAR,
        SIGNAL_KIND_LINEAR_ISSUE_COMPLETED,
        `${issue.id}:${issue.completedAt?.toISOString() ?? ""}`
      ),
      sourceEventId: issue.id,
      occurredAt: issue.completedAt ?? new Date(),
      title: `${issue.identifier} ${issue.title}`,
      url: issue.url,
      payload: {
        type: "issue",
        action: "completed",
        data: {
          identifier: issue.identifier,
          name: issue.title,
          description: issue.description
            ? truncate(issue.description, IRIS_POLL_LINEAR_DESCRIPTION_LIMIT)
            : null,
          completedAt: issue.completedAt ?? null,
          url: issue.url,
        },
        integrationId: integration.id,
        teamId: integration.linearTeamId,
        discoveredBy: "poll",
      },
    }));
});

export const pollLinearSource = Effect.fn("iris.poll.linear")(function* (
  window: IrisPollWindow
) {
  const integrations = yield* listPollableIntegrations(window.organizationId);

  if (integrations.length === 0) {
    return {
      source: SIGNAL_SOURCE_LINEAR,
      items: [],
      skippedReason: NO_INTEGRATIONS_REASON,
    } satisfies IrisSourcePollResult;
  }

  const results = yield* Effect.all(
    integrations.map((integration) =>
      pollIntegration(
        { id: integration.id, linearTeamId: integration.linearTeamId },
        window.since
      ).pipe(
        Effect.catch((error) =>
          Effect.annotateLogs(
            Effect.logWarning("iris.poll.linear.integrationFailed"),
            { integrationId: integration.id, error: String(error) }
          ).pipe(Effect.as([]))
        )
      )
    ),
    { concurrency: 2 }
  );

  return {
    source: SIGNAL_SOURCE_LINEAR,
    items: results.flat(),
    skippedReason: null,
  } satisfies IrisSourcePollResult;
});
