if (process.env.NODE_ENV === "production") {
  const { TCCSpanProcessor } = await import("@contextcompany/otel");
  const { NodeSDK } = await import("@opentelemetry/sdk-node");

  const tcc = new NodeSDK({
    spanProcessors: [new TCCSpanProcessor()],
  });

  tcc.start();

  const { registerTelemetry } = await import("ai");
  const { OpenTelemetry } = await import("@ai-sdk/otel");
  registerTelemetry(new OpenTelemetry());
}
