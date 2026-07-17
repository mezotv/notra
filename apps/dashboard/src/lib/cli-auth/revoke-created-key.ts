import { unkey } from "@/lib/api-keys/unkey";
import {
  CLI_KEY_REVOCATION_MAX_ATTEMPTS,
  CLI_KEY_REVOCATION_RETRY_DELAY_MS,
} from "@/lib/cli-auth/constants";

function waitForRetry(attempt: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, CLI_KEY_REVOCATION_RETRY_DELAY_MS * attempt);
  });
}

export async function revokeCreatedCliApiKey(keyId: string) {
  if (!unkey) {
    return false;
  }

  let lastError: unknown;
  for (
    let attempt = 1;
    attempt <= CLI_KEY_REVOCATION_MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      await unkey.keys.deleteKey({ keyId });
      return true;
    } catch (error) {
      lastError = error;
      if (attempt < CLI_KEY_REVOCATION_MAX_ATTEMPTS) {
        await waitForRetry(attempt);
      }
    }
  }

  console.error("[CLI Auth] Failed to revoke unstored API key:", {
    keyId,
    error: lastError,
  });
  return false;
}
