import { TCCSpanProcessor } from "@contextcompany/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";

const tcc = new NodeSDK({
  spanProcessors: [new TCCSpanProcessor()],
});

tcc.start();
