import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { hasOnlyLoopbackRedirectUris } from "./oauth-client-registration";

describe("hasOnlyLoopbackRedirectUris", () => {
  test("allows HTTP loopback callbacks", () => {
    assert.equal(
      hasOnlyLoopbackRedirectUris({
        redirect_uris: [
          "http://127.0.0.1:4545/callback",
          "http://[::1]:4545/callback",
          "http://localhost:4545/callback",
        ],
      }),
      true
    );
  });

  test("rejects remote callbacks", () => {
    assert.equal(
      hasOnlyLoopbackRedirectUris({
        redirect_uris: ["https://attacker.example/callback"],
      }),
      false
    );
  });

  test("rejects credentials and malformed metadata", () => {
    assert.equal(
      hasOnlyLoopbackRedirectUris({
        redirect_uris: ["http://user@localhost:4545/callback"],
      }),
      false
    );
    assert.equal(hasOnlyLoopbackRedirectUris({ redirect_uris: [] }), false);
    assert.equal(hasOnlyLoopbackRedirectUris({}), false);
  });
});
