import { WORKFLOW_MONITORING } from "@/constants/workflow-monitoring";

export async function withMonitoringTimeout<T>(
  operation: Promise<T>
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Monitoring operation timed out")),
          WORKFLOW_MONITORING.operationTimeoutMs
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
