# Notra Dashboard UI Audit Action Plan

Date: 2026-05-06  
Scope: manual dashboard walkthrough in browser tab `http://localhost:3000/erf/logs`, plus source-code reference pass for the dashboard app.

## Evidence reviewed

- Live UI walkthrough: Home, Content, Create Content dialog, Chat, Logs, and sidebar navigation.
- Browser console: 3 errors / warnings observed.
- Source references under `apps/dashboard/src`.
- Screenshots captured during audit are in agent attachments, including:
  - `att/notra-afte_n4vsqas5.png` — Home
  - `att/notra-cont_hmi486do.png` — Content
  - `att/notra-crea_nys82u0j.png` — Create Content dialog
  - `att/notra-logs_gy5nohvv.png` — Logs

---

## Priority 0 — fix broken or misleading navigation

### 1. Schedules route uses the wrong path in multiple places

**Impact**  
Users clicking **Schedules** can be routed to a non-existent path or get a stale/incorrect navigation experience. The app has a route for `automation/schedules`, but navigation references `automation/schedule`.

**Observed/code evidence**

- Existing route file:
  - `apps/dashboard/src/app/(dashboard)/[slug]/automation/schedules/page.tsx`
- No route file exists for:
  - `apps/dashboard/src/app/(dashboard)/[slug]/automation/schedule/page.tsx`
- Broken references:
  - `apps/dashboard/src/components/dashboard/nav-main.tsx:73` — `link: "/automation/schedule"`
  - `apps/dashboard/src/components/command-palette/registry.ts:66` — `path: (slug) => `/${slug}/automation/schedule``
  - `apps/dashboard/src/components/dashboard/sidebar-onboarding.tsx:71` — `href: `/${slug}/automation/schedule``
  - `apps/dashboard/src/app/(dashboard)/[slug]/integrations/github/[id]/page-client.tsx:419` and `:464` — links to `/${slug}/automation/schedule`

**Action steps**

1. Replace every `/automation/schedule` reference with `/automation/schedules`.
2. Add a redirect from the old singular route to the plural route if existing users may have bookmarked it.
   - Best place: Next middleware/proxy or a route-level `redirect()` shim if preferred.
3. Add a route smoke test or Playwright assertion:
   - Click **Schedules** in sidebar.
   - Assert URL is `/{slug}/automation/schedules`.
   - Assert page heading is `Schedules`.
4. Re-test command palette navigation for **Schedules**.
5. Re-test onboarding checklist item **Create a schedule**.

**Suggested patch pattern**

```ts
// apps/dashboard/src/components/dashboard/nav-main.tsx
{
  link: "/automation/schedules",
  icon: Calendar03Icon,
  label: "Schedules",
  category: "automation",
}
```

```ts
// apps/dashboard/src/components/command-palette/registry.ts
path: (slug) => `/${slug}/automation/schedules`,
```

```ts
// apps/dashboard/src/components/dashboard/sidebar-onboarding.tsx
href: `/${slug}/automation/schedules`,
```

---

### 2. Chat route changes the entire sidebar model abruptly

**Impact**  
Clicking **Chat** shifts the user from the normal app navigation into a chat-only sidebar with **Back**, **New chat**, **Recents**, and **Settings**. It feels like switching products rather than moving to another dashboard section.

**Code references**

- `apps/dashboard/src/components/dashboard/app-sidebar.tsx:56-59`
  - `isChatRoute` marks chat as a subpage.
- `apps/dashboard/src/components/dashboard/app-sidebar.tsx:86-106`
  - Back button only appears for settings/chat subpages.
- `apps/dashboard/src/components/dashboard/app-sidebar.tsx:123-137`
  - Chat replaces the main nav with `ChatHistoryNav` and `NavSecondary`.

**Action steps**

1. Decide whether Chat is a top-level dashboard section or a sub-product.
2. If top-level section:
   - Remove `isChatRoute` from `isSubpage`.
   - Keep `NavMain` visible on chat routes.
   - Render chat history as secondary content inside the Chat page, not as the whole sidebar.
3. If sub-product:
   - Make the transition explicit with a heading like `Chat workspace`.
   - Keep a persistent, clearly labeled `Back to dashboard` button.
   - Consider preserving the org selector and key global nav items.
4. Add a keyboard and screen-reader check for the back behavior.

