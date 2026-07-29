import type {
  OrganizationScope,
  ScopeGroup,
  SystemRoleDefinition,
} from "../types/roles";

export const ORGANIZATION_SCOPES = [
  "posts:create",
  "posts:edit",
  "posts:delete",
  "posts:review",
  "posts:publish",
  "posts:publish_override",
  "skills:create",
  "skills:edit",
  "skills:delete",
  "brand:edit",
  "automation:manage",
  "integrations:manage",
  "api-keys:manage",
  "members:manage",
  "roles:manage",
  "publishing:manage",
] as const;

export const SCOPE_GROUPS: ScopeGroup[] = [
  {
    resource: "posts",
    label: "Posts",
    scopes: [
      {
        scope: "posts:create",
        label: "Create & generate",
        description: "Create posts and start content generation",
      },
      {
        scope: "posts:edit",
        label: "Edit",
        description: "Edit post content, titles, and metadata",
      },
      {
        scope: "posts:delete",
        label: "Delete",
        description: "Delete posts and collections",
      },
      {
        scope: "posts:review",
        label: "Review",
        description: "Approve posts or request changes during review",
      },
      {
        scope: "posts:publish",
        label: "Publish",
        description: "Publish posts once publishing requirements have been met",
      },
      {
        scope: "posts:publish_override",
        label: "Publish without approval",
        description: "Publish immediately, bypassing any approval requirements",
      },
    ],
  },
  {
    resource: "skills",
    label: "Skills",
    scopes: [
      {
        scope: "skills:create",
        label: "Create",
        description: "Create and import skills",
      },
      {
        scope: "skills:edit",
        label: "Edit",
        description: "Edit skill instructions and descriptions",
      },
      {
        scope: "skills:delete",
        label: "Delete",
        description: "Delete skills",
      },
    ],
  },
  {
    resource: "workspace",
    label: "Workspace",
    scopes: [
      {
        scope: "brand:edit",
        label: "Edit brand",
        description: "Edit brand identity, guidelines, and references",
      },
      {
        scope: "automation:manage",
        label: "Manage automations",
        description: "Create and edit schedules and event triggers",
      },
      {
        scope: "integrations:manage",
        label: "Manage integrations",
        description: "Connect and disconnect integrations",
      },
      {
        scope: "api-keys:manage",
        label: "Manage API keys",
        description: "Create and revoke API keys",
      },
    ],
  },
  {
    resource: "administration",
    label: "Administration",
    scopes: [
      {
        scope: "members:manage",
        label: "Manage members",
        description: "Invite members and assign roles",
      },
      {
        scope: "roles:manage",
        label: "Manage roles",
        description: "Create, edit, and delete roles",
      },
      {
        scope: "publishing:manage",
        label: "Manage publishing requirements",
        description: "Configure approval workflows and publishing rules",
      },
    ],
  },
];

export const SYSTEM_ROLE_DEFINITIONS: SystemRoleDefinition[] = [
  {
    key: "admin",
    name: "Admin",
    description:
      "Full access to everything, including roles, members, and publishing requirements",
    scopes: [...ORGANIZATION_SCOPES],
  },
  {
    key: "content-manager",
    name: "Content Manager",
    description:
      "Manages content end to end and can publish immediately without approval",
    scopes: [
      "posts:create",
      "posts:edit",
      "posts:delete",
      "posts:review",
      "posts:publish",
      "posts:publish_override",
      "skills:create",
      "skills:edit",
      "skills:delete",
      "brand:edit",
      "automation:manage",
      "integrations:manage",
    ],
  },
  {
    key: "reviewer",
    name: "Reviewer",
    description:
      "Reviews posts and can publish them once approval requirements are met",
    scopes: ["posts:create", "posts:edit", "posts:review", "posts:publish"],
  },
  {
    key: "contributor",
    name: "Contributor",
    description: "Creates and edits posts but cannot review or publish them",
    scopes: ["posts:create", "posts:edit"],
  },
];

export const LEGACY_ROLE_SCOPES: Record<string, OrganizationScope[]> = {
  owner: [...ORGANIZATION_SCOPES],
  admin: [...ORGANIZATION_SCOPES],
  member: [
    "posts:create",
    "posts:edit",
    "posts:delete",
    "posts:review",
    "posts:publish",
    "skills:create",
    "skills:edit",
    "skills:delete",
    "brand:edit",
    "automation:manage",
    "integrations:manage",
    "api-keys:manage",
  ],
};
