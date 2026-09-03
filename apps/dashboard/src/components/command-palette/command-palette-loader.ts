export const loadCommandPalette = () =>
  import("@/components/command-palette/command-palette").then(
    (module) => module.CommandPalette
  );

export function preloadCommandPalette(): void {
  void preload();
}

async function preload(): Promise<void> {
  try {
    await loadCommandPalette();
  } catch {
    // A later interaction can retry the chunk request.
  }
}
