import { createAxiomDrain } from "evlog/axiom";
import { createEvlog } from "evlog/next";
import { createInstrumentation } from "evlog/next/instrumentation";

const service = process.env.NODE_ENV === "development" ? "notra-dev" : "notra";

const drain =
  process.env.AXIOM_TOKEN && process.env.AXIOM_AI_DATASET
    ? createAxiomDrain({
        token: process.env.AXIOM_TOKEN,
        dataset: process.env.AXIOM_AI_DATASET,
        orgId: process.env.AXIOM_ORG_ID,
      })
    : undefined;

const config = {
  service,
  drain,
};

export const { withEvlog, useLogger, log, createError } = createEvlog(config);

export const { register, onRequestError } = createInstrumentation(config);
