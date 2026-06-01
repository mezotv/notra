import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  external: ["@resvg/resvg-js", "./resvgjs.*.node"],
  format: ["esm"],
  outDir: "dist",
  outExtension: () => ({ js: ".mjs" }),
  splitting: false,
  noExternal: [/^(?!@resvg\/resvg-js(?:$|\/)).*/],
});
