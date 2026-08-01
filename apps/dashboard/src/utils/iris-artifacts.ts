import {
  type IrisOutboxArtifact,
  irisOutboxArtifactSchema,
} from "@notra/ai/schemas/autonomy/outbox";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";

const artifactListSchema = z.array(irisOutboxArtifactSchema);

const artifactContainerSchema = z.object({
  artifacts: artifactListSchema.optional(),
});

export const extractIrisArtifacts = (value: unknown): IrisOutboxArtifact[] => {
  const container = artifactContainerSchema.safeParse(value);
  if (container.success) {
    return container.data.artifacts ?? [];
  }

  const list = artifactListSchema.safeParse(value);
  return list.success ? list.data : [];
};
