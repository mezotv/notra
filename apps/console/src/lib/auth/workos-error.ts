// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const workosErrorSchema = z.looseObject({
  code: z.string().optional(),
  message: z.string().optional(),
  rawData: z
    .looseObject({
      code: z.string().optional(),
      message: z.string().optional(),
      email: z.string().optional(),
      pending_authentication_token: z.string().optional(),
      organizations: z.array(z.looseObject({ id: z.string() })).optional(),
    })
    .optional(),
});

export interface WorkOSErrorInfo {
  code: string | null;
  message: string;
  email: string | null;
  pendingAuthenticationToken: string | null;
  organizationIds: string[];
}

export function readWorkOSError(error: unknown): WorkOSErrorInfo {
  const parsed = workosErrorSchema.safeParse(error);

  if (!parsed.success) {
    return {
      code: null,
      message: "Something went wrong",
      email: null,
      pendingAuthenticationToken: null,
      organizationIds: [],
    };
  }

  const { code, message, rawData } = parsed.data;

  return {
    code: rawData?.code ?? code ?? null,
    message: rawData?.message ?? message ?? "Something went wrong",
    email: rawData?.email ?? null,
    pendingAuthenticationToken: rawData?.pending_authentication_token ?? null,
    organizationIds:
      rawData?.organizations?.map((organization) => organization.id) ?? [],
  };
}
