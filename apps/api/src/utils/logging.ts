export function logError(prefix: string, error: unknown) {
  if (error instanceof Error) {
    console.error(prefix, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause === undefined ? {} : { cause: error.cause }),
    });
    return;
  }

  console.error(prefix, { error: String(error) });
}
