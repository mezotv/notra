import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { CLI_VERIFICATION_CODE_PATTERN } from "@/lib/cli-auth/constants";
import {
  getCliVerificationCode,
  hashCliPollSecret,
  verifyCliVerificationCode,
} from "./cli-auth";

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

describe("CLI verification code", () => {
  test("derives and verifies a stable human-readable code", () => {
    const hash = hashCliPollSecret("A".repeat(43));
    const code = getCliVerificationCode(hash);

    assert.match(code, CLI_VERIFICATION_CODE_PATTERN);
    assert.equal(getCliVerificationCode(hash), code);
    assert.equal(verifyCliVerificationCode(hash, code), true);
    assert.equal(verifyCliVerificationCode(hash, "0000-0000"), false);
  });
});
