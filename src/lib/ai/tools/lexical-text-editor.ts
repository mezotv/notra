import { type Tool, tool } from "ai";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

interface LexicalTextEditorContext {
  currentMarkdown: string;
  onUpdate: (markdown: string) => void;
}

interface EditorState {
  markdown: string;
}

function handleView(state: EditorState): string {
  const lines = state.markdown.split("\n");
  return lines.map((line, i) => `${i + 1}: ${line}`).join("\n");
}

function handleStrReplace(
  state: EditorState,
  oldStr: string,
  newStr: string,
  onUpdate: (markdown: string) => void
): string {
  const occurrences = state.markdown.split(oldStr).length - 1;

  if (occurrences === 0) {
    return "Error: old_str not found in document. Make sure the text matches exactly, including whitespace and line breaks. Use the view command to see the current content.";
  }

  if (occurrences > 1) {
    return `Error: old_str found ${occurrences} times. Please provide a more unique string that appears exactly once. Include more surrounding context to make it unique.`;
  }

  state.markdown = state.markdown.replace(oldStr, newStr);
  onUpdate(state.markdown);

  return "Successfully replaced text. The document has been updated.";
}

function handleInsert(
  state: EditorState,
  insertLine: number,
  newStr: string,
  onUpdate: (markdown: string) => void
): string {
  const lines = state.markdown.split("\n");

  if (insertLine < 0 || insertLine > lines.length) {
    return `Error: insert_line ${insertLine} is out of range. Document has ${lines.length} lines. Use a value between 0 and ${lines.length}.`;
  }

  lines.splice(insertLine, 0, newStr);
  state.markdown = lines.join("\n");
  onUpdate(state.markdown);

  return `Successfully inserted text after line ${insertLine}.`;
}

/**
 * Creates a text editor tool that operates on the Lexical editor's markdown content.
 * Uses Anthropic's str_replace_based_edit_tool pattern but as a standard AI SDK tool.
 *
 * The tool treats "document.md" as the virtual file path representing the editor content.
 */
export function createLexicalTextEditorTool(
  context: LexicalTextEditorContext
): Tool {
  const state: EditorState = { markdown: context.currentMarkdown };

  return tool({
    description: `A text editor tool for viewing and modifying the document content.
Use path "document.md" for all commands.
Commands:
- view: View the current document with line numbers
- str_replace: Replace exact text (old_str) with new text (new_str). The old_str must be unique.
- insert: Insert new_str after a specific line number (insert_line)`,
    inputSchema: z.object({
      command: z
        .enum(["view", "str_replace", "insert"])
        .describe("The command to execute"),
      path: z.string().describe('The file path (always use "document.md")'),
      old_str: z
        .string()
        .optional()
        .describe("For str_replace: the exact text to find and replace"),
      new_str: z
        .string()
        .optional()
        .describe("For str_replace/insert: the new text"),
      insert_line: z
        .number()
        .optional()
        .describe("For insert: the line number after which to insert"),
    }),
    execute: ({ command, path, old_str, new_str, insert_line }) => {
      if (path !== "document.md") {
        return 'Error: Only "document.md" is available. Use path "document.md" to access the editor content.';
      }

      switch (command) {
        case "view":
          return handleView(state);
        case "str_replace":
          if (!old_str) {
            return "Error: old_str is required for str_replace command.";
          }
          if (new_str === undefined) {
            return "Error: new_str is required for str_replace command.";
          }
          return handleStrReplace(state, old_str, new_str, context.onUpdate);
        case "insert":
          if (insert_line === undefined) {
            return "Error: insert_line is required for insert command.";
          }
          if (new_str === undefined) {
            return "Error: new_str is required for insert command.";
          }
          return handleInsert(state, insert_line, new_str, context.onUpdate);
        default:
          return `Error: Unknown command "${command}". Supported commands: view, str_replace, insert.`;
      }
    },
  });
}
