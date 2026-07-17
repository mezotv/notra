export function hasAdminRole(role: string | null | undefined): boolean {
  return (
    role
      ?.split(",")
      .map((value) => value.trim())
      .includes("admin") ?? false
  );
}
