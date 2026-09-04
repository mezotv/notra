import { describe, expect, test } from "bun:test";

import type { GeoChangeEvent } from "@notra/geo-core/types/geo";

import {
  describeGeoChangeDetail,
  geoChangePositionSortValue,
} from "./geo-changes";

const baseEvent: GeoChangeEvent = {
  kind: "lost_mention",
  promptId: "prompt-1",
  prompt: "How can I improve AI search visibility for my brand?",
  engine: "google/gemini-2.5-pro",
  previous: { mentioned: true, position: 2 },
  current: { mentioned: false, position: null },
  competitors: [],
  domains: [],
};

describe("describeGeoChangeDetail", () => {
  test("describes a lost mention with before and after states", () => {
    const detail = describeGeoChangeDetail(baseEvent);
    expect(detail.title).toBe("Lost mention");
    expect(detail.engine).toBe("Gemini");
    expect(detail.before).toBe("#2");
    expect(detail.after).toBe("Not mentioned");
    expect(detail.note).toBeNull();
  });

  test("lists competitors when the brand was displaced", () => {
    const detail = describeGeoChangeDetail({
      ...baseEvent,
      kind: "competitor_displaced",
      competitors: ["Copy.ai", "HubSpot", "Notion"],
    });
    expect(detail.note).toBe("Now recommended: Copy.ai, HubSpot and Notion");
  });

  test("lists domains for citation changes", () => {
    const detail = describeGeoChangeDetail({
      ...baseEvent,
      kind: "citation_removed",
      previous: { mentioned: true, position: null },
      current: { mentioned: true, position: null },
      domains: ["example.com", "docs.example.com"],
    });
    expect(detail.before).toBe("Mentioned");
    expect(detail.after).toBe("Mentioned");
    expect(detail.note).toBe(
      "Citations dropped: example.com, docs.example.com"
    );
  });

  test("marks a missing previous state for new engines", () => {
    const detail = describeGeoChangeDetail({
      ...baseEvent,
      kind: "new_engine",
      previous: null,
      current: { mentioned: true, position: 1 },
    });
    expect(detail.before).toBe("New");
    expect(detail.after).toBe("#1");
  });
});

describe("geoChangePositionSortValue", () => {
  test("sorts unmentioned rows last", () => {
    expect(geoChangePositionSortValue(baseEvent)).toBe(Number.MAX_SAFE_INTEGER);
    expect(
      geoChangePositionSortValue({
        ...baseEvent,
        current: { mentioned: true, position: 3 },
      })
    ).toBe(3);
  });
});
