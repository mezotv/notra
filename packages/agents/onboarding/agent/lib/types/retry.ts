export interface RetryOptions {
  operationName: string;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export type RetryOperation<T> = (signal: AbortSignal) => Promise<T>;
