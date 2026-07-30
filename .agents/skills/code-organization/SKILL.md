---
name: code-organization
description: Repo file-organization convention for TypeScript projects. ALWAYS use this when creating new files or deciding where code goes — types, schemas, validation, utility/helper functions, constants, enums, and config literals each belong in their own dedicated folder, not inline next to feature code or dumped in one grab-bag file. Use whenever you add a type/interface, a validation schema, a util/helper, a constant, or are asked where something should live, how to structure the repo, or to organize/refactor file layout.
---

# code-organization

Where each kind of code goes. Apply this **every time** you create a file or
add a type, schema, helper, or constant. Don't inline them next to feature
code and don't pile unrelated things into one file.

## Layout

Each category gets its **own dedicated folder**. Files inside a folder are
grouped by domain (e.g. `user`, `post`), not by individual symbol.

```
src/
  types/        type & interface definitions        types/user.ts
  schemas/      validation schemas (zod, yup, etc.) schemas/user.ts
  utils/        helper / utility functions          utils/format.ts
  constants/    constant values, enums, config      constants/routes.ts
```

## Rules

1. **One folder per category** — `types/`, `schemas/`, `utils/`, `constants/`.
   A new type goes in `types/`, never inline in the file that uses it or
   alongside a component.

2. **Group files by domain inside a folder.** All user-related types live in
   `types/user.ts`; all user-related constants in `constants/user.ts`. Split a
   file once it covers clearly separate domains — not per symbol.

3. **Functions get their own file.** A reusable helper lives in `utils/` in a
   file named for what it does (`utils/format.ts`, `utils/slugify.ts`). Keep one
   focused concern per file; don't accumulate a `utils/index.ts` junk drawer.

4. **No barrel files.** Do **not** add `index.ts` re-export barrels. Import
   directly from the specific file:

   ```ts
   import { formatDate } from "@/utils/format";   // ✓
   import { formatDate } from "@/utils";           // ✗ no barrel
   ```

   This keeps imports explicit and avoids circular-import and tree-shaking
   surprises.

5. **Types vs schemas are separate concerns.** `types/` holds pure TypeScript
   type/interface declarations. `schemas/` holds runtime validation schemas. If
   a type is derived from a schema, infer it in `types/` and import the schema —
   keep the validator in `schemas/`.

## Where does it go?

| You're adding… | Folder | Example file |
|---|---|---|
| `type` / `interface` | `types/` | `types/user.ts` |
| validation / parse schema | `schemas/` | `schemas/user.ts` |
| pure helper function | `utils/` | `utils/format.ts` |
| constant, enum, config literal | `constants/` | `constants/routes.ts` |
| React component, route, feature code | feature dir | `user/profile.tsx` |

## Gotchas

- **A one-off type still goes in `types/`.** "It's only used here" is not a
  reason to inline it — consistency is the point. The next person looks in
  `types/` first.
- **Don't create a barrel to shorten imports.** Rule 4 is deliberate; longer
  import paths are the trade-off, and they're worth it.
- **`utils/` is not a dumping ground.** If a helper is specific to one feature
  and never reused, it can live with that feature — `utils/` is for genuinely
  shared helpers.
- **Match the existing folder names in the repo** if it already has `types/` /
  `lib/` / `helpers/`. Follow what's there rather than introducing a parallel
  set of folders.
