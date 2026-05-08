import { defineNodeInstrumentation } from "evlog/next/instrumentation";

const evlogInstrumentation = defineNodeInstrumentation(
  () => import("@notra/ai/evlog")
);

export async function register() {
  await evlogInstrumentation.register();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerOTelTCC } = await import("@contextcompany/otel/nextjs");
    registerOTelTCC();
  }
}

export const { onRequestError } = evlogInstrumentation;
