import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildIngestToken, verifyIngestToken } from "./ingest-token";

const SECRET = "test-secret";
const PREFIX = "nfb_";

describe("ingest token", () => {
  test("round-trips an organization-scoped token", () => {
    const token = buildIngestToken({
      secret: SECRET,
      prefix: PREFIX,
      organizationId: "org_1",
      generation: 1,
    });
    assert.ok(token.startsWith(PREFIX));
    assert.deepEqual(
      verifyIngestToken({ secret: SECRET, prefix: PREFIX, token }),
      {
        organizationId: "org_1",
        projectId: null,
        generation: 1,
      }
    );
  });

  test("encodes project and generation segments", () => {
    const token = buildIngestToken({
      secret: SECRET,
      prefix: PREFIX,
      organizationId: "org_1",
      projectId: "proj_9",
      generation: 3,
    });
    assert.deepEqual(
      verifyIngestToken({ secret: SECRET, prefix: PREFIX, token }),
      {
        organizationId: "org_1",
        projectId: "proj_9",
        generation: 3,
      }
    );
  });

  test("rejects a tampered signature", () => {
    const token = buildIngestToken({
      secret: SECRET,
      prefix: PREFIX,
      organizationId: "org_1",
      generation: 1,
    });
    const tampered = `${token.slice(0, -1)}${token.endsWith("0") ? "1" : "0"}`;
    assert.equal(
      verifyIngestToken({ secret: SECRET, prefix: PREFIX, token: tampered }),
      null
    );
  });

  test("rejects a different secret or prefix", () => {
    const token = buildIngestToken({
      secret: SECRET,
      prefix: PREFIX,
      organizationId: "org_1",
      generation: 1,
    });
    assert.equal(
      verifyIngestToken({ secret: "other", prefix: PREFIX, token }),
      null
    );
    assert.equal(
      verifyIngestToken({ secret: SECRET, prefix: "geo_", token }),
      null
    );
  });
});
