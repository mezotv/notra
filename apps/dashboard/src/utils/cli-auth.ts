import { createHash, timingSafeEqual } from "node:crypto";
import { CLI_VERIFICATION_CODE_BYTES } from "@/lib/cli-auth/constants";

export function hashCliPollSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("base64url");
}

export function getCliVerificationCode(pollSecretHash: string): string {
  const code = createHash("sha256")
    .update(`notra-cli-verification:${pollSecretHash}`)
    .digest("hex")
    .slice(0, CLI_VERIFICATION_CODE_BYTES * 2)
    .toUpperCase();

  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function verifyCliVerificationCode(
  pollSecretHash: string,
  verificationCode: string
): boolean {
  const expected = Buffer.from(getCliVerificationCode(pollSecretHash));
  const received = Buffer.from(verificationCode);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
