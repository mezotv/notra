import {
  GEO_LOG_BATCH_INTERVAL_MS,
  GEO_LOG_BATCH_SIZE,
} from "@notra/ai/constants/evlog";
import type { EvlogDrain, GeoLogEvent, GeoLogger } from "@notra/ai/types/evlog";
import { isGeoLogEvent } from "@notra/ai/utils/evlog";
import type { DrainContext } from "evlog";
import { createAxiomDrain } from "evlog/axiom";
import { createEvlog } from "evlog/next";
import { createInstrumentation } from "evlog/next/instrumentation";
import { createDrainPipeline } from "evlog/pipeline";

const service = process.env.NODE_ENV === "development" ? "notra-dev" : "notra";

function createDatasetDrain(dataset: string | undefined) {
  if (!process.env.AXIOM_TOKEN || !dataset) {
    return undefined;
  }
  return createAxiomDrain({
    token: process.env.AXIOM_TOKEN,
    dataset,
    orgId: process.env.AXIOM_ORG_ID,
  });
}

const aiDrain = createDatasetDrain(process.env.AXIOM_AI_DATASET);
const geoAxiomDrain = createDatasetDrain(process.env.AXIOM_GEO_DATASET);
const geoDrain = geoAxiomDrain
  ? createDrainPipeline<DrainContext>({
      batch: {
        size: GEO_LOG_BATCH_SIZE,
        intervalMs: GEO_LOG_BATCH_INTERVAL_MS,
      },
      onDropped: (events, error) => {
        console.error(
          `[evlog/geo] dropped ${events.length} events`,
          error ?? "buffer overflow"
        );
      },
    })(geoAxiomDrain)
  : undefined;

function routeDrain(ctx: DrainContext) {
  if (isGeoLogEvent(ctx.event)) {
    geoDrain?.(ctx);
    return;
  }
  return aiDrain?.(ctx);
}

const drain: EvlogDrain | undefined =
  aiDrain || geoDrain ? routeDrain : undefined;

const config = {
  service,
  drain,
};

export const { withEvlog, useLogger, log, createError } = createEvlog(config);

export const { register, onRequestError } = createInstrumentation(config);

export const geoLogDrainEnabled = geoDrain !== undefined;

export const geoLog: GeoLogger = {
  info: (event: GeoLogEvent) => log.info(event),
  warn: (event: GeoLogEvent) => log.warn(event),
  error: (event: GeoLogEvent) => log.error(event),
};

export async function flushGeoLog(): Promise<void> {
  await geoDrain?.flush();
}
