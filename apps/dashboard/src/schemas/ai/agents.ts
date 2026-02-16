import { z } from "zod";

export const changelogOutputSchema = z.object({
  title: z.string().max(120).describe("The changelog title, no markdown"),
  markdown: z
    .string()
    .describe(
      "The full changelog content body as markdown/MDX, without the title heading (title is a separate field)"
    ),
});

export type ChangelogOutput = z.infer<typeof changelogOutputSchema>;
