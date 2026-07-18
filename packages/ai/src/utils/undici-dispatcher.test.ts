import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getGlobalDispatcher } from "undici";
import { withLongFetchTimeouts } from "./undici-dispatcher";

describe("withLongFetchTimeouts", () => {
  test("does not replace the process dispatcher during concurrent calls", async () => {
    const routedDispatcher = getGlobalDispatcher();

    const values = await Promise.all([
      withLongFetchTimeouts(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.equal(getGlobalDispatcher(), routedDispatcher);
        return 1;
      }),
      withLongFetchTimeouts(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        assert.equal(getGlobalDispatcher(), routedDispatcher);
        return 2;
      }),
    ]);

    assert.deepEqual(values, [1, 2]);
    assert.equal(getGlobalDispatcher(), routedDispatcher);
  });
});