**Recommended direction**  
Treat Chat as a top-level dashboard section unless chat history genuinely needs the whole sidebar. The current replacement pattern costs orientation.

---

## Priority 1 — fix blocked flows and unclear disabled states

### 3. Create Content disabled Continue button does not explain why it is disabled

**Impact**  
The user sees a filled-out form and a disabled **Continue** button. The reason is only inferable: no integrations selected/connected. This is a common conversion-killer.

**Code references**

- `apps/dashboard/src/components/content/create-content-dialog.tsx:911-989`
  - Integrations form field.
- `apps/dashboard/src/components/content/create-content-dialog.tsx:916-925`
  - Empty integration state: `No integrations connected.` + Add button.
- `apps/dashboard/src/components/content/create-content-dialog.tsx:1283-1295`
  - Footer with disabled `Continue`.
- `apps/dashboard/src/components/content/create-content-dialog.tsx:1288`
  - `disabled={repositoryIds.length === 0}`

**Action steps**

1. Add explicit disabled-state help text in the footer when `repositoryIds.length === 0`.
2. Make the Integrations empty state more explanatory and action-oriented.
3. Keep the `Continue` button disabled, but pair it with the requirement.
4. Ensure the message changes after an integration is selected.

**Suggested UI text**

- Empty state: `Connect at least one integration so Notra has activity data to generate from.`
- Footer hint: `Select or add an integration to continue.`

**Suggested patch pattern**

```tsx
// apps/dashboard/src/components/content/create-content-dialog.tsx
{step === "configure" && (
  <div className="flex items-center justify-between gap-3">
    {repositoryIds.length === 0 ? (
      <p className="text-muted-foreground text-xs">
        Select or add an integration to continue.
      </p>
    ) : (
      <span />
    )}
    <Button
      disabled={repositoryIds.length === 0}
      onClick={handleContinue}
      type="button"
    >
      Continue
    </Button>
  </div>
)}
```

---

### 4. Integrations empty state in Create Content is too weak for a required step

**Impact**  
The dialog depends on integrations, but the empty state is a terse dashed box. It does not explain what integrations unlock or which integrations are supported.

**Code references**

- `apps/dashboard/src/components/content/create-content-dialog.tsx:916-925`

**Action steps**

1. Replace the single-line text with a two-line empty state.
2. Use the full width to explain the requirement.
3. Make the CTA label specific: `Connect integration` or `Connect GitHub/Linear` instead of just `Add`.
4. If only GitHub/Linear are valid sources for generation, say that explicitly.

**Suggested copy**

```tsx
<p className="font-medium text-sm">No integrations connected</p>
<p className="text-muted-foreground text-xs">
  Connect GitHub or Linear so Notra can pull recent activity for this content.
</p>
```

---

## Priority 1 — improve empty states and data clarity

### 5. Home empty state conflicts with yearly activity summary

**Impact**  
Home says **No content created today**, while the activity graph below shows total posts. This can be technically correct, but it reads as contradictory without time-range context.

**Code references**

- `apps/dashboard/src/app/(dashboard)/[slug]/page-client.tsx:105-110`
  - EmptyState copy: `No content created today`.
- `apps/dashboard/src/app/(dashboard)/[slug]/page-client.tsx:121-143`
  - Today’s Content and Content Activity sections are adjacent.
- `apps/dashboard/src/components/dashboard/content-activity-card.tsx:106-120`
  - Footer summary: `posts (drafts / published)`.

**Action steps**

1. Make the empty state explicitly scoped to today.
2. Make the graph footer explicitly scoped to year/all-time, depending on what the API returns.
3. Consider using `This year:` before the graph summary.

**Suggested copy changes**

```tsx
// apps/dashboard/src/app/(dashboard)/[slug]/page-client.tsx
<EmptyState
  className="p-6"
  description="You have no new posts today. Create one now or review your existing drafts below."
  title="No content created today"
/>
```

```tsx
// apps/dashboard/src/components/dashboard/content-activity-card.tsx
<span className="text-muted-foreground text-sm">
  This year: ...
</span>
```

---

### 6. Logs empty state looks unfinished

**Impact**  
The Logs page shows a large table with a single `No results.` row. It does not explain whether there are no webhook events yet, filters removed the results, or logs are unavailable due retention.

**Code references**

- `apps/dashboard/src/app/(dashboard)/[slug]/logs/page-client.tsx:117-126`
  - `filtersActive` and `resetFilters` already exist.
