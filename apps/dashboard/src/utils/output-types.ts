import { formatSnakeCaseLabel } from "@/utils/format";

export function getOutputTypeLabel(outputType: string): string {
  return formatSnakeCaseLabel(outputType);
}
