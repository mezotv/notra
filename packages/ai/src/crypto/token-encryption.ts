import {
  decodeIntegrationEncryptionKey,
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from "@notra/db/utils/integration-encryption";

function getEncryptionKey() {
  return decodeIntegrationEncryptionKey(process.env.INTEGRATION_ENCRYPTION_KEY);
}

export function encryptToken(token: string) {
  return encryptIntegrationSecret(token, getEncryptionKey());
}

export function decryptToken(encryptedToken: string) {
  return decryptIntegrationSecret(encryptedToken, getEncryptionKey());
}
