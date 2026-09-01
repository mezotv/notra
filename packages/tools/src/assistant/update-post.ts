import { updatePostRecord } from "@notra/ai/utils/post-service";
import { defineTool } from "eve/tools";

import { updatePostInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createUpdatePostTool() {
  return defineTool({
    description:
      "Updates an existing post's title, slug, and/or content. Requires the postId returned from a create post tool or a post lookup. Provide only the fields you want to change.",
    inputSchema: updatePostInputSchema,
    async execute(input, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const { status } = await updatePostRecord({
        organizationId,
        postId: input.postId,
        title: input.title,
        slug: input.slug,
        markdown: input.markdown,
        recommendations: input.recommendations,
      });
      return { postId: input.postId, status };
    },
  });
}
