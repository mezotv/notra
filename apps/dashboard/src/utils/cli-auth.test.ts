import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { hashCliPollSecret } from "./cli-auth";

const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

describe("hashCliPollSecret", () => {
  test("returns a stable base64url SHA-256 digest", () => {
    const secret = "A".repeat(43);
    const hash = hashCliPollSecret(secret);

    assert.equal(hash.length, 43);
    assert.match(hash, BASE64URL_REGEX);
    assert.equal(hashCliPollSecret(secret), hash);
    assert.notEqual(hashCliPollSecret("B".repeat(43)), hash);
  });
});
