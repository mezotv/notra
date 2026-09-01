import {
  DEFAULT_ENDPOINT,
  FEEDBACK_PATH,
  MISSING_URL_MESSAGE,
  SUBMIT_TIMEOUT_MS,
} from "./constants";
import type {
  FeedbackClientOptions,
  FeedbackInput,
  FeedbackSubmitResult,
} from "./types";

export class FeedbackSubmitError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FeedbackSubmitError";
    this.status = status;
  }
}

function feedbackUrl(options: FeedbackClientOptions): string {
  if (options.url) {
    return options.url;
  }
  if (!options.token) {
    throw new Error(MISSING_URL_MESSAGE);
  }
  const value = options.endpoint ?? DEFAULT_ENDPOINT;
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }
  return `${value.slice(0, end)}${FEEDBACK_PATH}`;
}

function feedbackHeaders(
  options: FeedbackClientOptions
): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (!options.url && options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  return headers;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    return response.statusText;
  }
  return response.statusText;
}

export async function submitFeedback(
  input: FeedbackInput,
  options: FeedbackClientOptions
): Promise<FeedbackSubmitResult> {
  const send = options.fetch ?? globalThis.fetch;
  const response = await send(feedbackUrl(options), {
    method: "POST",
    headers: feedbackHeaders(options),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(options.timeoutMs ?? SUBMIT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new FeedbackSubmitError(
      response.status,
      await readErrorMessage(response)
    );
  }

  const body: unknown = await response.json();
  if (
    typeof body === "object" &&
    body !== null &&
    "feedback" in body &&
    typeof body.feedback === "object" &&
    body.feedback !== null &&
    "id" in body.feedback &&
    typeof body.feedback.id === "string"
  ) {
    return {
      id: body.feedback.id,
      deduplicated:
        "deduplicated" in body && typeof body.deduplicated === "boolean"
          ? body.deduplicated
          : false,
    };
  }

  throw new FeedbackSubmitError(response.status, "Unexpected response");
}
