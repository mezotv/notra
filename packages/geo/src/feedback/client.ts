import {
  DEFAULT_ENDPOINT,
  FEEDBACK_PATH,
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

function feedbackUrl(endpoint: string | undefined): string {
  const value = endpoint ?? DEFAULT_ENDPOINT;
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }
  return `${value.slice(0, end)}${FEEDBACK_PATH}`;
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
  const response = await send(feedbackUrl(options.endpoint), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${options.token}`,
    },
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
