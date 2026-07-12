export interface StreamStorageConfig {
  accessKeyId: string;
  bucketName: string;
  endpoint: string;
  secretAccessKey: string;
}

export interface StoredStreamEvent {
  event: unknown;
  order: string;
  recordedAt: string;
}
