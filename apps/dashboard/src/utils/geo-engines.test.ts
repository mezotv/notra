import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  OPENROUTER_MODEL_ALIASES,
  VERCEL_UNSUPPORTED_MODELS,
} from "@notra/ai/constants/router";
import { GEO_DEFAULT_ENGINES, GEO_ENGINES } from "@/constants/geo";
import {
  GEO_MODEL_CATALOG,
  GEO_MODEL_PROVIDERS,
} from "@/constants/geo-model-catalog";
import type { GeoModelCatalogEntry } from "@/types/geo";
import {
  applyGeoZdrEngineFallback,
  enginesForProviderToggle,
  resolveGeoEngineGateway,
  resolveGeoScanEngine,
  resolveGeoZdrMode,
  resolveTrackedEngines,
  sortKnownEngines,
} from "@/utils/geo-engines";

describe("geo model catalog", () => {
  test("ids are unique and every provider exists", () => {
    const ids = new Set(GEO_MODEL_CATALOG.map((entry) => entry.id));
    assert.equal(ids.size, GEO_MODEL_CATALOG.length);
    const providers = new Set(GEO_MODEL_PROVIDERS.map((p) => p.id));
    for (const entry of GEO_MODEL_CATALOG) {
      assert.ok(providers.has(entry.provider), entry.id);
      assert.ok(entry.gateways.length > 0, entry.id);
    }
  });

  test("default set is derived from the catalog", () => {
    assert.deepEqual(
      [...GEO_DEFAULT_ENGINES],
      GEO_MODEL_CATALOG.filter((entry) => entry.default).map((e) => e.id)
    );
    assert.equal(GEO_ENGINES.length, GEO_MODEL_CATALOG.length);
  });

  test("OpenRouter-only models are mirrored in the router constants", () => {
    const entries: readonly GeoModelCatalogEntry[] = GEO_MODEL_CATALOG;
    for (const entry of entries) {
      const openRouterOnly =
        entry.gateways.length === 1 && entry.gateways[0] === "openrouter";
      if (!openRouterOnly) {
        continue;
      }
      assert.ok(
        VERCEL_UNSUPPORTED_MODELS.has(entry.id),
        `${entry.id} must be listed in VERCEL_UNSUPPORTED_MODELS`
      );
      assert.equal(resolveGeoEngineGateway(entry.id), "openrouter");
    }
    for (const alias of Object.keys(OPENROUTER_MODEL_ALIASES)) {
      assert.equal(typeof alias, "string");
    }
  });
});

describe("resolveGeoZdrMode", () => {
  const zdrCapable = "anthropic/claude-opus-5";
  const noZdr = "meta/muse-spark-1.2";

  test("ZDR off → preferred for every engine", () => {
    const policy = { enforceZdr: false, nonZdrApprovedEngines: [] };
    assert.equal(resolveGeoZdrMode(zdrCapable, policy), "preferred");
    assert.equal(resolveGeoZdrMode(noZdr, policy), "preferred");
  });

  test("ZDR on → required when a ZDR host exists", () => {
    const policy = { enforceZdr: true, nonZdrApprovedEngines: [] };
    assert.equal(resolveGeoZdrMode(zdrCapable, policy), "required");
  });

  test("ZDR on → skip unless the non-ZDR model was approved", () => {
    assert.equal(
      resolveGeoZdrMode(noZdr, { enforceZdr: true, nonZdrApprovedEngines: [] }),
      null
    );
    assert.equal(
      resolveGeoZdrMode(noZdr, {
        enforceZdr: true,
        nonZdrApprovedEngines: [noZdr],
      }),
      "preferred"
    );
  });

  test("unknown engines are treated as ZDR capable", () => {
    assert.equal(
      resolveGeoZdrMode("vendor/unknown", {
        enforceZdr: true,
        nonZdrApprovedEngines: [],
      }),
      "required"
    );
  });
});

describe("resolveTrackedEngines", () => {
  test("drops unknown ids and falls back to defaults", () => {
    assert.deepEqual(resolveTrackedEngines(["nope/model"]), [
      ...GEO_DEFAULT_ENGINES,
    ]);
    assert.deepEqual(resolveTrackedEngines(["meta/muse-spark-1.2"]), [
      "meta/muse-spark-1.2",
    ]);
  });

  test("sortKnownEngines drops unknowns without falling back", () => {
    assert.deepEqual(sortKnownEngines(["nope/model", "meta/muse-spark-1.2"]), [
      "meta/muse-spark-1.2",
    ]);
  });
});

describe("enginesForProviderToggle", () => {
  test("Anthropic defaults stay ZDR-capable", () => {
    const ids = enginesForProviderToggle("anthropic", true);
    assert.ok(ids.length > 0);
    assert.ok(ids.every((id) => !id.includes("fable")));
  });

  test("Meta has no ZDR sibling, so the toggle enables nothing", () => {
    assert.deepEqual(enginesForProviderToggle("meta", true), []);
    assert.deepEqual(enginesForProviderToggle("spacexai", true), []);
  });
});

describe("applyGeoZdrEngineFallback", () => {
  const policy = { enforceZdr: true, nonZdrApprovedEngines: [] as string[] };

  test("replaces a non-ZDR Anthropic pick with the ZDR defaults", () => {
    const next = applyGeoZdrEngineFallback(
      ["anthropic/claude-fable-5"],
      policy
    );
    assert.ok(next.includes("anthropic/claude-sonnet-5"));
    assert.ok(!next.includes("anthropic/claude-fable-5"));
  });

  test("drops providers that have no ZDR host", () => {
    const next = applyGeoZdrEngineFallback(
      ["meta/muse-spark-1.2", "spacexai/grok-4.6", "openai/gpt-5.4"],
      policy
    );
    assert.deepEqual(next, ["openai/gpt-5.4"]);
  });

  test("keeps an approved non-ZDR model", () => {
    const next = applyGeoZdrEngineFallback(["meta/muse-spark-1.2"], {
      enforceZdr: true,
      nonZdrApprovedEngines: ["meta/muse-spark-1.2"],
    });
    assert.deepEqual(next, ["meta/muse-spark-1.2"]);
  });
});

describe("resolveGeoScanEngine", () => {
  const policy = { enforceZdr: true, nonZdrApprovedEngines: [] as string[] };

  test("falls back to a ZDR sibling on the same provider", () => {
    const resolved = resolveGeoScanEngine(
      "anthropic/claude-fable-5",
      policy,
      new Set()
    );
    assert.equal(resolved?.engine, "anthropic/claude-sonnet-5");
    assert.equal(resolved?.zdr, "required");
  });

  test("does not duplicate a sibling that is already occupied", () => {
    const resolved = resolveGeoScanEngine(
      "anthropic/claude-fable-5",
      policy,
      new Set([
        "anthropic/claude-opus-5",
        "anthropic/claude-sonnet-5",
        "anthropic/claude-haiku-4.5",
      ])
    );
    assert.equal(resolved, null);
  });

  test("returns null when the provider has no ZDR host", () => {
    assert.equal(
      resolveGeoScanEngine("meta/muse-spark-1.2", policy, new Set()),
      null
    );
  });
});
