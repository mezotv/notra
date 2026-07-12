import type { TextDiffLine } from "../types/onboarding-evaluation";

export function getTextDiffPrefix(kind: TextDiffLine["kind"]): string {
  if (kind === "added") {
    return "+";
  }
  if (kind === "removed") {
    return "−";
  }
  return " ";
}

export function diffTextLines(before: string, after: string): TextDiffLine[] {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const lengths = Array.from({ length: beforeLines.length + 1 }, () =>
    new Array<number>(afterLines.length + 1).fill(0)
  );

  for (let oldIndex = beforeLines.length - 1; oldIndex >= 0; oldIndex--) {
    const row = lengths[oldIndex];
    if (!row) {
      continue;
    }
    for (let newIndex = afterLines.length - 1; newIndex >= 0; newIndex--) {
      row[newIndex] =
        beforeLines[oldIndex] === afterLines[newIndex]
          ? (lengths[oldIndex + 1]?.[newIndex + 1] ?? 0) + 1
          : Math.max(
              lengths[oldIndex + 1]?.[newIndex] ?? 0,
              lengths[oldIndex]?.[newIndex + 1] ?? 0
            );
    }
  }

  const result: TextDiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < beforeLines.length || newIndex < afterLines.length) {
    if (
      oldIndex < beforeLines.length &&
      newIndex < afterLines.length &&
      beforeLines[oldIndex] === afterLines[newIndex]
    ) {
      result.push({
        kind: "unchanged",
        newLine: newIndex + 1,
        oldLine: oldIndex + 1,
        value: beforeLines[oldIndex] ?? "",
      });
      oldIndex++;
      newIndex++;
    } else if (
      oldIndex < beforeLines.length &&
      (newIndex >= afterLines.length ||
        (lengths[oldIndex + 1]?.[newIndex] ?? 0) >=
          (lengths[oldIndex]?.[newIndex + 1] ?? 0))
    ) {
      result.push({
        kind: "removed",
        newLine: null,
        oldLine: oldIndex + 1,
        value: beforeLines[oldIndex] ?? "",
      });
      oldIndex++;
    } else {
      result.push({
        kind: "added",
        newLine: newIndex + 1,
        oldLine: null,
        value: afterLines[newIndex] ?? "",
      });
      newIndex++;
    }
  }

  return result;
}
