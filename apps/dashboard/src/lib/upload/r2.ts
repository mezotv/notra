import { S3Client } from "@aws-sdk/client-s3";

type R2Env = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  publicUrl: string;
};

let cachedR2Client: S3Client | undefined;
let cachedR2Env: R2Env | undefined;

function getR2Env() {
  if (cachedR2Env) {
    return cachedR2Env;
  }

  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;
  const endpoint = process.env.CLOUDFLARE_S3_ENDPOINT;
  const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;

  if (
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !endpoint ||
    !publicUrl
  ) {
    throw new Error("Missing R2 environment variables");
  }

  cachedR2Env = {
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    publicUrl,
  };

  return cachedR2Env;
}

export function getR2Client() {
  if (cachedR2Client) {
    return cachedR2Client;
  }

  const env = getR2Env();

  cachedR2Client = new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });

  return cachedR2Client;
}

export function getR2Config() {
  const env = getR2Env();

  return {
    bucketName: env.bucketName,
    client: getR2Client(),
    publicUrl: env.publicUrl,
  };
}

export function getR2BucketName() {
  return getR2Env().bucketName;
}

export function getR2PublicUrl() {
  return getR2Env().publicUrl;
}