- `apps/dashboard/src/app/(dashboard)/[slug]/logs/page-client.tsx:231-237`
  - `DataTable` receives only table data and pagination.
- `apps/dashboard/src/app/(dashboard)/[slug]/logs/data-table.tsx:102-110`
  - Empty state: `No results.`
- `apps/dashboard/src/app/(dashboard)/[slug]/logs/data-table.tsx:115-137`
  - Pagination always renders.

**Action steps**

1. Pass an explicit `emptyState` prop to `DataTable`.
2. Use different copy for no logs vs filtered-out logs.
3. Hide pagination when `totalPages <= 1` and there are no rows.
4. Keep a reset button near the empty state when filters are active.

**Suggested patch pattern**

```tsx
// apps/dashboard/src/app/(dashboard)/[slug]/logs/page-client.tsx
<DataTable
  columns={columns}
  data={data?.logs ?? []}
  emptyState={
    filtersActive
      ? {
          title: "No logs match your filters",
          description: "Try a different search, source, or status.",
          actionLabel: "Reset filters",
          onActionClick: resetFilters,
        }
      : {
          title: "No webhook events yet",
          description: "Events will appear here after connected integrations deliver activity.",
        }
  }
  onPageChange={setPage}
  page={page}
  totalPages={data?.pagination.totalPages ?? 1}
/>
```

```tsx
// apps/dashboard/src/app/(dashboard)/[slug]/logs/data-table.tsx
interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    actionLabel?: string;
    onActionClick?: () => void;
  };
}
```

---

### 7. Logs pagination should not render as usable controls when there is only one page

**Impact**  
`Page 1 of 1`, `Previous`, and `Next` appear even when there are no results. This adds disabled UI noise.

**Code references**

- `apps/dashboard/src/app/(dashboard)/[slug]/logs/data-table.tsx:115-137`

**Action steps**

1. Hide pagination when `totalPages <= 1` and `data.length === 0`.
2. Optionally hide previous/next buttons when `totalPages <= 1` even with rows.
3. If pagination remains, use stronger disabled styling.

**Suggested patch**

```tsx
const showPagination = totalPages > 1 || data.length > 0;

{showPagination ? (
  <div className="flex items-center justify-between py-4">
    ...
  </div>
) : null}
```

---

## Priority 2 — polish content cards and dashboard density

### 8. Content card titles truncate too aggressively

**Impact**  
Cards show titles like `One-Click Approval for AI Dr...` even when the grid has room to provide more context. This makes cards harder to distinguish.

**Code references**

- `apps/dashboard/src/components/content/content-card.tsx:142-144`
  - Title uses `truncate`.
- `apps/dashboard/src/components/content/content-card.tsx:188-190`
  - Preview uses `line-clamp-3`.

**Action steps**

1. Replace single-line title truncation with two-line clamping.
2. Rebalance preview height if needed.
3. Keep card height consistent across grid/list views.

**Suggested patch**

```tsx
// apps/dashboard/src/components/content/content-card.tsx
<p className="min-w-0 line-clamp-2 font-medium text-lg leading-snug">
  {title}
</p>
```

---

### 9. Content card preview area feels heavier than metadata

**Impact**  
The dark inset preview dominates the card while the status/type metadata feels cramped. The card hierarchy is slightly off.

**Code references**

- `apps/dashboard/src/components/content/content-card.tsx:133-206`

**Action steps**

1. Reduce preview inset contrast.
2. Consider making the whole card background lighter and the preview unboxed.
3. Increase vertical spacing around badges.
4. Confirm hover/focus state still clearly communicates clickability.

**Suggested class changes to test**

```tsx
// Current
"flex-1 rounded-[0.75rem] border border-border/80 bg-background px-4 py-3"

// Try
"flex-1 rounded-md bg-background/60 px-3 py-2.5"
```

---

### 10. Dashboard activity graph width can feel arbitrary

**Impact**  
The graph uses `w-fit`, so the card width is content-driven and can look visually detached from the rest of the page grid.

**Code references**

- `apps/dashboard/src/components/dashboard/content-activity-card.tsx:52`
  - `className="w-fit ..."`
- `apps/dashboard/src/app/(dashboard)/[slug]/page-client.tsx:135-143`

**Action steps**

1. Test replacing `w-fit` with `w-full overflow-x-auto`.
2. Keep the graph scrollable horizontally on narrow screens.
3. Align the card width with the Today’s Content section.

