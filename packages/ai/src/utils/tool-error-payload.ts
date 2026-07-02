import type { Tool } from "ai";

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function toErrorPayload(toolName: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[Tool Error]", { toolName, error: message });
  return {
    isError: true,
    error: message,
    hint: "The tool call failed. Review the error, adjust the inputs or approach, and retry. If the failure persists, tell the user what went wrong instead of silently stopping.",
  };
}

export function withToolErrorPayloads(
  tools: Record<string, Tool>
): Record<string, Tool> {
  const wrapped: Record<string, Tool> = {};
  for (const [toolName, originalTool] of Object.entries(tools)) {
    const { execute } = originalTool;
    if (!execute) {
      wrapped[toolName] = originalTool;
      continue;
    }
    wrapped[toolName] = {
      ...originalTool,
      execute: async (input, options) => {
        try {
          return await execute.call(originalTool, input, options);
        } catch (error) {
          if (isAbortError(error) || options.abortSignal?.aborted) {
            throw error;
          }
          return toErrorPayload(toolName, error);
        }
      },
    };
  }
  return wrapped;
}
