import type { Effect } from "effect";

import type {
  InternalDashboardDecodingFailure,
  InternalDashboardResponseFailure,
  InternalDashboardTimeoutFailure,
  InternalDashboardTransportFailure,
} from "../errors/internal-workflow";

export interface InternalWorkflowEnv {
  WORKFLOW_BASE_URL?: string;
}

export interface InternalWorkflowTransportService {
  readonly fetch: (url: string, init: RequestInit) => Promise<Response>;
  readonly getToken: () => Effect.Effect<string | null>;
}

export type InternalDashboardFailure =
  | InternalDashboardResponseFailure
  | InternalDashboardTransportFailure
  | InternalDashboardDecodingFailure
  | InternalDashboardTimeoutFailure;
