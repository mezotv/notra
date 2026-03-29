import { createEvlog } from "evlog/next";
import { createInstrumentation } from "evlog/next/instrumentation";
import { createOTLPDrain } from "evlog/otlp";

const service = process.env.NODE_ENV === "development" ? "notra-dev" : "notra";

const drain = process.env.OTLP_ENDPOINT
  ? createOTLPDrain({
      serviceName: service,
    })
  : undefined;

const config = {
  service,
  drain,
};

export const { withEvlog, useLogger, log, createError } = createEvlog(config);

export const { register, onRequestError } = createInstrumentation(config);
