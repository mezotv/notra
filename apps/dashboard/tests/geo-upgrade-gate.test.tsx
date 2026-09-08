import { beforeEach, describe, expect, mock, test } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

const geoFeature = mock(() => ({ isLocked: false, isLoading: true }));

mock.module("@/lib/hooks/use-plan", () => ({
  useHasGeoFeature: geoFeature,
}));
mock.module("next/navigation", () => ({
  usePathname: () => "/fixture/geo/gaps",
  useRouter: () => ({ push: mock() }),
}));
mock.module("@/components/billing/geo-upgrade-dialog", () => ({
  GeoUpgradeDialog: () => <div>Upgrade required</div>,
}));
mock.module("@/components/empty-state-preview", () => ({
  EmptyStateAnalyticsPreview: () => null,
}));
mock.module("@/lib/analytics/posthog-client", () => ({ trackEvent: mock() }));
mock.module("@/lib/hooks/use-sidebar-mode", () => ({
  pickSidebarMode: mock(),
}));

const { GeoUpgradeGate } =
  await import("../src/components/geo/geo-upgrade-gate");

beforeEach(() => {
  geoFeature.mockReturnValue({ isLocked: false, isLoading: true });
});

describe("GEO billing gate", () => {
  test("renders the page while billing loads instead of a blank content area", () => {
    const html = renderToStaticMarkup(
      <GeoUpgradeGate slug="fixture">
        <h1>Content Gaps</h1>
      </GeoUpgradeGate>
    );

    expect(html).toContain("Content Gaps");
    expect(html).not.toContain("Upgrade required");
  });

  test("renders the page for a confirmed entitled customer", () => {
    geoFeature.mockReturnValue({ isLocked: false, isLoading: false });
    const html = renderToStaticMarkup(
      <GeoUpgradeGate slug="fixture">
        <h1>Content Gaps</h1>
      </GeoUpgradeGate>
    );

    expect(html).toContain("Content Gaps");
    expect(html).not.toContain("Upgrade required");
  });

  test("keeps the paywall and excludes page children for a confirmed locked customer", () => {
    geoFeature.mockReturnValue({ isLocked: true, isLoading: false });
    const html = renderToStaticMarkup(
      <GeoUpgradeGate slug="fixture">
        <h1>Protected page content</h1>
      </GeoUpgradeGate>
    );

    expect(html).toContain("Upgrade required");
    expect(html).not.toContain("Protected page content");
  });
});
