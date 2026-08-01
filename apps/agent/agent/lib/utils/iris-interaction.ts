import { loadIrisOutboxCard } from "@notra/ai/autonomy/deliver";
import { recordIrisApproval, shipIrisPost } from "@notra/ai/autonomy/ship";
import {
  IRIS_SHIP_ACTION_ID,
  IRIS_SKIP_ACTION_ID,
} from "@notra/ai/constants/slack-delivery";
import { updateSlackMessage } from "@notra/ai/integrations/slack-post";
import type { IrisApproval } from "@notra/ai/schemas/autonomy/outbox";
import type {
  IrisArtifactDecision,
  IrisDecisionOutcome,
  SlackMessageContent,
} from "@notra/ai/types/slack-delivery";
import { buildShippedBlocks } from "@notra/ai/utils/slack-blocks";
import { Effect } from "effect";
import type { SlackContext, SlackInteractionAction } from "eve/channels/slack";
import {
  IrisInteractionError,
  type IrisInteractionValue,
  irisInteractionValueSchema,
} from "../schemas/iris-interaction";
import { resolveSlackInstallation } from "./slack-installation";

const IRIS_ACTION_IDS: ReadonlySet<string> = new Set([
  IRIS_SHIP_ACTION_ID,
  IRIS_SKIP_ACTION_ID,
]);

export function isIrisInteraction(actionId: string): boolean {
  return IRIS_ACTION_IDS.has(actionId);
}

