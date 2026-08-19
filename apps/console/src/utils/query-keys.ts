export const QUERY_KEYS = {
  AUTH: {
    session: ["auth", "session"],
    organizations: ["auth", "organizations"],
    adminUsers: (search: string) => ["auth", "admin-users", search] as const,
  },
};
