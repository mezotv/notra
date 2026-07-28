import { z } from "zod";

const AGENT_MESSAGE_MAX_LENGTH = 200_000;

export const agentProxyCreateSessionSchema = z.object({
  message: z.string().min(1).max(AGENT_MESSAGE_MAX_LENGTH),
});
