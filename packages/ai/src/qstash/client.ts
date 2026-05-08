import { Client as WorkflowClient } from "@upstash/workflow";

let cachedWorkflowClient: WorkflowClient | undefined;

export function getWorkflowClient() {
  if (cachedWorkflowClient) {
    return cachedWorkflowClient;
  }

  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error("QSTASH_TOKEN is not defined");
  }

  cachedWorkflowClient = new WorkflowClient({ token });
  return cachedWorkflowClient;
}
