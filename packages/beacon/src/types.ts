export type BeaconCategory =
  | "training-crawler"
  | "search-index"
  | "assistant-browse";

export type BeaconConfidence = "verified" | "reported" | "heuristic";

export interface BeaconSignature {
  agent: string;
  vendor: string;
  category: BeaconCategory;
  userAgents: string[];
  confidence: BeaconConfidence;
  verification: string | null;
  source: string;
}

export interface BeaconMatch {
  agent: string;
  vendor: string;
  category: BeaconCategory;
  confidence: BeaconConfidence;
}

export interface BeaconEvent {
  token: string;
  organizationId: string;
  agent: string;
  category: BeaconCategory;
  confidence: BeaconConfidence;
  path: string;
  host: string;
  method: string;
  referer: string | null;
  ua: string;
  ts: string;
}

export interface BeaconConfig {
  ingestUrl: string;
  token: string;
  organizationId: string;
  sample?: number;
  fetchImpl?: typeof fetch;
}

export interface BeaconRequestLike {
  headers: Headers;
  method: string;
  url: string;
}

export interface BeaconEventContext {
  waitUntil?: (promise: Promise<unknown>) => void;
}
