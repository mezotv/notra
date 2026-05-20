export const SKILL_NAME_MAX_LENGTH = 64;
export const SKILL_DESCRIPTION_MAX_LENGTH = 1000;
export const SKILL_CONTENT_MAX_LENGTH = 200_000;

export const SKILL_NAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const ORGANIZATION_SCOPED_API_KEY_ERROR =
  "Forbidden: API key must be scoped to an organization";
export const SKILL_NOT_FOUND_ERROR = "Skill not found";
export const SYSTEM_SKILL_RENAME_ERROR = "System skills cannot be renamed";
export const SYSTEM_SKILL_DELETE_ERROR = "System skills cannot be deleted";