**Suggested patch**

```tsx
<div className="w-full overflow-x-auto rounded-lg border border-border/80 bg-background px-4 py-3">
```

---

## Priority 2 — sidebar and onboarding polish

### 11. Getting Started card is visually heavy and persistent

**Impact**  
The onboarding checklist competes with primary navigation on every page until dismissed/collapsed. It looks like a floating card inside the sidebar rather than a secondary helper.

**Code references**

- `apps/dashboard/src/components/dashboard/app-sidebar.tsx:149-153`
  - Sidebar bottom stack: trial expired, onboarding, upgrade, secondary nav.
- `apps/dashboard/src/components/dashboard/sidebar-onboarding.tsx:79-172`
  - Full checklist rendering.
- `apps/dashboard/src/components/dashboard/sidebar-onboarding.tsx:20`
  - Collapse state stored globally as `onboarding-collapsed`.

**Action steps**

1. Default to collapsed after first completed step, not only after manual collapse.
2. Scope collapsed state per organization instead of global localStorage key.
3. Reduce expanded visual weight: smaller header, less padding, no card-like shadow/border if present in the UI component.
4. Move to a dashboard home card if it remains too intrusive in the sidebar.

**Suggested storage change**

```ts
const storageKey = orgId ? `onboarding-collapsed:${orgId}` : STORAGE_KEY;
```

---

### 12. Search button looks like an input but uses cursor-help

**Impact**  
The sidebar Search control looks like a search input, but it opens the command palette. `cursor-help` is misleading.

**Code references**

- `apps/dashboard/src/components/dashboard/nav-main.tsx:192-204`
- `apps/dashboard/src/components/dashboard/nav-main.tsx:194`
  - `className="cursor-help ..."`

**Action steps**

1. Replace `cursor-help` with `cursor-pointer`.
2. Consider label `Search or jump to...` if space allows.
3. Ensure `aria-label`/tooltip says `Open command palette` rather than just `Search`.

**Suggested patch**

```tsx
<SidebarMenuButton
  className="cursor-pointer border border-sidebar-border/60"
  onClick={() => setCommandPaletteOpen(true)}
  tooltip="Open command palette"
>
```

---

## Priority 2 — header clarity

### 13. Credit balance button lacks semantic clarity

**Impact**  
A wallet icon plus `$11.91` is visually clean but ambiguous. Users cannot tell if it means credits, balance, monthly spend, or budget.

**Code references**

- `apps/dashboard/src/components/dashboard/header.tsx:40-42`
  - Imports credit balance components.
- `apps/dashboard/src/components/dashboard/header.tsx:201-203`
  - `CreditBalanceButton` in header.
- Likely implementation file:
  - `apps/dashboard/src/components/billing/credit-balance-button.tsx`

**Action steps**

1. Add tooltip copy: `Credit balance` or `Available credits`.
2. If the value is money, label as `Credits: $11.91` in expanded contexts.
3. For mobile menu, keep the same label so the meaning is consistent.

---

### 14. Breadcrumb labels are generated from URL segments and can be too generic

**Impact**  
The header breadcrumb is mostly mechanical. For pages like integrations, settings, or nested content detail pages, generated labels can be less helpful than explicit route metadata.

**Code references**

- `apps/dashboard/src/components/dashboard/header.tsx:52-55`
  - `SEGMENT_CONFIG` only customizes `billing` and `automation`.
- `apps/dashboard/src/components/dashboard/header.tsx:135-184`
  - Breadcrumb generation from segments.

**Action steps**

1. Extend `SEGMENT_CONFIG` for high-traffic segments:
   - `api-keys` → `API Keys`
   - `brand` → non-clickable group or `Brand`
   - `identity` → `Identity & References`
   - `schedules` → `Schedules`
2. Avoid showing purely structural segments when they do not help orientation.
3. For detail pages, use fetched entity names where available.

---

## Priority 3 — accessibility and micro-interactions

### 15. Icon-only controls need stronger accessible names and hover/focus consistency

**Impact**  
The UI relies on icon recognition: sidebar toggle, card kebab menus, grid/list view toggle, info icon, modal close, and header more menu. Some have `sr-only` or `aria-label`; this should be audited consistently.

**Code references**

- `apps/dashboard/src/components/content/content-card.tsx:145-155`
  - Card menu trigger has `sr-only` text.
