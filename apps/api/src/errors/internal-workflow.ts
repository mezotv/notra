/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a curried class factory, not a constructor. */
import { Schema } from "effect";

export class InternalDashboardResponseFailure extends Schema.TaggedError<InternalDashboardResponseFailure>()(
  "InternalDashboardResponseFailure",
  { cause: Schema.Defect() }
) {}

export class InternalDashboardTransportFailure extends Schema.TaggedError<InternalDashboardTransportFailure>()(
  "InternalDashboardTransportFailure",
  { cause: Schema.Defect() }
) {}

export class InternalDashboardDecodingFailure extends Schema.TaggedError<InternalDashboardDecodingFailure>()(
  "InternalDashboardDecodingFailure",
  { cause: Schema.Defect() }
) {}

export class InternalDashboardTimeoutFailure extends Schema.TaggedError<InternalDashboardTimeoutFailure>()(
  "InternalDashboardTimeoutFailure",
  { cause: Schema.Defect() }
) {}
