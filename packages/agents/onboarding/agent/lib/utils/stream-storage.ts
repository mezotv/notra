import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  DURABLE_STREAM_READ_CONCURRENCY,
  DURABLE_STREAM_STORAGE_PREFIX,
} from "../constants/stream-log";
import type {
  StoredStreamEvent,
  StreamStorageConfig,
} from "../types/stream-storage";

let cachedClient: S3Client | undefined;
let cachedConfig: StreamStorageConfig | undefined;
const TRAILING_SLASHES_RE = /\/+$/;

function getStreamStorageConfig(): StreamStorageConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;
  const rawEndpoint = process.env.CLOUDFLARE_S3_ENDPOINT;
  if (!(accessKeyId && secretAccessKey && bucketName && rawEndpoint)) {
    throw new Error(
      "Durable onboarding stream storage requires the Cloudflare R2 environment variables"
    );
  }

  const trimmedEndpoint = rawEndpoint.replace(TRAILING_SLASHES_RE, "");
  const bucketSuffix = `/${bucketName}`;
  cachedConfig = {
    accessKeyId,
    bucketName,
    endpoint: trimmedEndpoint.endsWith(bucketSuffix)
      ? trimmedEndpoint.slice(0, -bucketSuffix.length)
      : trimmedEndpoint,
    secretAccessKey,
  };
  return cachedConfig;
}

function getStreamStorageClient(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }
  const config = getStreamStorageConfig();
  cachedClient = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: "auto",
  });
  return cachedClient;
}

export async function appendDurableStreamEvent(
  sessionId: string,
  event: unknown
): Promise<void> {
  const config = getStreamStorageConfig();
  const recordedAt = new Date().toISOString();
  const body = JSON.stringify({
    event,
    recordedAt,
  } satisfies StoredStreamEvent);
  await getStreamStorageClient().send(
    new PutObjectCommand({
      Body: body,
      Bucket: config.bucketName,
      ContentType: "application/json; charset=utf-8",
      Key: `${DURABLE_STREAM_STORAGE_PREFIX}/streams/${sessionId}/${recordedAt}-${randomUUID()}.json`,
    })
  );
}

export async function readDurableStreamEvents(
  sessionId: string
): Promise<unknown[]> {
  const config = getStreamStorageConfig();
  const client = getStreamStorageClient();
  const prefix = `${DURABLE_STREAM_STORAGE_PREFIX}/streams/${sessionId}/`;
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        ContinuationToken: continuationToken,
        Prefix: prefix,
      })
    );
    keys.push(
      ...(page.Contents ?? []).flatMap((entry) =>
        entry.Key ? [entry.Key] : []
      )
    );
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);

  const storedEvents: StoredStreamEvent[] = [];
  const sortedKeys = keys.sort();
  for (
    let offset = 0;
    offset < sortedKeys.length;
    offset += DURABLE_STREAM_READ_CONCURRENCY
  ) {
    const batch = sortedKeys.slice(
      offset,
      offset + DURABLE_STREAM_READ_CONCURRENCY
    );
    storedEvents.push(
      ...(await Promise.all(
        batch.map(async (key) => {
          const object = await client.send(
            new GetObjectCommand({ Bucket: config.bucketName, Key: key })
          );
          const contents = await object.Body?.transformToString();
          if (!contents) {
            throw new Error(`Durable stream event ${key} has no body`);
          }
          return JSON.parse(contents) as StoredStreamEvent;
        })
      ))
    );
  }
  return storedEvents.map((stored) => stored.event);
}

export async function writeDurableStreamReport(
  sessionId: string,
  html: string,
  events: unknown[]
): Promise<string> {
  const config = getStreamStorageConfig();
  const client = getStreamStorageClient();
  const key = `${DURABLE_STREAM_STORAGE_PREFIX}/reports/${sessionId}.html`;
  await Promise.all([
    client.send(
      new PutObjectCommand({
        Body: html,
        Bucket: config.bucketName,
        ContentType: "text/html; charset=utf-8",
        Key: key,
      })
    ),
    client.send(
      new PutObjectCommand({
        Body: `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
        Bucket: config.bucketName,
        ContentType: "application/x-ndjson; charset=utf-8",
        Key: `${DURABLE_STREAM_STORAGE_PREFIX}/streams/${sessionId}.ndjson`,
      })
    ),
  ]);
  return key;
}
