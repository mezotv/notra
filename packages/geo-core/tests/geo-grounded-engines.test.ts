import { describe, expect, test } from "bun:test";

import {
  GEO_MODEL_CATALOG_SEED,
  GEO_MODEL_PROVIDERS,
} from "../src/constants/geo-model-catalog";
import type { GeoModelCatalog } from "../src/types/geo";
import { engineModelOf } from "../src/utils/geo-engine-family";
import {
  resolveGroundedEngineByKey,
  resolveGroundedEngines,
} from "../src/utils/geo-grounded-engines";

const catalog: GeoModelCatalog = {
  providers: [...GEO_MODEL_PROVIDERS],
  models: [...GEO_MODEL_CATALOG_SEED],
};

describe("selected grounded engines", () => {
  test("only plans selected models, even when older models remain in the catalog", () => {
    const selected = ["anthropic/claude-sonnet-5", "openai/gpt-5.6-sol"];
    const engines = resolveGroundedEngines(selected, catalog);
    expect(engines.map((engine) => engineModelOf(engine.key)).join(",")).toBe(
      selected.join(",")
    );
    expect(engines.map((engine) => engine.label).join(",")).toBe(
      "Claude Sonnet 5,GPT-5.6 Sol"
    );
    expect(
      engines.map((engine) => engine.model.split("/").at(-1)).join(",")
    ).toBe("claude-sonnet-5,gpt-5.6-sol");
    for (const engine of engines) {
      expect(resolveGroundedEngineByKey(engine.key)?.model).toBe(engine.model);
      expect(resolveGroundedEngineByKey(engine.key)?.provider).toBe(
        engine.provider
      );
    }
  });

  test("empty or unsupported selections do not inject default search models", () => {
    expect(resolveGroundedEngines([], catalog).length).toBe(0);
    expect(resolveGroundedEngines(["unlisted/model"], catalog).length).toBe(0);
    expect(resolveGroundedEngines(["moonshotai/kimi-k3"], catalog).length).toBe(
      0
    );
  });

  test("none of the six legacy web-search routes are added to a selection", () => {
    const legacyKeys = [
      "openai/gpt-5.4-grounded",
      "anthropic/claude-sonnet-4.6-grounded",
      "google/gemini-3-flash-grounded",
      "openai-direct-grounded",
      "anthropic-direct-grounded",
      "perplexity-sonar",
    ];
    const engines = resolveGroundedEngines(
      ["anthropic/claude-sonnet-5"],
      catalog
    );
    for (const key of legacyKeys) {
      expect(engines.some((engine) => engine.key === key)).toBe(false);
    }
    expect(engines.length).toBe(1);
  });

  test("deduplicates selected models", () => {
    expect(
      resolveGroundedEngines(
        ["anthropic/claude-sonnet-5", "anthropic/claude-sonnet-5"],
        catalog
      ).length
    ).toBe(1);
  });

  test("new catalog models work without adding version constants", () => {
    const futureCatalog: GeoModelCatalog = {
      providers: catalog.providers,
      models: [
        {
          id: "google/gemini-test-version",
          provider: "google",
          label: "Gemini test version",
          zdr: "all",
          released: "2099-01-01",
          default: false,
          gateways: ["vercel"],
        },
      ],
    };
    const engine = resolveGroundedEngines(
      ["google/gemini-test-version"],
      futureCatalog
    )[0];
    expect(engine?.model).toBe("google/gemini-test-version");
    expect(engine?.label).toBe("Gemini test version");
    const openRouterCatalog: GeoModelCatalog = {
      ...futureCatalog,
      models: futureCatalog.models.map((model) => ({
        ...model,
        gateways: ["openrouter"],
      })),
    };
    expect(
      resolveGroundedEngines(["google/gemini-test-version"], openRouterCatalog)
        .length
    ).toBe(0);
  });

  test("queued keys preserve the exact model rather than using a default", () => {
    expect(
      resolveGroundedEngineByKey("anthropic/claude-sonnet-5-grounded")?.model
    ).toBe("anthropic/claude-sonnet-5");
    expect(
      resolveGroundedEngineByKey("anthropic/claude-sonnet-4.6-grounded")?.model
    ).toBe("anthropic/claude-sonnet-4.6");
    expect(resolveGroundedEngineByKey("anthropic/claude-sonnet-5")).toBe(null);
  });

  test("historical direct results group under the actual model", () => {
    expect(engineModelOf("anthropic-direct-grounded")).toBe(
      "anthropic/claude-sonnet-4.6"
    );
    expect(engineModelOf("openai-direct-grounded")).toBe("openai/gpt-5.4");
    expect(engineModelOf("perplexity-sonar")).toBe("perplexity/sonar");
  });
});
