import { defineNodeInstrumentation } from "evlog/next/instrumentation";

const evlogInstrumentation = defineNodeInstrumentation(
  () => import("@notra/ai/evlog")
);

export async function register() {
  await evlogInstrumentation.register();

  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    const { registerOTelTCC } = await import("@contextcompany/otel/nextjs");
    registerOTelTCC();

    const { registerTelemetry } = await import("ai");
    const { OpenTelemetry } = await import("@ai-sdk/otel");
    registerTelemetry(new OpenTelemetry());
  }
}

export const { onRequestError } = evlogInstrumentation;
