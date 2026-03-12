import { RespanExporter } from "@respan/exporter-vercel";
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: process.env.NODE_ENV === "development" ? "notra-dev" : "notra",
    traceExporter: new RespanExporter({
      apiKey: process.env.RESPAN_API_KEY!,
    }),
  });
}
