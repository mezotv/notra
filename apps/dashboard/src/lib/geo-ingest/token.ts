import { createHmac, timingSafeEqual } from "node:crypto";
import {
  GEO_INGEST_SECRET_ENV,
  GEO_INGEST_SECRET_FALLBACK_ENV,
  GEO_INGEST_TOKEN_SEPARATOR,
} from "@/constants/geo";
import type { GeoIngestIdentity } from "@/types/geo";

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

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildGeoIngestToken(
  organizationId: string,
  projectId?: string
): string | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }
  const payload = projectId
    ? `${organizationId}${GEO_INGEST_TOKEN_SEPARATOR}${projectId}`
    : organizationId;
  const signature = sign(payload, secret);
  return `${payload}${GEO_INGEST_TOKEN_SEPARATOR}${signature}`;
}

export function verifyGeoIngestToken(token: string): GeoIngestIdentity | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(GEO_INGEST_TOKEN_SEPARATOR);
  if (separatorIndex <= 0) {
    return null;
  }

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expected = sign(payload, secret);
  if (signature.length !== expected.length) {
    return null;
  }

  const matches = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
  if (!matches) {
    return null;
  }

  const payloadSeparatorIndex = payload.indexOf(GEO_INGEST_TOKEN_SEPARATOR);
  if (payloadSeparatorIndex <= 0) {
    return { organizationId: payload, projectId: null };
  }

  return {
    organizationId: payload.slice(0, payloadSeparatorIndex),
    projectId: payload.slice(payloadSeparatorIndex + 1) || null,
  };
}
