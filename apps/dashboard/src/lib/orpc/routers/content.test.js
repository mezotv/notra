import { describe, expect, test } from "bun:test";
import { buildContentUpdateData } from "./content";

describe("buildContentUpdateData", () => {
  test("derives the title from markdown when no explicit title is provided", async () => {
    const updateData = await buildContentUpdateData("Existing title", {
      markdown: "# New title\n\nBody copy",
    });

    expect(updateData.title).toBe("New title");
    expect(updateData.markdown).toBe("# New title\n\nBody copy");
  });

  test("preserves an explicit title and sanitizes rendered HTML", async () => {
    const updateData = await buildContentUpdateData("Existing title", {
      title: "Manual title",
      markdown:
        "# Heading in markdown\n\n<script>alert('x')</script><p>Allowed</p>",
      status: "published",
    });

    expect(updateData.title).toBe("Manual title");
    expect(updateData.status).toBe("published");
    expect(updateData.content).not.toContain("<script");
    expect(updateData.content).toContain("<p>Allowed</p>");
  });
});
