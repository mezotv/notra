const pendingByCollection = new Map<string, ReadonlySet<string>>();
const listeners = new Set<() => void>();

const NO_PENDING_ROWS: ReadonlySet<string> = new Set();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToPendingRows(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getPendingRows(collectionId: string): ReadonlySet<string> {
  return pendingByCollection.get(collectionId) ?? NO_PENDING_ROWS;
}

export function markRowPending(collectionId: string, rowId: string) {
  const next = new Set(pendingByCollection.get(collectionId) ?? []);
  next.add(rowId);
  pendingByCollection.set(collectionId, next);
  notify();
}

export function clearRowPending(collectionId: string, rowId: string) {
  const next = new Set(pendingByCollection.get(collectionId) ?? []);
  next.delete(rowId);
  pendingByCollection.set(collectionId, next);
  notify();
}
