if (process.env.NODE_ENV === "production") {
  const { TCCSpanProcessor } = await import("@contextcompany/otel");
  const { NodeSDK } = await import("@opentelemetry/sdk-node");

  const tcc = new NodeSDK({
    spanProcessors: [new TCCSpanProcessor()],
  });

  tcc.start();
}
