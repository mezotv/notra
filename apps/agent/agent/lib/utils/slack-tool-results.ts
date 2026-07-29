export function isPostToXRejection(output: unknown): boolean {
  if (
    typeof output !== "object" ||
    output === null ||
    Array.isArray(output) ||
    !("approval" in output)
  ) {
    return false;
  }

  const { approval } = output;
  return (
    typeof approval === "object" &&
    approval !== null &&
    !Array.isArray(approval) &&
    "status" in approval &&
    approval.status === "invalid"
  );
}
