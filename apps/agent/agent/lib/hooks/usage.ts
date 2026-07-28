import { calculateAiCreditCostCents } from "@notra/ai/billing/ai-credit-cost";
import {
  allowUnmeteredAiInDevelopment,
  autumn,
} from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { redis } from "@notra/ai/utils/redis";
import { getOrganizationId } from "@notra/tools/utils/organization";
import {
  getBooleanSessionAttribute,
  getSessionAttribute,
} from "@notra/tools/utils/session";
import { defineHook, type HookDefinition } from "eve/hooks";

const USAGE_DEDUPE_TTL_SECONDS = 60 * 60 * 24;

export function createUsageHook(modelId: string): HookDefinition {
  return defineHook({
    events: {
      "step.completed": async (event, ctx) => {
        try {
          if (!autumn || allowUnmeteredAiInDevelopment) {
            return;
          }
          const organizationId = getOrganizationId(ctx);
          const usage = event.data.usage;
          if (!(organizationId && usage)) {
            return;
          }

          if (redis) {
            const dedupeKey = `agent:usage:${ctx.session.id}:${event.data.turnId}:${event.data.stepIndex}`;
            const claimed = await redis.set(dedupeKey, "1", {
              nx: true,
              ex: USAGE_DEDUPE_TTL_SECONDS,
            });
            if (claimed !== "OK") {
              return;
            }
          }

          const inputTokens = usage.inputTokens ?? 0;
          const outputTokens = usage.outputTokens ?? 0;
          const cacheReadTokens = usage.cacheReadTokens ?? 0;
          const cacheWriteTokens = usage.cacheWriteTokens ?? 0;
          const cost = calculateAiCreditCostCents(
            {
              inputTokens,
              outputTokens,
              totalTokens:
                inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens,
              cacheReadTokens,
              cacheWriteTokens,
              modelId,
            },
            modelId,
            getBooleanSessionAttribute(ctx, "useMarkup")
          );

          await autumn.track({
            customerId: organizationId,
            featureId: FEATURES.AI_CREDITS,
            value: cost.costCents,
            properties: {
              source: getSessionAttribute(ctx, "surface") ?? "agent",
              agent: ctx.agent.name,
              session_id: ctx.session.id,
              turn_id: event.data.turnId,
              step_index: event.data.stepIndex,
              model: modelId,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              cache_read_tokens: cacheReadTokens,
              cache_write_tokens: cacheWriteTokens,
              cost_cents: cost.costCents,
            },
          });
        } catch (error) {
          console.error("[agent] Usage metering failed", error);
        }
      },
    },
  });
}
