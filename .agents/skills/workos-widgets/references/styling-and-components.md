# Styling and Components

## Objective

Match widget UI to the host application's existing component and styling systems.

## Do

- Use detected styling approach (Tailwind, CSS, CSS Modules, SCSS, styled-components, Emotion).
- Prefer existing shared UI components before introducing new primitives.
- Keep naming and file placement aligned with existing conventions.
- Add only minimal new styles required for widget UX.

## Don't

- Don't introduce a new styling system when one is already established; if in doubt, confirm with the user.
- Don't break or modify existing styles outside widget integration scope.
- Don't break established spacing/typography conventions.
- Don't override existing component styles by passing `className` or `style` props to components that already have their own styling. Use `<Button>` as-is, never `<Button className="bg-red-500">`. If customization is needed, use the component's own API (e.g. `variant`, `size` props).

## Component System Notes

- shadcn: use existing shadcn components; add missing components through shadcn CLI only when required by widget behavior.
- radix/base-ui/react-aria/ariakit/ark-ui: follow current primitive and composition conventions already used in the repo.
- custom/none: implement simple, maintainable UI with the detected styling system and avoid overengineering.
