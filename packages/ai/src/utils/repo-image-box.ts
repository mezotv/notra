export async function withBoxRetry<T>(
  callback: () => Promise<T>,
  attempts = 3
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransientBoxError(error)) {
        break;
      }
      await sleep(1000 * attempt);
    }
  }

  throw lastError;
}

function isTransientBoxError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes("fetch failed") ||
    error.message.includes("ECONNRESET") ||
    error.message.includes("UND_ERR")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
