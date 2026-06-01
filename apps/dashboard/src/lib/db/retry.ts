const TRANSIENT_DB_MESSAGES = ["Control plane request failed"];
const TRANSIENT_DB_CODES = new Set(["XX000", "UND_ERR_DESTROYED"]);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (!(error && typeof error === "object")) {
    return;
  }

  const candidate = error as { code?: unknown };
  return typeof candidate.code === "string" ? candidate.code : undefined;
}

function getErrorCause(error: unknown): unknown {
  if (!(error && typeof error === "object")) {
    return;
  }

  return (error as { cause?: unknown }).cause;
}

function isTransientDbError(error: unknown): boolean {
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current) {
    if (seen.has(current)) {
      return false;
    }
    seen.add(current);

    const message = getErrorMessage(current);
    if (TRANSIENT_DB_MESSAGES.some((value) => message.includes(value))) {
      return true;
    }

    const code = getErrorCode(current);
    if (code && TRANSIENT_DB_CODES.has(code)) {
      return true;
    }

    current = getErrorCause(current);
  }

  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryTransientDbError<T>(
  operation: () => Promise<T>
): Promise<T> {
  const delays = [250, 750, 1500];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!(attempt < delays.length && isTransientDbError(error))) {
        throw error;
      }

      await delay(delays[attempt] ?? 0);
    }
  }

  throw lastError;
}
