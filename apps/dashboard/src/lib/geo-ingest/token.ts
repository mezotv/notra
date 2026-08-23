import { createHmac, timingSafeEqual } from "node:crypto";
import {
  GEO_INGEST_SECRET_ENV,
  GEO_INGEST_SECRET_FALLBACK_ENV,
  GEO_INGEST_TOKEN_SEPARATOR,
} from "@/constants/geo";
import type { GeoIngestIdentity } from "@/types/geo";

const GENERATION_SEGMENT_REGEX = /^g\d+$/;

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
  projectId: string | undefined,
  generation: number
): string | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }
  const segments = [organizationId];
  if (projectId) {
    segments.push(projectId);
  }
  if (generation > 1) {
    segments.push(`g${generation}`);
  }
  const payload = segments.join(GEO_INGEST_TOKEN_SEPARATOR);
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

  const segments = payload.split(GEO_INGEST_TOKEN_SEPARATOR);
  let generation = 1;
  const last = segments.at(-1);
  if (segments.length > 1 && last && GENERATION_SEGMENT_REGEX.test(last)) {
    generation = Number.parseInt(last.slice(1), 10);
    segments.pop();
  }

  const [organizationId, projectId] = segments;
  if (!organizationId) {
    return null;
  }

  return { organizationId, projectId: projectId || null, generation };
}
