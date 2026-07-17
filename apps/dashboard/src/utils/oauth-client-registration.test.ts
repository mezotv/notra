import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getDynamicClientRegistrationScope,
  hasOnlyLoopbackRedirectUris,
  isOAuthDynamicClientRegistrationPath,
  pickDynamicClientMetadata,
} from "./oauth-client-registration";

describe("hasOnlyLoopbackRedirectUris", () => {
  test("matches registration paths with trailing slashes", () => {
    assert.equal(
      isOAuthDynamicClientRegistrationPath("/api/auth/oauth2/register/"),
      true
    );
    assert.equal(
      isOAuthDynamicClientRegistrationPath("/api/auth/oauth2/register//"),
      true
    );
    assert.equal(
      isOAuthDynamicClientRegistrationPath("/api/auth/oauth2/register%2F"),
      true
    );
    assert.equal(
      isOAuthDynamicClientRegistrationPath("/api/auth//oauth2/register"),
      true
    );
    assert.equal(
      isOAuthDynamicClientRegistrationPath("/api/auth/oauth2/token/"),
      false
    );
  });

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
    assert.equal(
      hasOnlyLoopbackRedirectUris({
        redirect_uris: ["http://evil.com/callback"],
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
    assert.equal(
      hasOnlyLoopbackRedirectUris({
        redirect_uris: ["http://user:pass@localhost:4545/callback"],
      }),
      false
    );
    assert.equal(hasOnlyLoopbackRedirectUris({ redirect_uris: [] }), false);
    assert.equal(hasOnlyLoopbackRedirectUris({}), false);
  });

  test("only forwards supported dynamic client metadata", () => {
    assert.deepEqual(
      pickDynamicClientMetadata({
        redirect_uris: ["http://localhost:4545/callback"],
        client_name: "Notra CLI",
        disabled: false,
        post_logout_redirect_uris: ["https://attacker.example/logout"],
        reference_id: "another-organization",
        skip_consent: true,
        software_statement: "signed-client-metadata",
        subject_type: "pairwise",
        token_endpoint_auth_method: "client_secret_basic",
        type: "web",
      }),
      {
        redirect_uris: ["http://localhost:4545/callback"],
        client_name: "Notra CLI",
      }
    );
  });

  test("only accepts configured registration scopes", () => {
    assert.equal(
      getDynamicClientRegistrationScope({
        scope: "posts.read offline_access posts.read",
      }),
      "posts.read offline_access"
    );
    assert.equal(
      getDynamicClientRegistrationScope({ scope: "posts.read admin" }),
      null
    );
    assert.equal(getDynamicClientRegistrationScope({ scope: "" }), null);
  });
});
