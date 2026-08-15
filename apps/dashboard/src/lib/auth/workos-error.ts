// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const workosErrorSchema = z.looseObject({
  code: z.string().optional(),
  message: z.string().optional(),
  rawData: z
    .looseObject({
      code: z.string().optional(),
      message: z.string().optional(),
      pending_authentication_token: z.string().optional(),
    })
    .optional(),
});

export interface WorkOSErrorInfo {
  code: string | null;
  message: string;
  pendingAuthenticationToken: string | null;
}

export function readWorkOSError(error: unknown): WorkOSErrorInfo {
  const parsed = workosErrorSchema.safeParse(error);

  if (!parsed.success) {
    return {
      code: null,
      message: "Something went wrong",
      pendingAuthenticationToken: null,
    };
  }

  const { code, message, rawData } = parsed.data;

  return {
    code: rawData?.code ?? code ?? null,
    message: rawData?.message ?? message ?? "Something went wrong",
    pendingAuthenticationToken: rawData?.pending_authentication_token ?? null,
  };
}
