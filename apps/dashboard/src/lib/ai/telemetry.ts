type AISDKTelemetryMetadata = Record<string, string>;

export function getAISDKTelemetry(
  functionId: string,
  metadata: AISDKTelemetryMetadata = {}
) {
  return {
    isEnabled: true,
    functionId,
    metadata: {
      environment:
        process.env.NODE_ENV === "production" ? "production" : "development",
      ...metadata,
    },
  };
}
