import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { GEO_GROUNDED_ENGINES } from "../constants/geo";
import type { GeoGroundedProvider } from "../types/geo";
import { buildGroundedInvocation } from "./engines";

function getGatewayEngine(provider: GeoGroundedProvider) {
  const engine = GEO_GROUNDED_ENGINES.find(
    (candidate) => candidate.provider === provider
  );
  assert.ok(engine, `Missing grounded engine for ${provider}`);
  return engine;
}

function getProviderTool(provider: GeoGroundedProvider, toolName: string) {
  const invocation = buildGroundedInvocation(getGatewayEngine(provider));
  const providerTool = invocation.tools[toolName];
  assert.ok(providerTool, `Missing ${toolName} for ${provider}`);
  assert.equal(providerTool.type, "provider");
  return providerTool;
}

describe("grounded GEO engine tools", () => {
  test("uses OpenAI's native web search tool", () => {
    const providerTool = getProviderTool("gateway-openai", "web_search");
    assert.equal(providerTool.id, "openai.web_search");
  });

  test("uses Anthropic's native web search tool with the GEO search limit", () => {
    const providerTool = getProviderTool("gateway-anthropic", "web_search");
    assert.equal(providerTool.id, "anthropic.web_search_20250305");
    assert.deepEqual(providerTool.args, { maxUses: 3 });
  });

  test("uses Google's native search grounding tool", () => {
    const providerTool = getProviderTool("gateway-google", "google_search");
    assert.equal(providerTool.id, "google.google_search");
    assert.deepEqual(providerTool.args, {});
  });
});
