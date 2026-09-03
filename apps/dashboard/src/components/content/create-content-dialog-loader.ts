export const loadCreateContentDialog = () =>
  import("@/components/content/create-content-dialog").then(
    (module) => module.CreateContentDialog
  );

export function preloadCreateContentDialog(): void {
  void preload();
}

async function preload(): Promise<void> {
  try {
    await loadCreateContentDialog();
  } catch {
    // A later interaction can retry the chunk request.
  }
}
