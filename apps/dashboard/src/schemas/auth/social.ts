import "zod/compile";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

import { returnToSchema } from "@/schemas/auth/return-to";

const socialAuthProviderSchema = z.enum(["google", "github"]);

export const startSocialSignInInputSchema = z.object({
  provider: socialAuthProviderSchema,
  returnTo: returnToSchema,
});
