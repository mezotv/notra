"use client";

import { $isCodeNode, type CodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CODE_LANGUAGES: Record<string, string> = {
  "": "Plain Text",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  markdown: "Markdown",
  bash: "Bash",
  shell: "Shell",
};

interface CodeBlockToolbarProps {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
  nodeKey: string;
  language: string;
  anchorElem: HTMLElement;
  codeElement: HTMLElement;
}

function CodeBlockToolbar({
  editor,
  nodeKey,
  language,
  anchorElem,
  codeElement,
}: CodeBlockToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  const updatePosition = useCallback(() => {
    const toolbar = toolbarRef.current;
    if (!(toolbar && codeElement)) {
      return;
    }

    const codeRect = codeElement.getBoundingClientRect();
    const anchorRect = anchorElem.getBoundingClientRect();

    toolbar.style.top = `${codeRect.top - anchorRect.top - 8}px`;
    toolbar.style.right = `${anchorRect.right - codeRect.right + 8}px`;
  }, [anchorElem, codeElement]);

  // Sync position with scroll/resize - legitimate external subscription
  useEffect(() => {
    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  // Cleanup timeout ref on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleLanguageChange = useCallback(
    (newLanguage: string | null) => {
      if (newLanguage === null) return;
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCodeNode(node)) {
          node.setLanguage(newLanguage === "plain" ? "" : newLanguage);
        }
      });
    },
    [editor, nodeKey]
  );

  const handleCopy = useCallback(() => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      return;
    }

    editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCodeNode(node)) {
        const text = node.getTextContent();
        navigator.clipboard.writeText(text).catch(() => {
          // Handle clipboard write failure silently
        });
        setCopied(true);

        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopied(false);
          copyTimeoutRef.current = null;
        }, 2000);
      }
    });
  }, [editor, nodeKey]);

  const Icon = copied ? CheckIcon : CopyIcon;

  return createPortal(
    <div
      className="absolute z-50 flex items-center gap-1"
      ref={toolbarRef}
      style={{ pointerEvents: "auto" }}
    >
      <Select onValueChange={handleLanguageChange} value={language || "plain"}>
        <SelectTrigger
          aria-label="Select code language"
          className="h-7 w-fit gap-1 border bg-popover text-muted-foreground text-xs shadow-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CODE_LANGUAGES).map(([key, label]) => (
            <SelectItem key={key} value={key || "plain"}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        aria-label={copied ? "Code copied" : "Copy code to clipboard"}
        className="h-7 shrink-0 border bg-popover text-muted-foreground hover:bg-muted"
        onClick={handleCopy}
        size="icon"
        variant="ghost"
      >
        <Icon
          className={copied ? "text-green-500" : "text-muted-foreground"}
          size={14}
        />
      </Button>
    </div>,
    anchorElem
  );
}

interface ActiveCodeBlock {
  nodeKey: string;
  language: string;
  element: HTMLElement;
}

function findCodeNodeFromRangeSelection(
  selection: ReturnType<typeof $getSelection>,
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): ActiveCodeBlock | null {
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const anchorNode = selection.anchor.getNode();
  const parent = anchorNode.getParent();

  let codeNode: CodeNode | null = null;
  if ($isCodeNode(parent)) {
    codeNode = parent;
  } else if (parent) {
    const grandparent = parent.getParent();
    if ($isCodeNode(grandparent)) {
      codeNode = grandparent;
    }
  }

  if (!codeNode) {
    return null;
  }

  const nodeKey = codeNode.getKey();
  const language = codeNode.getLanguage() || "";
  const element = editor.getElementByKey(nodeKey);

  if (!element) {
    return null;
  }

  return { nodeKey, language, element };
}

function findCodeNodeFromNodeSelection(
  selection: ReturnType<typeof $getSelection>,
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): ActiveCodeBlock | null {
  if (!$isNodeSelection(selection)) {
    return null;
  }

  const nodes = selection.getNodes();
  if (nodes.length !== 1 || !$isCodeNode(nodes[0])) {
    return null;
  }

  const codeNode = nodes[0];
  const nodeKey = codeNode.getKey();
  const language = codeNode.getLanguage() || "";
  const element = editor.getElementByKey(nodeKey);

  if (!element) {
    return null;
  }

  return { nodeKey, language, element };
}

interface CodeBlockPluginProps {
  anchorElem: HTMLElement;
}

export function CodeBlockPlugin({ anchorElem }: CodeBlockPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [activeCodeBlock, setActiveCodeBlock] =
    useState<ActiveCodeBlock | null>(null);

  const updateActiveCodeBlock = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      const fromRange = findCodeNodeFromRangeSelection(selection, editor);
      if (fromRange) {
        setActiveCodeBlock(fromRange);
        return;
      }

      const fromNode = findCodeNodeFromNodeSelection(selection, editor);
      if (fromNode) {
        setActiveCodeBlock(fromNode);
        return;
      }

      setActiveCodeBlock(null);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateActiveCodeBlock();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateActiveCodeBlock]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateActiveCodeBlock();
      });
    });
  }, [editor, updateActiveCodeBlock]);

  if (!activeCodeBlock) {
    return null;
  }

  return (
    <CodeBlockToolbar
      anchorElem={anchorElem}
      codeElement={activeCodeBlock.element}
      editor={editor}
      language={activeCodeBlock.language}
      nodeKey={activeCodeBlock.nodeKey}
    />
  );
}
