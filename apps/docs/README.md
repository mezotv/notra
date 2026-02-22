# Notra Documentation

Documentation for Notra and its API!


## Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mint):

```bash
npm i -g mint
```

Start the development server:

```bash
mint dev
```

Alternatively, if you do not want to install the CLI globally, you can run a one-time script:

```bash
npx mint dev
```

## OpenAPI auto-generated API pages

`docs.json` is configured to auto-populate API pages from `openapi/openapi.json`.

Refresh the local OpenAPI snapshot from the API app:

```bash
bun run openapi:pull:local
```

Or refresh from production:

```bash
bun run openapi:pull:prod
```

Validate the OpenAPI file before pushing docs changes:

```bash
bun run openapi:check
```

---

Built with ❤️ using [Mintlify](https://mintlify.com)
