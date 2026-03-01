import type { PostSourceMetadata } from "@notra/db/schema";
import type { ToneProfile } from "@/schemas/brand";

export interface WorkflowTriggerData {
  id: string;
  name: string;
  organizationId: string;
  outputType: string;
  enabled: boolean;
}

export interface WorkflowRepositoryData {
  id: string;
  owner: string;
  name: string;
}

export interface WorkflowBrandSettings {
  toneProfile: string | null;
  companyName: string | null;
  companyDescription: string | null;
  audience: string | null;
  customInstructions: string | null;
}

export interface EventGenerationContext {
  organizationId: string;
  triggerId: string;
  triggerName: string;
  eventType: string;
  eventAction: string;
  eventData: Record<string, unknown>;
  repositoryId: string;
  repositoryOwner: string;
  repositoryName: string;
  deliveryId?: string;
  tone: ToneProfile;
  brand: {
    companyName?: string;
    companyDescription?: string;
    audience?: string;
    customInstructions?: string | null;
  };
  outputType: string;
  sourceMetadata: PostSourceMetadata;
}

export type EventGenerationResult =
  | { status: "ok"; postId: string; title: string }
  | { status: "generation_failed"; reason: string }
  | { status: "unsupported_output_type"; outputType: string };

export type EventHandler = (
  ctx: EventGenerationContext
) => Promise<EventGenerationResult>;
