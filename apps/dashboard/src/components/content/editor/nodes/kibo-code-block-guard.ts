import type { LexicalNode } from "lexical";

const KIBO_CODE_BLOCK_TYPE = "kibo-code-block";

export interface KiboCodeBlockLike extends LexicalNode {
  setCode(code: string): void;
  setLanguage(language: string): void;
}

export function $isKiboCodeBlockNode(
  node: LexicalNode | null | undefined
): node is KiboCodeBlockLike {
  return node?.getType() === KIBO_CODE_BLOCK_TYPE;
}