function parseIrisInteractionValue(
  value: string | undefined
): IrisInteractionValue | null {
  if (!value) {
    return null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return null;
  }

  const parsed = irisInteractionValueSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function resolveActorName(action: SlackInteractionAction): string | null {
  return action.user.username ?? action.user.name ?? null;
}

const updateDecisionCard = Effect.fn("agent.iris.updateCard")(
  function* (input: {
    organizationId: string;
    teamId: string | null;
    channel: string;
    ts: string;
    content: SlackMessageContent;
  }) {
    yield* updateSlackMessage({
      organizationId: input.organizationId,
      teamId: input.teamId,
      channel: input.channel,
      ts: input.ts,
      text: input.content.text,
      blocks: input.content.blocks,
    });
  }
);

function approvalDisplayName(approval: IrisApproval): string {
  return approval.slackUserName ?? approval.slackUserId;
}

function toDecisions(
  approvals: readonly IrisApproval[]
): readonly IrisArtifactDecision[] {
  return approvals.map((approval) => ({
    postId: approval.postId,
    decidedBy: approvalDisplayName(approval),
    outcome: approval.action,
  }));
}

const buildDecisionContent = Effect.fn("agent.iris.buildDecisionCard")(
  function* (input: {
    value: IrisInteractionValue;
    approvals: readonly IrisApproval[];
    outcome: IrisDecisionOutcome;
    actorName: string;
  }) {
    const card = yield* loadIrisOutboxCard({
      organizationId: input.value.organizationId,
      outboxId: input.value.outboxId,
    });

    const decisions = toDecisions(input.approvals);
    const decided = decisions.find(
      (decision) => decision.postId === input.value.postId
    );
    const decidedBy = decided?.decidedBy ?? input.actorName;
    const decidedOutcome = decided?.outcome ?? input.outcome;

    if (!card) {
      const fallback: SlackMessageContent = {
        text:
          decidedOutcome === "shipped"
            ? `Shipped by ${decidedBy}.`
            : `Skipped by ${decidedBy}.`,
        blocks: [],
      };
      return fallback;
    }

    const shippedPostIds = new Set(
      input.approvals
        .filter((approval) => approval.action === "shipped")
        .map((approval) => approval.postId)
    );

    return buildShippedBlocks({
      organizationId: input.value.organizationId,
      organizationSlug: card.organizationSlug,
      outboxId: card.row.id,
      runId: card.payload.runId,
      headline: card.payload.headline,
      signalCount: card.payload.signalCount,
      trigger: card.payload.trigger,
      artifacts: card.payload.artifacts.map((artifact) =>
        shippedPostIds.has(artifact.postId)
          ? { ...artifact, status: "published" }
          : artifact
      ),
      decisions:
        decisions.length > 0
          ? decisions
          : [
              {
                postId: input.value.postId,
                decidedBy,
                outcome: decidedOutcome,
              },
            ],
    });
  }
);

const runIrisInteraction = Effect.fn("agent.iris.interaction")(
  function* (input: {
    actionId: string;
    value: string | undefined;
    messageTs: string | undefined;
    channelId: string;
    teamId: string | undefined;
    actorId: string;
    actorName: string | null;
  }) {
    const parsed = parseIrisInteractionValue(input.value);
    const teamId = input.teamId;

    if (!(parsed && teamId)) {
      yield* Effect.logWarning("Iris interaction payload was not usable").pipe(
        Effect.annotateLogs({ actionId: input.actionId })
      );
      return;
    }

    const installation = yield* Effect.tryPromise({
      try: () => resolveSlackInstallation(teamId),
      catch: (cause) =>
        new IrisInteractionError({
          operation: "resolveInstallation",
          cause,
        }),
    });

    if (installation?.organizationId !== parsed.organizationId) {
      yield* Effect.logWarning(
        "Iris interaction rejected for an organization mismatch"
      ).pipe(
        Effect.annotateLogs({
          teamId,
          actionOrganizationId: parsed.organizationId,
        })
      );
      return;
    }

    const outcome: IrisDecisionOutcome =
      input.actionId === IRIS_SHIP_ACTION_ID ? "shipped" : "skipped";

    const approval = yield* recordIrisApproval({
      organizationId: parsed.organizationId,
      outboxId: parsed.outboxId,
      postId: parsed.postId,
      action: outcome,
      slackUserId: input.actorId,
      slackUserName: input.actorName,
    });

    if (!approval.recorded) {
      yield* Effect.logInfo("Iris decision already recorded").pipe(
        Effect.annotateLogs({
          organizationId: parsed.organizationId,
          postId: parsed.postId,
          existingAction: approval.existingAction ?? "none",
        })
      );

      if (approval.existingAction === null) {
        yield* Effect.logWarning(
          "Iris decision could not be recorded, the card was left unchanged"
        ).pipe(
          Effect.annotateLogs({
            organizationId: parsed.organizationId,
            outboxId: parsed.outboxId,
            postId: parsed.postId,
          })
        );
        return;
      }
    }

    const shouldPublish =
      outcome === "shipped" &&
      (approval.recorded || approval.existingAction === "shipped");

    if (shouldPublish) {
      const result = yield* shipIrisPost({
        organizationId: parsed.organizationId,
        postId: parsed.postId,
      });

      if (result.status === "not_found") {
        yield* Effect.logWarning("Iris post to ship was not found").pipe(
          Effect.annotateLogs({
            organizationId: parsed.organizationId,
            postId: parsed.postId,
          })
        );
      }
    }

    if (!input.messageTs) {
      yield* Effect.logWarning("Iris interaction had no message to update");
      return;
    }

    const content = yield* buildDecisionContent({
      value: parsed,
      approvals: approval.approvals,
      outcome,
      actorName: input.actorName ?? input.actorId,
    });

    yield* updateDecisionCard({
      organizationId: parsed.organizationId,
      teamId,
      channel: input.channelId,
      ts: input.messageTs,
      content,
    });
  }
);

export async function handleIrisInteraction(
  action: SlackInteractionAction,
  ctx: SlackContext
): Promise<void> {
  await Effect.runPromise(
    runIrisInteraction({
      actionId: action.actionId,
      value: action.value,
      messageTs: action.messageTs,
      channelId: ctx.slack.channelId,
      teamId: ctx.slack.teamId,
      actorId: action.user.id,
      actorName: resolveActorName(action),
    }).pipe(
      Effect.catch((error) =>
        Effect.logWarning("[agent] Iris interaction failed", error)
      ),
      Effect.catchCause((cause) =>
        Effect.logWarning("[agent] Iris interaction crashed", cause)
      )
    )
  );
}
