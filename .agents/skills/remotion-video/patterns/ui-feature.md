# Pattern: ui-feature

## When to Use

- New UI component, page, layout, or theme
- Visual redesign
- New interaction pattern (drag-drop, keyboard shortcut, etc.)

## Scene Sequence (30s target)

1. **HookTitle** (0-3s) — Result or Pattern-interrupt bias
2. **BeforeAfter** (3-15s) — screenshots / mock components; old UX vs new UX
3. **BulletList** (15-25s) — 3 key benefits (rule of three from short-form research)
4. **CTAEndScreen** (25-30s)

## Code Handling

**No code scenes** by default. UI features are visual; code would be distracting. If the feature includes an API surface, consider inserting one `CodeSnippet` scene between BeforeAfter and BulletList.

## Hook Pattern Bias

Strong fit:
- Result (`"Dark mode in two clicks"`)
- Pattern-interrupt (`"Your settings page is broken"`)
- Mistake (`"You've been hiding this menu wrong"`)

Weaker fit: Comparison (usually no natural alternative to compare against), Curiosity-gap (UI payoffs are visual, not question-driven).

## Example

PR: new command palette component with fuzzy search.

- HookTitle: `"Every action, one keystroke"` (Result, 4 words)
- BeforeAfter: old nested menu (5 clicks to find setting) vs command palette (cmd-K + 3 chars)
- BulletList: "Fuzzy match. Keyboard-first. Theme-aware."
- CTAEndScreen: "Try it. Cmd-K."
