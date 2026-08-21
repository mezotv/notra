import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  OPENROUTER_MODEL_ALIASES,
  VERCEL_UNSUPPORTED_MODELS,
} from "@notra/ai/constants/router";
import {
  GEO_DEFAULT_ENGINE_IDS,
  GEO_MODEL_CATALOG_SEED,
  GEO_MODEL_PROVIDERS,
  GEO_MODELS_PER_PROVIDER,
} from "@/constants/geo-model-catalog";
import type { GeoGatewayModel } from "@/types/geo";
import {
  applyGeoZdrEngineFallback,
  resolveGeoEngineGateway,
  resolveGeoZdrMode,
  resolveTrackedEngines,
  sortKnownEngines,
} from "@/utils/geo-engines";
import {
  buildGeoModelCatalogFromFeed,
  geoDefaultEngines,
  seedGeoModelCatalog,
} from "@/utils/geo-model-catalog";

const catalog = seedGeoModelCatalog();
const RELEASED_BASE = 1_700_000_000;
const DAY_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DAY_SECONDS = 86_400;

function feedModel(
  id: string,
  ownedBy: string,
  daysAgo: number,
  overrides: Partial<GeoGatewayModel> = {}
): GeoGatewayModel {
  return {
    id,
    name: id.split("/")[1] ?? id,
    owned_by: ownedBy,
    type: "language",
    zdr: "all",
    released: RELEASED_BASE - daysAgo * DAY_SECONDS,
    ...overrides,
  };
}

describe("geo model catalog seed", () => {
  test("ids are unique and every provider exists", () => {
    const ids = new Set(GEO_MODEL_CATALOG_SEED.map((entry) => entry.id));
    assert.equal(ids.size, GEO_MODEL_CATALOG_SEED.length);
    const providers = new Set(GEO_MODEL_PROVIDERS.map((p) => p.id));
    for (const entry of GEO_MODEL_CATALOG_SEED) {
      assert.ok(providers.has(entry.provider), entry.id);
      assert.ok(entry.gateways.length > 0, entry.id);
    }
  });

  test("default set is derived from the seed", () => {
    assert.deepEqual(geoDefaultEngines(catalog), [...GEO_DEFAULT_ENGINE_IDS]);
    assert.ok(GEO_DEFAULT_ENGINE_IDS.length > 0);
  });

  test("OpenRouter-only models are mirrored in the router constants", () => {
    for (const entry of GEO_MODEL_CATALOG_SEED) {
      const openRouterOnly =
        entry.gateways.length === 1 && entry.gateways[0] === "openrouter";
      if (!openRouterOnly) {
        continue;
      }
      assert.ok(
        VERCEL_UNSUPPORTED_MODELS.has(entry.id),
        `${entry.id} must be listed in VERCEL_UNSUPPORTED_MODELS`
      );
      assert.equal(resolveGeoEngineGateway(catalog, entry.id), "openrouter");
    }
    for (const alias of Object.keys(OPENROUTER_MODEL_ALIASES)) {
      assert.equal(typeof alias, "string");
    }
  });
});

describe("buildGeoModelCatalogFromFeed", () => {
  test("keeps current language models from known providers", () => {
    const built = buildGeoModelCatalogFromFeed([
      feedModel("anthropic/claude-sonnet-5", "anthropic", 1),
      feedModel("anthropic/claude-sonnet-5-fast", "anthropic", 1),
      feedModel("anthropic/claude-old", "anthropic", 2, {
        deprecated_at: RELEASED_BASE,
      }),
      feedModel("google/gemini-image", "google", 1, {
        tags: ["image-generation"],
      }),
      feedModel("google/gemini-3.7-flash", "google", 1, { zdr: "some" }),
      feedModel("alibaba/qwen-3-14b", "alibaba", 1),
      feedModel("openai/whisper", "openai", 1, { type: "transcription" }),
    ]);
    assert.deepEqual(
      built.models.map((model) => model.id),
      ["anthropic/claude-sonnet-5", "google/gemini-3.7-flash"]
    );
    assert.deepEqual(
      built.providers.map((provider) => provider.id),
      ["anthropic", "google"]
    );
    assert.equal(built.models[1]?.zdr, "some");
    assert.equal(built.models[0]?.default, true);
  });

  test("caps each provider to the newest models plus defaults", () => {
    const feed: GeoGatewayModel[] = [];
    for (let index = 0; index < GEO_MODELS_PER_PROVIDER + 3; index += 1) {
      feed.push(feedModel(`openai/gpt-${index}`, "openai", index));
    }
    feed.push(feedModel("openai/gpt-5.6-sol", "openai", 400));
    const built = buildGeoModelCatalogFromFeed(feed);
    assert.equal(built.models.length, GEO_MODELS_PER_PROVIDER + 1);
    assert.equal(built.models[0]?.id, "openai/gpt-0");
    assert.ok(built.models.some((model) => model.id === "openai/gpt-5.6-sol"));
  });

  test("formats the release date from unix seconds", () => {
    const built = buildGeoModelCatalogFromFeed([
      feedModel("anthropic/claude-opus-5", "anthropic", 0),
    ]);
    assert.match(built.models[0]?.released ?? "", DAY_STRING_REGEX);
  });
});

