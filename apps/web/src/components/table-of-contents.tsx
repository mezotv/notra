"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import type { TOCItemType } from "fumadocs-core/toc";

interface TableOfContentsProps {
  toc: TOCItemType[];
  headings?: number[];
}

interface TocNode {
  item: TOCItemType;
  children: TocNode[];
}

const DEFAULT_HEADINGS = [1, 2, 3, 4];

function buildTree(items: TOCItemType[]): TocNode[] {
  const root: TocNode[] = [];
  const stack: TocNode[] = [];

  for (const item of items) {
    const node: TocNode = { item, children: [] };

    let parent = stack.at(-1);
    while (parent && parent.item.depth >= item.depth) {
      stack.pop();
      parent = stack.at(-1);
    }

    if (parent) {
      parent.children.push(node);
    } else {
      root.push(node);
    }

    stack.push(node);
  }

  return root;
}

function TocList({ nodes }: { nodes: TocNode[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {nodes.map((node) => (
        <li key={node.item.url}>
          <a
            className="block font-sans text-muted-foreground text-sm transition-colors hover:text-foreground"
            href={node.item.url}
          >
            {node.item.title}
          </a>
          {node.children.length > 0 && (
            <div className="mt-1 border-muted-foreground/20 border-l pl-3">
              <TocList nodes={node.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function TableOfContents({
  toc,
  headings = DEFAULT_HEADINGS,
}: TableOfContentsProps) {
  const filtered = toc.filter((item) => headings.includes(item.depth));

  if (filtered.length === 0) {
    return null;
  }

  const tree = buildTree(filtered);

  return (
    <Collapsible className="not-prose mb-8" defaultOpen={false}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 font-sans font-semibold text-foreground text-sm">
        <HugeiconsIcon
          className="size-3.5 text-muted-foreground transition-transform [[data-panel-open]_&]:rotate-180"
          icon={ArrowDown01Icon}
        />
        On this page
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 pl-5.5" keepMounted>
        <TocList nodes={tree} />
      </CollapsibleContent>
    </Collapsible>
  );
}
