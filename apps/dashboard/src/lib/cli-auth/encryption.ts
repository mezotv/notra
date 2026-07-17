import {
  decodeIntegrationEncryptionKey,
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from "@notra/db/utils/integration-encryption";

const ENCRYPTED_VALUE_PREFIX = "v1:";

function getCliApiKeyEncryptionKey() {
  return decodeIntegrationEncryptionKey(process.env.INTEGRATION_ENCRYPTION_KEY);
}

export function encryptCliApiKey(apiKey: string) {
  return encryptIntegrationSecret(apiKey, getCliApiKeyEncryptionKey());
}

export function decryptCliApiKey(value: string) {
  if (!value.startsWith(ENCRYPTED_VALUE_PREFIX)) {
    return value;
  }

  return decryptIntegrationSecret(value, getCliApiKeyEncryptionKey());
}
