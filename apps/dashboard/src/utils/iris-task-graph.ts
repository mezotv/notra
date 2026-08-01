import type { IrisPlannedTask } from "@/types/iris";

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
