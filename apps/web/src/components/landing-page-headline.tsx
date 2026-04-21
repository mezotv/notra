"use client";

import {
  getLandingPageH1Copy,
  LANDING_PAGE_H1_EXPERIMENT_KEY,
  LANDING_PAGE_H1_TEAM_MARKETER_COPY,
  LANDING_PAGE_H1_TEAM_MARKETER_VARIANT,
} from "@/utils/databuddy";
import { getStorageKey, useCachedFlag } from "@/utils/feature-flag-cache";

const HEADLINE_DATA_ATTR = "data-landing-h1";

// Map of variant → copy. Kept in sync with `getLandingPageH1Copy` and inlined
// into the pre-hydration script below so we don't need to ship the helper
// function inside the inline script string.
const VARIANT_COPIES: Record<string, string> = {
  [LANDING_PAGE_H1_TEAM_MARKETER_VARIANT]: LANDING_PAGE_H1_TEAM_MARKETER_COPY,
};

const STORAGE_KEY = getStorageKey(LANDING_PAGE_H1_EXPERIMENT_KEY);

// Inline blocking script that runs synchronously while the HTML is being
// parsed. By the time the parser reaches this <script> the <h1> above is
// already in the DOM, so we can rewrite its textContent to the cached variant
// before the browser paints — eliminating the SSR default → cached variant
// flicker for returning visitors.
const PRE_HYDRATION_SCRIPT = `
(function(){
  try {
    var raw = window.localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var variant = parsed && parsed.variant;
    if (!variant) return;
    var copies = ${JSON.stringify(VARIANT_COPIES)};
    var copy = copies[variant];
    if (!copy) return;
    var el = document.querySelector('[${HEADLINE_DATA_ATTR}]');
    if (el && el.textContent !== copy) {
      el.textContent = copy;
    }
  } catch (e) {}
})();
`;

export function LandingPageHeadline({ className }: { className?: string }) {
  const { variant } = useCachedFlag(LANDING_PAGE_H1_EXPERIMENT_KEY);

  // On the server, `variant` is `undefined` → control copy is rendered.
  // On the client, `useCachedFlag` reads localStorage synchronously via
  // `useSyncExternalStore`, so the very first client render already matches the
  // text the inline pre-hydration script wrote into the DOM. Combined with
  // `suppressHydrationWarning` on the h1, returning visitors get their cached
  // variant on first paint with no flicker.
  return (
    <>
      <h1 className={className} data-landing-h1="" suppressHydrationWarning>
        {getLandingPageH1Copy(variant)}
      </h1>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: required for blocking pre-hydration script that prevents H1 flicker */}
      <script dangerouslySetInnerHTML={{ __html: PRE_HYDRATION_SCRIPT }} />
    </>
  );
}
