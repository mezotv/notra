import { defineNodeInstrumentation } from "evlog/next/instrumentation";

export const { register, onRequestError } = defineNodeInstrumentation(
  () => import("@notra/ai/evlog")
);
