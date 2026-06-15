import type { Box } from "@upstash/box";
import { withBoxRetry } from "./repo-image-box";

type RepoImageBox = Awaited<ReturnType<typeof Box.create>>;

const OPENCODE_SANDBOX_CLEANUP_COMMAND = [
  "{",
  "find . \\(",
  "-type d -name .opencode -prune -exec rm -rf {} +",
  "\\) -o \\(",
  "-type f \\( -name opencode.json -o -name opencode.jsonc \\) -delete",
  "\\);",
  '[ -z "$HOME" ] || rm -rf "$HOME/.config/opencode"',
  '"$HOME/.local/share/opencode"',
  '"$HOME/.cache/opencode";',
  "rm -rf",
  "/workspace/home/.config/opencode",
  "/workspace/home/.local/share/opencode",
  "/workspace/home/.cache/opencode;",
  '[ -z "$OPENCODE_CONFIG" ] || rm -f "$OPENCODE_CONFIG";',
  '[ -z "$OPENCODE_CONFIG_DIR" ] || rm -rf "$OPENCODE_CONFIG_DIR";',
  "} >/dev/null 2>&1 || true",
].join(" ");

export async function cleanupRepoImageSandbox(params: { box: RepoImageBox }) {
  await withBoxRetry(() =>
    params.box.exec.command(OPENCODE_SANDBOX_CLEANUP_COMMAND)
  );
}
