"use client";

export type OrganizationMutationQueue = <T>(
  operation: () => Promise<T>
) => Promise<T>;

export function createOrganizationMutationQueue(): OrganizationMutationQueue {
  let queue: Promise<void> = Promise.resolve();

  return <T>(operation: () => Promise<T>): Promise<T> => {
    // Server Actions cannot be aborted here; releasing early could let a late
    // Set-Cookie response overwrite a newer organization selection.
    const result = queue.then(operation, operation);
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };
}

export const serializeOrganizationMutation = createOrganizationMutationQueue();
