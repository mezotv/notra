import { createHash } from "node:crypto";
import type { SessionContext } from "eve/context";

const POST_ID_LENGTH = 16;

export function deriveDeterministicPostId(
  ctx: SessionContext,
  discriminator: string
): string {
  return createHash("sha256")
    .update(`${ctx.session.id}:${ctx.session.turn.id}:${discriminator}`)
    .digest("hex")
    .slice(0, POST_ID_LENGTH);
}

export function deriveOperationHash(discriminator: string): string {
  return createHash("sha256").update(discriminator).digest("hex");
}
