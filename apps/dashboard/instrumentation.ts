import { RespanExporter } from "@respan/exporter-vercel";
import { registerOTel } from "@vercel/otel";

const apiKey = process.env.RESPAN_API_KEY;

if (!apiKey) {
  console.warn("RESPAN_API_KEY is not set");
}

export function register() {
  if (apiKey) {
    registerOTel({
      serviceName:
        process.env.NODE_ENV === "development" ? "notra-dev" : "notra",
      traceExporter: new RespanExporter({
        apiKey,
        debug: true,
      }),
    });
  }
}
