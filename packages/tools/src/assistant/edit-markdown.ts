import { defineTool } from "eve/tools";
import { editMarkdownInputSchema } from "../schemas/assistant-tools";
import { getSessionAttribute } from "../utils/session";

export function createEditMarkdownTool() {
  return defineTool({
    description:
      "Proposes edit operations for the current document. Pass the baseHash provided with the document in this turn plus operations: replaceLine (line, content), replaceRange (startLine, endLine, content), insert (afterLine, content), deleteLine (line), deleteRange (startLine, endLine). Line numbers refer to the numbered document you were given. The editor validates the hash and applies the operations to the live document.",
    inputSchema: editMarkdownInputSchema,
    execute({ baseHash, operations }, ctx) {
      if (getSessionAttribute(ctx, "surface") !== "content-editor") {
        throw new Error(
          "edit_markdown is only available in content editor sessions."
        );
      }
      return { status: "proposed", baseHash, operations };
    },
  });
}
