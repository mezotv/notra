import type { Mandate } from "@notra/ai/schemas/autonomy/mandate";
import type { PlannerOutput } from "@notra/ai/schemas/autonomy/planner";

export const validatePlannerOutputAgainstMandate = (
  output: PlannerOutput,
  mandate: Mandate
): string[] => {
  const violations: string[] = [];

  if (output.mandate.mandateId !== mandate.id) {
    violations.push(
      `Planner output references mandate "${output.mandate.mandateId}" but was invoked with "${mandate.id}"`
    );
  }

  if (output.mandate.mandateVersion !== mandate.version) {
    violations.push(
      `Planner output references mandate version ${output.mandate.mandateVersion} but was invoked with version ${mandate.version}`
    );
  }

  if (mandate.status !== "active") {
    violations.push(`Mandate "${mandate.id}" is ${mandate.status}, not active`);
  }

  if (output.tasks.length > mandate.policy.maxTasksPerPlan) {
    violations.push(
      `Plan contains ${output.tasks.length} tasks but the mandate allows at most ${mandate.policy.maxTasksPerPlan}`
    );
  }

  const allowedCapabilities = new Set(mandate.policy.allowedCapabilities);
  for (const task of output.tasks) {
    if (!allowedCapabilities.has(task.capabilityName)) {
      violations.push(
        `Task "${task.localId}" uses capability "${task.capabilityName}" which is not allowed by the mandate`
      );
    }
  }

  return violations;
};
