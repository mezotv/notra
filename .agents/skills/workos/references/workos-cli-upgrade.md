# WorkOS CLI Upgrades

## Docs

- npm package: https://www.npmjs.com/package/workos
- Releases / changelog: https://github.com/workos/cli/releases

If this file conflicts with fetched docs, follow the docs.

Use this when the user is running an outdated `workos` CLI and you need to recommend an upgrade. Symptoms include `unknown command`, missing flags shown in newer docs, or the user explicitly asking how to update the CLI.

## Detecting an outdated CLI

- Confirm the user's running version with `workos --version`.
- Confirm the latest published version with `npm view workos version` (or `npm view workos dist-tags`). **Do NOT guess.** The latest version moves frequently and any number you reproduce from memory is almost certainly stale.
- If running version < latest, recommend the upgrade command for the user's package manager (table below).
- If you cannot determine how the user installed the CLI, recommend `npx workos@latest <command>` as a no-install fallback so they can unblock immediately.

## Upgrade commands by package manager

| Package manager | One-shot upgrade               | No-install alternative |
| --------------- | ------------------------------ | ---------------------- |
| npm             | `npm install -g workos@latest` | `npx workos@latest`    |
| pnpm            | `pnpm add -g workos@latest`    | `pnpm dlx workos`      |

The CLI is published to npm. If the user is on a different package manager, suggest the `npx workos@latest` no-install form so they can unblock immediately.

After upgrading, have the user re-run `workos --version` to confirm the new version is on PATH (a stale shim from a different package manager can shadow the upgrade — `workos doctor` flags this in newer CLI versions).

## What NOT to do

- **Do NOT guess the "latest" version.** Always tell the user to run `npm view workos version`. A fabricated version pin (`workos@0.13.0` when the real latest is `0.14.2`) leaves the user pinned to a stale install with no obvious symptom.
- **Do NOT recommend `npm uninstall -g workos && npm install -g workos`** as a default upgrade path. `workos@latest` reinstalls in place. Suggest uninstall-then-reinstall only if the user reports a corrupted install or a binary-shadow warning from `workos doctor`.
- **Do NOT pin to a specific version** unless the user explicitly asks (e.g. "I need to stay on 0.12.x for CI"). Default to `@latest`.
- **Do NOT mix package managers.** If the user installed via npm, recommend the npm upgrade command — a `pnpm add -g` on top of a global npm install can leave two `workos` binaries on PATH. When unsure which one they used, prefer the no-install `npx workos@latest` form.
- **Do NOT recommend Homebrew, asdf, or other version managers.** The CLI is published to npm only. If the user mentions a non-npm install, treat it as out-of-scope and point them to the npm package URL above.

## Gotchas

- **Global install on Node managed by `nvm` / `fnm` / `volta`**: each Node version has its own global prefix. Switching Node versions can make `workos` "disappear" until the user reinstalls under the new Node. The fix is to reinstall, not to chase the missing binary.
- **`npx` cache**: `npx workos@latest` may serve a cached older version on the first invocation after a release. Re-running once usually picks up the new tarball.
- **Corporate proxies / private registries**: if `npm view workos version` errors, the user may be on a private registry that mirrors npm. Have them check `npm config get registry`; recommendations above assume the public npm registry.
