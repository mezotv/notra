import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { decryptCliApiKey, encryptCliApiKey } from "./encryption";

const ORIGINAL_ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY;

describe("CLI API key encryption", () => {
  beforeEach(() => {
    process.env.INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      "base64"
    );
  });

  afterEach(() => {
    if (ORIGINAL_ENCRYPTION_KEY === undefined) {
      Reflect.deleteProperty(process.env, "INTEGRATION_ENCRYPTION_KEY");
      return;
    }
    process.env.INTEGRATION_ENCRYPTION_KEY = ORIGINAL_ENCRYPTION_KEY;
  });

  it("round-trips encrypted keys without storing plaintext", () => {
    const apiKey = "notra_cli_secret";
    const encrypted = encryptCliApiKey(apiKey);

    assert.equal(encrypted.startsWith("v1:"), true);
    assert.equal(encrypted.includes(apiKey), false);
    assert.equal(decryptCliApiKey(encrypted), apiKey);
  });

  it("supports legacy plaintext handoffs during rolling deployments", () => {
    assert.equal(decryptCliApiKey("legacy_cli_secret"), "legacy_cli_secret");
  });
});
