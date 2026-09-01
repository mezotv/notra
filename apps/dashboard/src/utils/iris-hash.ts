import { createHash } from "node:crypto";

import { computeStableInputHash } from "@notra/ai/utils/autonomy-hash";

export const buildIrisActionIdempotencyKey = (
  runId: string,
  localTaskId: string
): string =>
  createHash("sha256").update(`${runId}:${localTaskId}`).digest("hex");

export const buildIrisGateInputHash = (input: unknown): string =>
  computeStableInputHash(input);
