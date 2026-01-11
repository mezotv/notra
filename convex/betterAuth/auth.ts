import { createAuth } from "../auth";

// Export a static instance for Better Auth schema generation
// biome-ignore lint/suspicious/noExplicitAny: Required for static schema generation without env vars
export const auth = createAuth({} as any);