- `apps/dashboard/src/app/(dashboard)/[slug]/logs/page-client.tsx:134-148`
  - Logs info tooltip trigger.
- `apps/dashboard/src/components/dashboard/header.tsx:227-239`
  - Mobile menu has `aria-label="More actions"`.
- Create Content dialog close is likely provided by `ResponsiveDialogContent` internals; verify accessible label in `@notra/ui`.

**Action steps**

1. Tab through all icon-only controls.
2. Confirm visible focus ring on every control.
3. Confirm accessible names with browser accessibility tree.
4. Add `aria-label` where only tooltip/sr-only text is missing.
5. Ensure tooltip-only information is not required to complete a task.

---

### 16. Disabled buttons need reason text when they block a flow

**Impact**  
Disabled states are acceptable for obvious cases, but not when the user must infer missing requirements.

**Code references**

- `apps/dashboard/src/components/content/create-content-dialog.tsx:1288`
  - Continue disabled by missing repository IDs.
- `apps/dashboard/src/components/content/create-content-dialog.tsx:1307-1311`
  - Create content disabled during pending/loading/no event selection.
- `apps/dashboard/src/app/(dashboard)/[slug]/logs/data-table.tsx:120-134`
  - Previous/Next disabled at boundaries.

**Action steps**

1. Add inline reason text for blocked primary actions.
2. For pagination, hide unavailable controls when they add no value.
3. For selection-dependent actions, show `Select at least one event to create content`.

---

## Priority 3 — technical console cleanup

### 17. Consent banner fetch errors are present in console

**Observed console errors**

```text
Error fetching consent banner information: Error: Failed to fetch consent banner info: undefined
```

**Impact**  
This is noisy and can hide real regressions. It may also indicate a broken consent/privacy integration.

**Action steps**

1. Identify the consent manager integration path.
   - Likely related: `apps/dashboard/src/lib/consent-manager/theme.ts`
2. Reproduce on local dashboard load.
3. Check network request URL and response status.
4. Add graceful fallback if consent config is unavailable.
5. Prevent duplicate logging of the same error.

---

### 18. CSP blocks an inline GitHub assets script

**Observed console error**

```text
Executing inline script violates the following Content Security Policy directive 'script-src github.githubassets.com'.
```

**Impact**  
This may be benign if it is from an embedded GitHub context, but it should be understood. CSP errors in production erode confidence and can indicate integration breakage.

**Action steps**

1. Determine which page/action triggers GitHub asset loading.
2. Confirm whether this is from GitHub OAuth, GitHub repository previews, or an embedded asset.
3. Avoid adding `unsafe-inline` unless absolutely necessary.
4. Prefer nonce/hash-based CSP only if the inline script is controlled and required.
5. If the script is third-party and non-critical, suppress the embed or isolate it.

---

## Suggested implementation order

1. Fix `/automation/schedule` → `/automation/schedules` references.
2. Improve Create Content disabled reason and integration empty state.
3. Upgrade Logs empty state and hide no-op pagination.
4. Clarify Home empty state vs yearly activity summary.
5. Reduce sidebar onboarding weight and fix command-palette search affordance.
6. Polish content cards: two-line titles, lighter preview region.
7. Add accessibility pass for icon-only controls and disabled states.
8. Clean console errors.

---

## Verification checklist

Use this after implementation:

- [ ] Sidebar **Schedules** opens `/{slug}/automation/schedules` and shows the Schedules page.
- [ ] Command palette **Schedules** opens the same route.
- [ ] Onboarding **Create a schedule** opens the same route.
- [ ] Create Content dialog explains why **Continue** is disabled when no integration is selected.
- [ ] Create Content dialog empty integrations state clearly explains what to connect and why.
- [ ] Logs page with no logs shows a descriptive empty state, not just `No results.`
- [ ] Logs pagination is hidden or visually minimized when only one page exists.
- [ ] Home copy distinguishes today’s content from yearly/all-time activity.
- [ ] Content card titles can wrap to two lines without breaking card layout.
- [ ] Sidebar Search uses pointer cursor and command-palette-specific labeling.
- [ ] Credit balance has tooltip/label explaining what the value means.
- [ ] Browser console is free of consent/CSP errors during normal dashboard navigation.
- [ ] Keyboard tab order and focus rings work for sidebar, header, content cards, dialogs, filters, and pagination.
