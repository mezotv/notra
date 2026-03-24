import { Client as WorkflowClient } from "@upstash/workflow";

export function getWorkflowClient() {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error("QSTASH_TOKEN is not defined");
  }

  return new WorkflowClient({ token });
}
