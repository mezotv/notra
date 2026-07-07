import type { EveDynamicToolPart } from "eve/react";

export function getToolOutput(part: EveDynamicToolPart): unknown {
  if (part.state === "output-error") {
    return { error: part.errorText };
  }
  if (part.state === "output-available") {
    return part.output;
  }
  return;
}
