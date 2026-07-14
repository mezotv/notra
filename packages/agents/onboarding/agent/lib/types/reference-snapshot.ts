import type { SessionContext } from "eve/context";

export interface ReferenceSnapshotDescriptor {
  sourceCapturedAt: string;
  sourceContentHash: string;
  sourceSnapshotKey: string;
}

export interface ReferenceSnapshotStorageEnv {
  accessKeyId: string;
  bucketName: string;
  endpoint: string;
  secretAccessKey: string;
}

export interface SaveReferenceSnapshotInput {
  ctx: SessionContext;
  markdown: string;
}
