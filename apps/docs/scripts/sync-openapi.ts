import { fileURLToPath } from "node:url";

import { extractOperations } from "blume/openapi/model.ts";
import { parseSpec } from "blume/openapi/parse.ts";

const docsRoot = fileURLToPath(new URL("../", import.meta.url));
const { document, warnings } = await parseSpec(
  "https://api.usenotra.com/openapi.json",
  docsRoot,
  { refresh: true }
);
const { operations } = extractOperations(document, "/api/endpoints");

if (warnings.length > 0 || operations.length === 0) {
  throw new Error(
    `OpenAPI synchronization failed: ${warnings.join("; ") || "the specification has no operations"}`
  );
}

await Bun.write(
  new URL("../public/openapi.json", import.meta.url),
  `${JSON.stringify(document, null, 2)}\n`
);
console.log(
  `Updated the OpenAPI snapshot with ${operations.length} operations.`
);
