import { createHmac, timingSafeEqual } from "node:crypto";
import {
  GEO_INGEST_SECRET_ENV,
  GEO_INGEST_SECRET_FALLBACK_ENV,
  GEO_INGEST_TOKEN_SEPARATOR,
} from "@/constants/geo";

export function getGeoIngestSecret(): string | null {
  const secret =
    process.env[GEO_INGEST_SECRET_ENV] ??
    process.env[GEO_INGEST_SECRET_FALLBACK_ENV];
  return secret && secret.length > 0 ? secret : null;
}

function getSecret(): string | null {
  return getGeoIngestSecret();
}

export function isGeoIngestConfigured(): boolean {
  return getSecret() !== null;
}

function sign(organizationId: string, secret: string): string {
  return createHmac("sha256", secret).update(organizationId).digest("hex");
}

export function buildGeoIngestToken(organizationId: string): string | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }
  const signature = sign(organizationId, secret);
  return `${organizationId}${GEO_INGEST_TOKEN_SEPARATOR}${signature}`;
}

export function verifyGeoIngestToken(token: string): string | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(GEO_INGEST_TOKEN_SEPARATOR);
  if (separatorIndex <= 0) {
    return null;
  }

  const organizationId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expected = sign(organizationId, secret);
  if (signature.length !== expected.length) {
    return null;
  }

  const matches = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
  return matches ? organizationId : null;
}
