# React/TypeScript Standards

## Objective

Keep React + TypeScript widget code predictable, type-safe, and easy to maintain.

## TypeScript Rules

- Prefer inference and explicit interface/type definitions over type assertions.
- Avoid `as` casts unless narrowing cannot be expressed safely another way.
- Avoid `any`; use concrete types or `unknown` with safe narrowing.
- Keep API response typing close to request functions and reuse shared domain types.

## React State and Hooks Rules

- Keep `useEffect` minimal and focused on true side effects.
- Do not use `useEffect` for derivable render data.
- Avoid `setState` inside `useEffect` unless syncing from external systems or subscriptions.
- Prefer deriving values from props/query state with memoization only when needed.
- Keep a single source of truth for server state (query/cache layer or explicit request state).
- Use local state for transient UI interactions only.

## Component Design Rules

- Keep components small and composable; extract repeated logic into hooks/utilities.
- Keep event handlers explicit and colocated with relevant UI.
- Avoid deep prop drilling when existing context/provider patterns already exist.
- Use clear loading/error/empty branches instead of implicit fallthrough behavior.
- Never embed a widget directly in a page. Always extract it into its own component file. The page imports and renders that component.

## Async and Mutation Rules

- Keep async request functions separate from view rendering logic.
- Prevent duplicate submits/actions while mutations are pending.
- Reflect mutation success/failure in UI state clearly.
- Refresh or invalidate affected data after successful mutations.

## General Code Quality

- Follow existing lint/format conventions in the host project.
- Prefer readable code over clever abstractions.
- Keep changes scoped to widget integration; avoid unrelated refactors.
