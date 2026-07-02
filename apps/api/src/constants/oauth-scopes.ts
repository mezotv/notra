export const PUBLIC_API_SCOPE_RESOURCES = [
  {
    id: "posts",
    paths: ["/posts"],
    readScope: "posts.read",
    writeScope: "posts.write",
  },
  {
    id: "brand-identities",
    paths: ["/brand-identities"],
    readScope: "brand-identities.read",
    writeScope: "brand-identities.write",
  },
  {
    id: "integrations",
    paths: ["/integrations"],
    readScope: "integrations.read",
    writeScope: "integrations.write",
  },
  {
    id: "schedules",
    paths: ["/schedules"],
    readScope: "schedules.read",
    writeScope: "schedules.write",
  },
  {
    id: "event-triggers",
    paths: ["/event-triggers"],
    readScope: "event-triggers.read",
    writeScope: "event-triggers.write",
  },
  {
    id: "chats",
    paths: ["/chats"],
    readScope: "chats.read",
    writeScope: "chats.write",
  },
  {
    id: "skills",
    paths: ["/skills"],
    readScope: "skills.read",
    writeScope: "skills.write",
  },
] as const;

export const PUBLIC_API_SCOPES = [
  "offline_access",
  ...PUBLIC_API_SCOPE_RESOURCES.flatMap((resource) => [
    resource.readScope,
    resource.writeScope,
  ]),
];

export const LEGACY_API_READ_SCOPE = "api.read";
export const LEGACY_API_WRITE_SCOPE = "api.write";
