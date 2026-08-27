const REQUIRED_ENV_VARS = [
  "UNKEY_ROOT_KEY",
  "DATABASE_URL",
  "AUTUMN_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "QSTASH_TOKEN",
  "WORKFLOW_BASE_URL",
  "INTEGRATION_ENCRYPTION_KEY",
] as const;

export function assertRequiredEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
