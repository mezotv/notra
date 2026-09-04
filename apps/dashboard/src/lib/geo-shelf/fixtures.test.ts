import { describe, expect, test } from "bun:test";

import { buildGeoShelfFixture } from "./fixtures";

const context = {
  ownBrandName: "Notra",
  ownDomain: "notra.ai",
  competitors: [],
  engines: [],
  members: [],
  now: new Date("2026-09-04T00:00:00.000Z"),
};

describe("buildGeoShelfFixture", () => {
  test("scopes source and opportunity ids to the project", () => {
    const first = buildGeoShelfFixture(context, {
      organizationId: "organization-1",
      projectId: "project-1",
    });
    const second = buildGeoShelfFixture(context, {
      organizationId: "organization-1",
      projectId: "project-2",
    });

    const firstSourceIds = new Set(first.map((source) => source.id));
    const firstOpportunityIds = new Set(
      first.flatMap((source) =>
        source.opportunity ? [source.opportunity.id] : []
      )
    );

    expect(second.every((source) => !firstSourceIds.has(source.id))).toBeTrue();
    expect(
      second.every(
        (source) =>
          !source.opportunity || !firstOpportunityIds.has(source.opportunity.id)
      )
    ).toBeTrue();
  });
});
