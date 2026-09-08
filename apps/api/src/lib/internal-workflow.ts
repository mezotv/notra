import { getVercelOidcToken } from "@vercel/oidc";
import { Config, Context, Effect, Layer, Redacted } from "effect";

import { InternalDashboardTransportFailure } from "../errors/internal-workflow";
import type { InternalWorkflowTransportService } from "../types/internal-workflow";

/** Platform transport: keep native fetch errors for the existing Promise API. */
export class InternalWorkflowTransport extends Context.Service<
  InternalWorkflowTransport,
  InternalWorkflowTransportService
>()("api/lib/InternalWorkflowTransport") {
  static readonly layer = Layer.effect(
    InternalWorkflowTransport,
    Effect.gen(function* () {
      const secret = yield* Config.redacted("INTERNAL_WORKFLOW_SECRET").pipe(
        Config.withDefault(Redacted.make("")),
        Effect.mapError(
          (cause) => new InternalDashboardTransportFailure({ cause })
        )
      );
      return InternalWorkflowTransport.of({
        fetch: (url, init) => fetch(url, init),
        getToken: Effect.fn("InternalWorkflowTransport.getToken")(function* () {
          const sharedSecret = Redacted.value(secret).trim();
          if (sharedSecret) {
            return sharedSecret;
          }
          return yield* Effect.tryPromise(() => getVercelOidcToken()).pipe(
            Effect.catch(() => Effect.succeed(null))
          );
        }),
      });
    })
  );
}
