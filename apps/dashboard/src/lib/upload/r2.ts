import { S3Client } from "@aws-sdk/client-s3";

function getR2Env() {
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

  return {
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    publicUrl,
  };
}

export function getR2Client() {
  const env = getR2Env();

  return new S3Client({
    region: "auto",
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
}

export function getR2BucketName() {
  return getR2Env().bucketName;
}

export function getR2PublicUrl() {
  return getR2Env().publicUrl;
}
