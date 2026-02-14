import { defineCollections, defineConfig } from "fumadocs-mdx/config";
import { z } from "zod";

export const changelog = defineCollections({
  type: "doc",
  dir: "./src/content/changelog",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
  }),
});

export default defineConfig({});
