import { AgentAnalytics } from "@usenotra/agent-analytics";
import { redis } from "@/utils/redis";

export const agentAnalytics = redis ? new AgentAnalytics({ redis }) : null;
