import { Data } from "effect";

export class SignalIngestError extends Data.TaggedError("SignalIngestError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class LeaseError extends Data.TaggedError("LeaseError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class RunPersistenceError extends Data.TaggedError(
  "RunPersistenceError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class OutboxEnqueueError extends Data.TaggedError("OutboxEnqueueError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class GateError extends Data.TaggedError("GateError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export class IrisPlannerError extends Data.TaggedError("IrisPlannerError")<{
  readonly message: string;
  readonly violations: readonly string[];
  readonly costCents: number;
  readonly cause: unknown;
}> {}

export class IrisCapabilityError extends Data.TaggedError(
  "IrisCapabilityError"
)<{
  readonly message: string;
  readonly capabilityName: string;
  readonly taskId: string;
  readonly retryable: boolean;
  readonly cause: unknown;
}> {}

export class IrisPollError extends Data.TaggedError("IrisPollError")<{
  readonly message: string;
  readonly source: string;
  readonly cause: unknown;
}> {}

export class IrisCollectionError extends Data.TaggedError(
  "IrisCollectionError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}
