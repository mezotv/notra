import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  esbuildOptions(options) {
    options.external = [
      ...(options.external ?? []),
      "./resvgjs.*.node",
      "@resvg/resvg-js",
    ];
  },
  external: ["@resvg/resvg-js"],
  format: ["esm"],
  outDir: "dist",
  outExtension: () => ({ js: ".mjs" }),
  splitting: false,
  noExternal: [/.*/],
});
