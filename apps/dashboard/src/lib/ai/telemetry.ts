import { db } from "@notra/db/drizzle";
import { organizations } from "@notra/db/schema";
import { eq } from "drizzle-orm";

type AISDKTelemetryMetadata = Record<string, string | null | undefined>;

interface AISDKTelemetryOptions {
  organizationId?: string;
  customerName?: string;
  metadata?: AISDKTelemetryMetadata;
}

const organizationNameCache = new Map<string, Promise<string | undefined>>();

async function getOrganizationName(organizationId: string) {
  let cached = organizationNameCache.get(organizationId);

  if (!cached) {
    cached = db.query.organizations
      .findFirst({
        where: eq(organizations.id, organizationId),
        columns: { name: true },
      })
      .then((organization) => organization?.name ?? undefined);

    organizationNameCache.set(organizationId, cached);
  }

  return cached;
}

export async function getAISDKTelemetry(
  functionId: string,
  options: AISDKTelemetryOptions = {}
) {
  const customerName =
    options.customerName ??
    (options.organizationId
      ? await getOrganizationName(options.organizationId)
      : undefined);

  const metadata = Object.entries({
    environment:
      process.env.NODE_ENV === "production" ? "production" : "development",
    customer_identifier: options.organizationId,
    customer_name: customerName,
    ...options.metadata,
  }).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string" && value.length > 0) {
      acc[key] = value;
    }

    return acc;
  }, {});

  return {
    isEnabled: true,
    functionId,
    metadata,
  };
}
