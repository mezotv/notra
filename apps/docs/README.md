# Notra Documentation

The product guides and API reference at [docs.usenotra.com](https://docs.usenotra.com), built with [Blume](https://useblume.dev).

## Development

Use the repository's Bun installation and workspace dependencies. From the repository root:

```bash
bun run dev --filter=docs
```

The docs run at `http://localhost:3005`. To open a browser automatically, run `bun run --cwd apps/docs open`.

## Content and configuration

- `docs/` contains all authored MDX guides. File paths determine page URLs.
- `public/` contains the logos, favicon, screenshots, Context7 metadata, and OpenAPI snapshot.
- `blume.config.ts` configures the site, search, SEO, analytics, and API reference.
- `src/constants/navigation.ts` preserves the Documentation and API Reference tabs and their ordered groups.
- `src/constants/redirects.ts` preserves published URLs. API operations now live under `/api/endpoints`, with permanent redirects from all previously published operation URLs.
- `theme.css` handles themed screenshots and the footer. Native Blume components provide cards, callouts, steps, tabs, and accordions.

Page metadata includes the original `docolin` data, validated by `src/schemas/frontmatter.ts`. Builds include local search, canonical metadata, sitemaps, `llms.txt`, `llms-full.txt`, and Markdown versions of the documentation.

The direct runtime dependencies in `package.json` are intentional. They make the server imports visible to Vercel's dependency tracer when Bun uses its isolated linker, so the deployed Ask AI and MCP handlers can load their dependencies.

## API reference

Blume generates an interactive reference from `public/openapi.json`. This checked-in snapshot keeps builds reproducible and independent of live API availability. To refresh it from the public API:

```bash
bun run --cwd apps/docs openapi:sync
bun run --cwd apps/docs openapi:check
```

Review the snapshot diff and update the endpoint navigation when operations change. Keep redirects for previously published URLs. The browser playground sends requests directly to `https://api.usenotra.com`; the API permits the production docs origin through CORS. Requests still require the API's normal authentication.

## Checks

From the repository root:

```bash
bun run --cwd apps/docs validate
bun run check-types --filter=docs
bun run build --filter=docs
```

Stop the docs development server before running a build or preview. Use `bun run --cwd apps/docs preview` to build with the Node adapter and inspect production rendering locally on port 3005. The regular build always targets Vercel. To check types while the development server is running, use `bun run --cwd apps/docs check-types --isolated`.

## Deployment

Deploy to Vercel with `apps/docs` as the project root and include files outside the root directory so Bun can resolve the workspace. The checked-in `vercel.json` configures installation and building. Select Node 24.x on Vercel; the repository's local toolchain uses Node 24.11.1. Blume writes Vercel Build Output API artifacts to `.vercel/output`; leave the Vercel output-directory override unset.

Guides and API pages are prerendered. Vercel serves the Ask AI endpoint and the docs MCP server at `/mcp`, and applies the published URL redirects from its generated routing configuration. Keep the canonical domain `docs.usenotra.com` when cutting over hosting. Deploy the API CORS change alongside the docs so the browser playground can make authenticated API requests.

Ask AI uses Vercel AI Gateway. Set `AI_GATEWAY_API_KEY` in the docs project's environment, or use Vercel's Gateway OIDC authentication. For local development, the root `bun run dev --filter=docs` command loads the repository root `.env`. Commands run directly with `--cwd apps/docs` use `apps/docs/.env.local` or an exported environment variable instead. No database is needed. Search, copying Markdown, opening a page in a chat service, and MCP use the generated documentation corpus. See the [Blume AI guide](https://useblume.dev/docs/configuration/ai) for provider options.
