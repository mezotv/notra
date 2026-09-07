import {
  internalWorkflowErrorResponseSchema,
  internalWorkflowStartResponseSchema,
} from "@notra/schemas/api/internal-workflow";
import { getVercelOidcToken } from "@vercel/oidc";
import type { ZodType } from "zod";

interface InternalWorkflowEnv {
  WORKFLOW_BASE_URL?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getInternalWorkflowUrl(env: InternalWorkflowEnv, path: string) {
  if (!env.WORKFLOW_BASE_URL) {
    return null;
  }

  return `${trimTrailingSlash(env.WORKFLOW_BASE_URL)}${path}`;
}

/**
 * A non-2xx answer from an internal dashboard route.
 *
 * Carries the dashboard's `code` when it sent one, so a caller can turn a
 * domain refusal (an unmet feature flag, say) into its own status instead of
 * flattening every failure into a 500.
 */
export class InternalDashboardError extends Error {
  readonly status: number;
  readonly code: string | null;
  /** Raw response body, so a caller can read a structured payload out of it. */
  readonly body: string;

  constructor(status: number, code: string | null, body: string) {
    super(
      `Internal dashboard request failed with status ${status}${body ? `: ${body}` : ""}`
    );
    this.name = "InternalDashboardError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

function readErrorCode(body: string): string | null {
  try {
    const parsed = internalWorkflowErrorResponseSchema.safeParse(
      JSON.parse(body)
    );
    return parsed.success ? (parsed.data.code ?? null) : null;
  } catch {
    // Not JSON — the dashboard answered with plain text.
  }
  return null;
}

/**
 * Ceiling for an internal call that runs work synchronously rather than
 * handing off to a workflow (currently GEO sequence runs and brief planning).
 *
 * Two things matter here. First, no timeout at all is wrong: Bun's `fetch`
 * never gives up on its own, so a wedged dashboard would pin an API request
 * forever. Second, a *short* timeout is worse than none — the dashboard keeps
 * running and keeps billing after we hang up, and the client sees a failure it
 * is tempted to retry, paying twice.
 *
 * The practical ceiling is not ours to set, and two limits bound it. Outbound,
 * Node's undici caps the wait for response headers at 300s and we cannot raise
 * that without taking a direct `undici` dependency to install a custom
 * dispatcher. Inbound, the API's own socket is the tighter one: Bun closes a
 * connection that has sent no bytes for `idleTimeout` seconds (see the server
 * export in `src/index.ts`), and Bun caps that setting at 255s — so a request
 * held longer than that dies as a zero-byte socket close, with no status for
 * the client to act on.
 *
 * Hence 240s < 255s (our socket idle timeout) < 300s (undici's header wait):
 * the abort is ours and deterministic across Bun and Node, and it fires early
 * enough that we can still write the 503 before anything hangs up on us.
 * Phase 6 (durable workflow) removes the need for a long-held request
 * altogether.
 */
export const SYNCHRONOUS_INTERNAL_CALL_TIMEOUT_MS = 240_000;

/** Signals a synchronous internal call that outlived its timeout. */
export class InternalDashboardTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Internal dashboard call timed out after ${timeoutMs}ms`);
    this.name = "InternalDashboardTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * POSTs to an internal dashboard route and decodes its successful JSON body.
 *
 * Same authentication as `startDashboardWorkflow` (shared secret first, Vercel
 * OIDC as the fallback); this is the general form for internal routes that
 * answer with something other than `{ runId }`.
 *
 * `timeoutMs` is opt-in only for immediate hand-off routes. A route that runs
 * paid work inline must pass `SYNCHRONOUS_INTERNAL_CALL_TIMEOUT_MS` through
 * `runRemoteGeoEffect`, which makes the timeout mandatory for that boundary.
 */
export async function callDashboardInternal<A>(
  url: string,
  payload: unknown,
  responseSchema: ZodType<A>,
  timeoutMs?: number
): Promise<A> {
  const secret = process.env.INTERNAL_WORKFLOW_SECRET?.trim();
  const token = secret || (await getVercelOidcToken().catch(() => null));
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      ...(timeoutMs === undefined
        ? {}
        : { signal: AbortSignal.timeout(timeoutMs) }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new InternalDashboardError(
        response.status,
        readErrorCode(detail),
        detail
      );
    }

    const data: unknown = await response.json();
    return responseSchema.parse(data);
  } catch (cause) {
    if (
      timeoutMs !== undefined &&
      cause instanceof Error &&
      (cause.name === "TimeoutError" || cause.name === "AbortError")
    ) {
      throw new InternalDashboardTimeoutError(timeoutMs);
    }
    throw cause;
  }
}

export async function startDashboardWorkflow(
  url: string,
  payload: unknown
): Promise<string> {
  const data = await callDashboardInternal(
    url,
    payload,
    internalWorkflowStartResponseSchema
  );
  return data.runId;
}
