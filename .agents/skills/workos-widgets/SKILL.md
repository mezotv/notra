---
name: workos-widgets
description: Use when the user is implementing, embedding, or debugging a WorkOS Widget — specifically the User Management, User Profile, Admin Portal SSO Connection, or Admin Portal Domain Verification widgets. Handles the full stack — detecting the frontend (Next.js, React, React Router, TanStack Start, Vite, SvelteKit), generating access tokens via the backend SDK in use (Node, Python, Go, Ruby, PHP, Java, .NET), and wiring up the widget component correctly per the bundled OpenAPI spec. Also use when code imports from @workos-inc/widgets or the user pastes <UserManagement /> or <UserProfile /> JSX.
---

# WorkOS Widgets

## Workflow Overview

1. Identify widget target from the user request (`user-management`, `user-profile`, `admin-portal-sso-connection`, `admin-portal-domain-verification`).
2. Scan project files in this order:
   - package/dependency manifests
   - framework/router entrypoints
   - auth/token utilities
   - styling/component patterns
3. Detect stack, data-layer style, styling, component system, and package manager using [references/detection.md](references/detection.md).
4. Check for AuthKit/WorkOS presence:
   - if detected, continue;
   - if not detected, ask the user to run `WORKOS_MODE=agent npx workos@latest install`. Wait for confirmation, then continue.
5. If detection is ambiguous or conflicting, ask one focused question, then continue.
6. Load only the relevant reference files for the detected stack and widget.
7. Implement integration based on stack shape:
   - frontend route/page + widget component when widget UI lives in the same app
   - token endpoint/service + client integration surface when backend-first/multi-app architecture is detected
8. Validate routing/wiring, imports, and token/API usage before finishing.

## Canonical Inputs

Accept these inputs from the user request when available:

- widget type (or infer from request intent)
- optional component path
- optional page/route path
- optional token endpoint/service preference
- optional constraints (for example: avoid broad refactors)

When input is missing, infer from existing project conventions and detected stack.

## Detection and Ambiguity Protocol

- Apply detection heuristics from [references/detection.md](references/detection.md).
- Explore before asking. Ask only when ambiguity remains after checking manifests and route/auth entrypoints.
- Ask a single concrete question that resolves one decision.
- Default to the strongest detected ownership signals when no user response is available.
- When installs are required, use the package manager detected from project files/lockfiles.

## Reference Loading Map

Always load these core references:

- [references/detection.md](references/detection.md)
- [references/token-strategies.md](references/token-strategies.md)
- [references/fetching-apis.md](references/fetching-apis.md)
- [references/styling-and-components.md](references/styling-and-components.md)

For React/TypeScript stacks (Next.js, React Router, TanStack Router, TanStack Start, Vite), also load:

- [references/react-ts-standards.md](references/react-ts-standards.md)

Load stack-specific reference guidance:

- Next.js: [references/framework-nextjs.md](references/framework-nextjs.md)
- React Router: [references/framework-react-router.md](references/framework-react-router.md)
- TanStack Router: [references/framework-tanstack-router.md](references/framework-tanstack-router.md)
- TanStack Start: [references/framework-tanstack-start.md](references/framework-tanstack-start.md)
- Vite: [references/framework-vite.md](references/framework-vite.md)
- SvelteKit: [references/framework-sveltekit.md](references/framework-sveltekit.md)
- Ruby: [references/framework-ruby.md](references/framework-ruby.md)
- Python: [references/framework-python.md](references/framework-python.md)
- Go: [references/framework-go.md](references/framework-go.md)
- PHP: [references/framework-php.md](references/framework-php.md)
- Java: [references/framework-java.md](references/framework-java.md)
- Mixed repositories: [references/framework-mixed-repositories.md](references/framework-mixed-repositories.md)

Then load exactly one widget reference:

- User Management: [references/widget-user-management.md](references/widget-user-management.md)
- User Profile: [references/widget-user-profile.md](references/widget-user-profile.md)
- Admin Portal SSO Connection: [references/widget-admin-portal-sso-connection.md](references/widget-admin-portal-sso-connection.md)
- Admin Portal Domain Verification: [references/widget-admin-portal-domain-verification.md](references/widget-admin-portal-domain-verification.md)

## Global Widget Guidance

- Implement widget operations using endpoint paths/methods from [references/fetching-apis.md](references/fetching-apis.md). When building request bodies or parsing responses, query the OpenAPI spec for the relevant widget's schemas:
  ```bash
  node references/scripts/query-spec.cjs --widget <widget-name>
  ```
  Use `--list` to see available widget groups.
- Keep loading, empty, and error states explicit and user-visible.
- Keep mutation outcomes visible and refresh/reload affected data after successful changes.
- Align table/list/action UI with existing project conventions.
- Keep behavior resilient for partial/optional data and avoid brittle UI assumptions.

## Core Guidelines

- Reuse existing domain types from the host project and OpenAPI schemas; avoid duplicating model definitions.
- Build widget requests using [references/fetching-apis.md](references/fetching-apis.md) for paths, methods, and schema queries.
- Use direct `fetch`/HTTP calls (or equivalent server HTTP client) for endpoint calls.
- Implement a consistent authorization layer for widget requests, including elevated-token handling for sensitive endpoints when required.
- If the app already uses React Query or SWR, use them as orchestration/cache layers around those direct calls.
- For React/TypeScript widget code quality expectations, follow [references/react-ts-standards.md](references/react-ts-standards.md).
- If AuthKit/WorkOS is missing, prompt the user to run `WORKOS_MODE=agent npx workos@latest install` before continuing. `WORKOS_MODE=agent` keeps the installer deterministic (no prompts, no browser, no host-trust); pass `--json` when you need to parse the output.
- Install additional dependencies only when strictly necessary, using the detected package manager/tooling.
- Keep server-state handling aligned with the selected data-layer approach.
- Use local state/reducers for UI interaction state as needed.
- Prefer existing design system and styling conventions.
- Avoid broad unrelated refactors and global style rewrites.

## Completion Requirements

Before finishing, verify all relevant items:

1. Widget component exists and accepts `accessToken: string` when component-level integration is in scope.
2. Route/page wiring is complete when route integration is in scope.
3. Token source matches existing app architecture (AuthKit client flow or backend WorkOS token flow).
4. API methods and paths match the bundled OpenAPI spec, and data-layer usage matches project conventions.
5. Loading and error branches exist for required query/mutation flows.

## Validation Checklist

1. Confirm endpoint paths and HTTP methods come from the bundled OpenAPI spec.
2. Confirm request/response handling follows schema expectations from the spec.
3. Confirm query/mutation invalidation/refetch is applied after successful mutations where required.
4. Confirm empty/error/loading states are explicit and user-visible.
5. Confirm package installs (if any) used the detected package manager/tooling.
6. Confirm implementation stays aligned with existing codebase conventions.
7. Confirm no existing component has been passed `className` or `style` props to override its built-in styling. Use each component as-is or via its own props API (`variant`, `size`, etc.).
