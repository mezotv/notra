import type { IrisPlannedTask } from "@/types/iris";

export const collectRemainingTaskIds = (
  tasks: readonly IrisPlannedTask[],
  canceledTaskIds: ReadonlySet<string>,
  currentTaskId: string
): string[] => {
  const remaining: string[] = [];
  let reachedCurrent = false;

  for (const task of tasks) {
    if (task.taskId === currentTaskId) {
      reachedCurrent = true;
    }
    if (!reachedCurrent || canceledTaskIds.has(task.taskId)) {
      continue;
    }
    remaining.push(task.taskId);
  }

  return remaining;
};

export const collectDependentTaskIds = (
  tasks: readonly IrisPlannedTask[],
  failedTaskId: string
): string[] => {
  const blocked = new Set<string>([failedTaskId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const task of tasks) {
      if (blocked.has(task.taskId)) {
        continue;
      }
      const dependsOnBlocked = task.dependsOnTaskIds.some((dependency) =>
        blocked.has(dependency)
      );
      if (dependsOnBlocked) {
        blocked.add(task.taskId);
        changed = true;
      }
    }
  }

  blocked.delete(failedTaskId);
  return [...blocked];
};
