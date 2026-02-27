import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/extension";
import type {
  ElementTransformer,
  MultilineElementTransformer,
  Transformer,
} from "@lexical/markdown";
import { TRANSFORMERS } from "@lexical/markdown";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { $createParagraphNode, $createTextNode } from "lexical";
import {
  $createKiboCodeBlockNode,
  $isKiboCodeBlockNode,
  KiboCodeBlockNode,
} from "./nodes/kibo-code-block-node";

export const HORIZONTAL_RULE: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    return $isHorizontalRuleNode(node) ? "---" : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _children, _match, isImport) => {
    const hrNode = $createHorizontalRuleNode();
    // When importing from markdown or when there's a next sibling, replace the node.
    // Otherwise, insert before to ensure proper cursor positioning after the transformation.
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(hrNode);
    } else {
      parentNode.insertBefore(hrNode);
    }
    hrNode.selectNext();
  },
  type: "element",
};

export const KIBO_CODE_BLOCK: MultilineElementTransformer = {
  dependencies: [KiboCodeBlockNode],
  export: (node) => {
    if (!$isKiboCodeBlockNode(node)) {
      return null;
    }
    const language = node.getLanguage();
    const code = node.getCode();
    return `\`\`\`${language}\n${code}\n\`\`\``;
  },
  regExpEnd: {
    optional: true,
    regExp: /^[ \t]*```$/,
  },
  regExpStart: /^[ \t]*```(\w+)?/,
  replace: (
    rootNode,
    children,
    startMatch,
    _endMatch,
    linesInBetween,
    _isImport
  ) => {
    const language = startMatch[1] || "";

    // During markdown import (linesInBetween has content)
    if (linesInBetween) {
      const code = linesInBetween.join("\n");
      const codeBlockNode = $createKiboCodeBlockNode(code, language);
      rootNode.append(codeBlockNode);
      return;
    }

    // During markdown shortcut (children exist, replace parent)
    if (children && children.length > 0) {
      const code = children.map((child) => child.getTextContent()).join("\n");
      const codeBlockNode = $createKiboCodeBlockNode(code, language);
      const firstChild = children[0];
      if (firstChild) {
        firstChild.getParentOrThrow().replace(codeBlockNode);
      } else {
        rootNode.append(codeBlockNode);
      }
    } else {
      // Handle empty code block (just ``` with no content)
      const codeBlockNode = $createKiboCodeBlockNode("", language);
      rootNode.append(codeBlockNode);
    }
  },
  type: "multiline-element",
};

const TABLE_ROW_REGEX = /^\|(.*)\|\s*$/;
const TABLE_SEPARATOR_REGEX = /^\|(\s*:?-+:?\s*\|)+\s*$/;
const LEADING_PIPE_REGEX = /^\|/;
const TRAILING_PIPE_REGEX = /\|\s*$/;

function parsePipeCells(row: string): string[] {
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  const inner = row
    .replace(LEADING_PIPE_REGEX, "")
    .replace(TRAILING_PIPE_REGEX, "");

  for (const char of inner) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (escaped) {
    current += "\\";
  }
  cells.push(current.trim());
  return cells;
}

function escapePipeContent(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function buildTableNode(
  headerCells: string[],
  dataRows: string[][]
): TableNode {
  const tableNode = $createTableNode();

  const headerRowNode = $createTableRowNode();
  for (const cellText of headerCells) {
    const cellNode = $createTableCellNode(TableCellHeaderStates.COLUMN);
    const paragraph = $createParagraphNode();
    if (cellText) {
      paragraph.append($createTextNode(cellText));
    }
    cellNode.append(paragraph);
    headerRowNode.append(cellNode);
  }
  tableNode.append(headerRowNode);

  for (const row of dataRows) {
    const rowNode = $createTableRowNode();
    for (let col = 0; col < headerCells.length; col++) {
      const cellText = row[col] ?? "";
      const cellNode = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
      const paragraph = $createParagraphNode();
      if (cellText) {
        paragraph.append($createTextNode(cellText));
      }
      cellNode.append(paragraph);
      rowNode.append(cellNode);
    }
    tableNode.append(rowNode);
  }

  return tableNode;
}

export const TABLE_MARKDOWN: MultilineElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const rows = node.getChildren<TableRowNode>();
    const lines: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) {
        continue;
      }
      const cells = row.getChildren<TableCellNode>();
      const cellTexts = cells.map((cell) =>
        escapePipeContent(cell.getTextContent())
      );
      lines.push(`| ${cellTexts.join(" | ")} |`);

      if (i === 0) {
        const separator = cells.map(() => "---").join(" | ");
        lines.push(`| ${separator} |`);
      }
    }

    return lines.join("\n");
  },
  handleImportAfterStartMatch: ({
    lines,
    rootNode,
    startLineIndex,
    startMatch,
  }) => {
    const headerLine = startMatch[0];

    const separatorLine = lines[startLineIndex + 1];
    if (!separatorLine || !TABLE_SEPARATOR_REGEX.test(separatorLine)) {
      return null;
    }

    const headerCells = parsePipeCells(headerLine);

    const dataRows: string[][] = [];
    let lastLineIndex = startLineIndex + 1;

    for (let i = startLineIndex + 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !TABLE_ROW_REGEX.test(line)) {
        break;
      }
      dataRows.push(parsePipeCells(line));
      lastLineIndex = i;
    }

    const tableNode = buildTableNode(headerCells, dataRows);
    rootNode.append(tableNode);

    return [true, lastLineIndex];
  },
  regExpEnd: {
    optional: true,
    regExp: TABLE_ROW_REGEX,
  },
  regExpStart: TABLE_ROW_REGEX,
  // biome-ignore lint/suspicious/noEmptyBlockStatements: Handled by handleImportAfterStartMatch
  replace: () => {},
  type: "multiline-element",
};

function isMultilineTransformer(
  transformer: Transformer
): transformer is MultilineElementTransformer {
  return transformer.type === "multiline-element";
}

const filteredTransformers = TRANSFORMERS.filter((transformer: Transformer) => {
  if (
    isMultilineTransformer(transformer) &&
    transformer.dependencies?.some((dep) => dep.getType?.() === "code")
  ) {
    return false;
  }
  return true;
});

export const EDITOR_TRANSFORMERS = [
  ...filteredTransformers,
  HORIZONTAL_RULE,
  KIBO_CODE_BLOCK,
  TABLE_MARKDOWN,
];
