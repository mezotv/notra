import type {
  TopologicalNode,
  TopologicalSortResult,
} from "@notra/ai/types/autonomy";

export const topologicallySortNodes = <NodeType extends TopologicalNode>(
  nodes: readonly NodeType[]
): TopologicalSortResult<NodeType> => {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  const byId = new Map<string, NodeType>();

  for (const node of nodes) {
    inDegree.set(node.localId, 0);
    dependents.set(node.localId, []);
    byId.set(node.localId, node);
  }

  for (const node of nodes) {
    for (const dependency of node.dependsOn) {
      if (!byId.has(dependency)) {
        continue;
      }
      inDegree.set(node.localId, (inDegree.get(node.localId) ?? 0) + 1);
      dependents.get(dependency)?.push(node.localId);
    }
  }

  const queue: string[] = [];
  for (const node of nodes) {
    if (inDegree.get(node.localId) === 0) {
      queue.push(node.localId);
    }
  }

  const ordered: NodeType[] = [];
  let cursor = 0;
  while (cursor < queue.length) {
    const currentId = queue[cursor];
    cursor += 1;
    if (currentId === undefined) {
      continue;
    }
    const current = byId.get(currentId);
    if (current !== undefined) {
      ordered.push(current);
    }
    for (const dependent of dependents.get(currentId) ?? []) {
      const remaining = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, remaining);
      if (remaining === 0) {
        queue.push(dependent);
      }
    }
  }

  return { ordered, cycleDetected: ordered.length !== nodes.length };
};
