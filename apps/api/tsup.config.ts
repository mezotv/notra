import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  outExtension: () => ({ js: ".mjs" }),
  splitting: false,
  noExternal: [/.*/],
});
