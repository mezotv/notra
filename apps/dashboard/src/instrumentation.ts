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
  }
}

export const onRequestError: typeof evlogInstrumentation.onRequestError =
  async (error, request, context) => {
    await evlogInstrumentation.onRequestError(error, request, context);

    if (process.env.NEXT_RUNTIME !== "nodejs") {
      return;
    }

    const [
      { captureServerException, flushPostHogServer },
      { getPostHogRequestContext },
    ] = await Promise.all([
      import("@notra/posthog/server"),
      import("@notra/posthog/request"),
    ]);

    const requestContext = getPostHogRequestContext({
      get: (name) => request.headers[name] ?? null,
    });

    captureServerException({
      error,
      distinctId: requestContext.distinctId,
      sessionId: requestContext.sessionId,
      properties: {
        path: request.path,
        method: request.method,
        router_kind: context.routerKind,
        route_path: context.routePath,
        route_type: context.routeType,
      },
    });
    await flushPostHogServer();
  };
