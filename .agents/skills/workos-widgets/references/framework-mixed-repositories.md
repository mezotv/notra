# Framework: Mixed Repositories

## Objective

Handle repositories with multiple apps/services by integrating widgets at existing boundaries.

## Guidance

- Detect which app owns widget UI rendering.
- Detect which service owns authenticated token generation.
- Keep each side in its native conventions and integrate through existing API boundaries.
- Avoid broad architecture moves when additive wiring is enough.
- If unsure, prompt the user.
