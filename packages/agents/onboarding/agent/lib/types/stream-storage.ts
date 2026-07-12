export interface StreamStorageConfig {
  accessKeyId: string;
  bucketName: string;
  endpoint: string;
  secretAccessKey: string;
}

export interface StoredStreamEvent {
  event: unknown;
  recordedAt: string;
}
