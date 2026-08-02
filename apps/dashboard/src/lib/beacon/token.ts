import { createHmac, timingSafeEqual } from "node:crypto";
import { BEACON_INGEST_SECRET_ENV } from "@/constants/geo";

function getSecret(): string | null {
  const secret = process.env[BEACON_INGEST_SECRET_ENV];
  return secret && secret.length > 0 ? secret : null;
}

function isBeaconConfigured(): boolean {
  return getSecret() !== null;
}

export function deriveBeaconToken(organizationId: string): string | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }
  return createHmac("sha256", secret).update(organizationId).digest("hex");
}

export function verifyBeaconToken(
  organizationId: string,
  token: string
): boolean {
  const expected = deriveBeaconToken(organizationId);
  if (!expected || expected.length !== token.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