describe("resolveGeoZdrMode", () => {
  const zdrCapable = "anthropic/claude-opus-5";
  const noZdr = "meta/muse-spark-1.2";

  test("ZDR off → preferred for every engine", () => {
    const policy = { enforceZdr: false, nonZdrApprovedEngines: [] };
    assert.equal(resolveGeoZdrMode(catalog, zdrCapable, policy), "preferred");
    assert.equal(resolveGeoZdrMode(catalog, noZdr, policy), "preferred");
  });

  test("ZDR on → required when a ZDR host exists", () => {
    const policy = { enforceZdr: true, nonZdrApprovedEngines: [] };
    assert.equal(resolveGeoZdrMode(catalog, zdrCapable, policy), "required");
  });

  test("ZDR on → skip unless the non-ZDR model was approved", () => {
    assert.equal(
      resolveGeoZdrMode(catalog, noZdr, {
        enforceZdr: true,
        nonZdrApprovedEngines: [],
      }),
      null
    );
    assert.equal(
      resolveGeoZdrMode(catalog, noZdr, {
        enforceZdr: true,
        nonZdrApprovedEngines: [noZdr],
      }),
      "preferred"
    );
  });

  test("unknown engines are treated as ZDR capable", () => {
    assert.equal(
      resolveGeoZdrMode(catalog, "vendor/unknown", {
        enforceZdr: true,
        nonZdrApprovedEngines: [],
      }),
      "required"
    );
  });
});

describe("resolveTrackedEngines", () => {
  test("drops unknown ids and falls back to defaults", () => {
    assert.deepEqual(resolveTrackedEngines(catalog, ["nope/model"]), [
      ...GEO_DEFAULT_ENGINE_IDS,
    ]);
    assert.deepEqual(resolveTrackedEngines(catalog, ["meta/muse-spark-1.2"]), [
      "meta/muse-spark-1.2",
    ]);
  });

  test("sortKnownEngines drops unknowns without falling back", () => {
    assert.deepEqual(
      sortKnownEngines(catalog, ["nope/model", "meta/muse-spark-1.2"]),
      ["meta/muse-spark-1.2"]
    );
  });
});

describe("applyGeoZdrEngineFallback", () => {
  const policy = { enforceZdr: true, nonZdrApprovedEngines: [] as string[] };

  test("drops an unapproved non-ZDR pick and falls back to ZDR defaults", () => {
    const next = applyGeoZdrEngineFallback(
      catalog,
      ["anthropic/claude-fable-5"],
      policy
    );
    assert.ok(next.includes("anthropic/claude-sonnet-5"));
    assert.ok(!next.includes("anthropic/claude-fable-5"));
  });

  test("drops providers that have no ZDR host", () => {
    const next = applyGeoZdrEngineFallback(
      catalog,
      ["meta/muse-spark-1.2", "spacexai/grok-4.6", "openai/gpt-5.4"],
      policy
    );
    assert.deepEqual(next, ["openai/gpt-5.4"]);
  });

  test("keeps an approved non-ZDR model", () => {
    const next = applyGeoZdrEngineFallback(catalog, ["meta/muse-spark-1.2"], {
      enforceZdr: true,
      nonZdrApprovedEngines: ["meta/muse-spark-1.2"],
    });
    assert.deepEqual(next, ["meta/muse-spark-1.2"]);
  });
});
