import { capabilityNameSchema } from "@notra/ai/schemas/autonomy/capability";
import { mandateRefSchema } from "@notra/ai/schemas/autonomy/mandate";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const PLANNER_CONTRACT_VERSION = 1;
export const MAX_PLAN_TASKS = 25;
export const PLANNER_TASK_LOCAL_ID_PATTERN = /^t[0-9]{1,3}$/;

export const plannerTaskLocalIdSchema = z
  .string()
  .regex(PLANNER_TASK_LOCAL_ID_PATTERN);
export type PlannerTaskLocalId = z.infer<typeof plannerTaskLocalIdSchema>;

export const plannerTaskSchema = z.object({
  localId: plannerTaskLocalIdSchema,
  capabilityName: capabilityNameSchema,
  capabilityVersion: z.number().int().min(1),
  params: z.record(z.string(), z.unknown()),
  dependsOn: z.array(plannerTaskLocalIdSchema).max(10).default([]),
  reason: z.string().min(1).max(500),
});
export type PlannerTask = z.infer<typeof plannerTaskSchema>;

export const plannerDecisionSchema = z.enum(["no_op", "plan", "escalate"]);
export type PlannerDecision = z.infer<typeof plannerDecisionSchema>;

export const plannerGoalSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional(),
});
export type PlannerGoal = z.infer<typeof plannerGoalSchema>;

const findDuplicateLocalIds = (tasks: PlannerTask[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const task of tasks) {
    if (seen.has(task.localId)) {
      duplicates.add(task.localId);
    }
    seen.add(task.localId);
  }
  return [...duplicates];
};

const hasDependencyCycle = (tasks: PlannerTask[]): boolean => {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const task of tasks) {
    inDegree.set(task.localId, 0);
    dependents.set(task.localId, []);
  }
  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!(inDegree.has(dependency) && dependency !== task.localId)) {
        continue;
      }
      inDegree.set(task.localId, (inDegree.get(task.localId) ?? 0) + 1);
      dependents.get(dependency)?.push(task.localId);
    }
  }
  const queue: string[] = [];
  for (const [localId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(localId);
    }
  }
  let resolved = 0;
  while (queue.length > 0) {
    const current = queue.pop();
    if (current === undefined) {
      continue;
    }
    resolved += 1;
    for (const dependent of dependents.get(current) ?? []) {
      const remaining = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, remaining);
      if (remaining === 0) {
        queue.push(dependent);
      }
    }
  }
  return resolved !== inDegree.size;
};

export const plannerOutputSchema = z
  .object({
    contractVersion: z.literal(PLANNER_CONTRACT_VERSION),
    mandate: mandateRefSchema,
    decision: plannerDecisionSchema,
    reason: z.string().min(1).max(1000),
    consumedSignalIds: z.array(z.string().min(1)).default([]),
    goal: plannerGoalSchema.optional(),
    tasks: z.array(plannerTaskSchema).max(MAX_PLAN_TASKS).default([]),
  })
  .superRefine((output, ctx) => {
    const { decision, tasks, goal } = output;

    if (tasks.length > MAX_PLAN_TASKS) {
      ctx.addIssue({
        code: "custom",
        path: ["tasks"],
        message: `A plan may contain at most ${MAX_PLAN_TASKS} tasks`,
      });
    }

    if (decision === "plan") {
      if (tasks.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["tasks"],
          message: 'Decision "plan" requires at least one task',
        });
      }
      if (!goal) {
        ctx.addIssue({
          code: "custom",
          path: ["goal"],
          message: 'Decision "plan" requires a goal',
        });
      }
    } else if (tasks.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["tasks"],
        message: `Decision "${decision}" must not contain tasks`,
      });
    }

    for (const duplicate of findDuplicateLocalIds(tasks)) {
      ctx.addIssue({
        code: "custom",
        path: ["tasks"],
        message: `Duplicate task localId "${duplicate}"`,
      });
    }

    const localIds = new Set(tasks.map((task) => task.localId));
    for (const [index, task] of tasks.entries()) {
      for (const [dependencyIndex, dependency] of task.dependsOn.entries()) {
        if (dependency === task.localId) {
          ctx.addIssue({
            code: "custom",
            path: ["tasks", index, "dependsOn", dependencyIndex],
            message: `Task "${task.localId}" cannot depend on itself`,
          });
          continue;
        }
        if (!localIds.has(dependency)) {
          ctx.addIssue({
            code: "custom",
            path: ["tasks", index, "dependsOn", dependencyIndex],
            message: `Task "${task.localId}" depends on unknown task "${dependency}"`,
          });
        }
      }
    }

    if (hasDependencyCycle(tasks)) {
      ctx.addIssue({
        code: "custom",
        path: ["tasks"],
        message: "Task dependencies must form an acyclic graph",
      });
    }
  });
export type PlannerOutput = z.infer<typeof plannerOutputSchema>;
