import type { ContextItem } from "@notra/ai/types/chat";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const REFERENCE_ATTR = "data-integration-reference";

export const INTEGRATION_REFERENCE_SELECTOR =
  "[data-integration-reference='true']";

const REFERENCE_CONTAINER_CLASS =
  "chat-integration-reference inline-flex cursor-text select-text items-center gap-[0.48em] whitespace-nowrap rounded-md border border-dashed border-foreground/30 bg-background px-[0.68em] py-[0.28em] align-middle text-[0.88em] text-foreground leading-[1.15]";

const REFERENCE_LABEL_CLASS =
  "inline-flex items-center font-normal tracking-[-0.01em] text-foreground leading-none";

const REFERENCE_GITHUB_ICON_WRAPPER_CLASS =
  "inline-flex size-[1.08em] shrink-0 items-center justify-center text-foreground";

const REFERENCE_LINEAR_ICON_WRAPPER_CLASS =
  "inline-flex size-[1.04em] shrink-0 items-center justify-center text-indigo-500 dark:text-indigo-400";

type ReferenceKind = "github" | "linear";

const GITHUB_ICON_MARKUP = renderToStaticMarkup(
  <Github className="size-full" />
);
const LINEAR_ICON_MARKUP = renderToStaticMarkup(
  <Linear className="size-full" />
);
const GITHUB_REFERENCE_VALUE_PATTERN =
  /^@?integration\/github\/([^/\s]+)\/([^/\s]+)\/([^/\s]+)$/;
const LINEAR_REFERENCE_VALUE_PATTERN = /^@?integration\/linear\/([^/\s]+)$/;

function getReferenceKind(item: ContextItem): ReferenceKind {
  return item.type === "github-repo" ? "github" : "linear";
}

function getReferenceIconWrapperClass(kind: ReferenceKind): string {
  return kind === "github"
    ? REFERENCE_GITHUB_ICON_WRAPPER_CLASS
    : REFERENCE_LINEAR_ICON_WRAPPER_CLASS;
}

function getReferenceIconMarkup(kind: ReferenceKind): string {
  if (kind === "github") {
    return GITHUB_ICON_MARKUP;
  }

  return LINEAR_ICON_MARKUP;
}

function appendReferenceData(span: HTMLSpanElement, item: ContextItem): void {
  if (item.type === "github-repo") {
    span.dataset.kind = "github";
    span.dataset.owner = item.owner;
    span.dataset.repo = item.repo;
    span.dataset.integrationId = item.integrationId;
    return;
  }

  span.dataset.kind = "linear";
  span.dataset.integrationId = item.integrationId;
  if (item.teamName) {
    span.dataset.teamName = item.teamName;
  }
}

function createReferenceIcon(kind: ReferenceKind): HTMLSpanElement {
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.className = getReferenceIconWrapperClass(kind);
  icon.innerHTML = getReferenceIconMarkup(kind);
  return icon;
}

function ReferenceIcon({ kind }: { kind: ReferenceKind }) {
  const iconWrapperClass = getReferenceIconWrapperClass(kind);

  return (
    <span
      aria-hidden="true"
      className={iconWrapperClass}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static inline svg markup for editor reference chips.
      dangerouslySetInnerHTML={{ __html: getReferenceIconMarkup(kind) }}
    />
  );
}

function getReferenceValue(item: ContextItem): string {
  if (item.type === "github-repo") {
    return `@integration/github/${item.integrationId}/${item.owner}/${item.repo}`;
  }
  return `@integration/linear/${item.integrationId}`;
}

export function getReferenceDisplay(item: ContextItem): string {
  if (item.type === "github-repo") {
    return `@${item.owner}/${item.repo}`;
  }
  return `@${item.teamName ?? "Linear"}`;
}

export function buildIntegrationReferenceElement(
  item: ContextItem
): HTMLSpanElement {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.className = REFERENCE_CONTAINER_CLASS;
  span.setAttribute(REFERENCE_ATTR, "true");
  span.dataset.value = getReferenceValue(item);
  appendReferenceData(span, item);

  const icon = createReferenceIcon(getReferenceKind(item));
  const label = document.createElement("span");
  label.className = REFERENCE_LABEL_CLASS;
  label.textContent = getReferenceDisplay(item);

  span.append(icon, label);
  return span;
}

export function parseIntegrationReferenceElement(
  el: HTMLElement
): ContextItem | null {
  const kind = el.dataset.kind;
  if (kind === "github") {
    const { owner, repo, integrationId } = el.dataset;
    if (!(owner && repo && integrationId)) {
      return null;
    }
    return { type: "github-repo", owner, repo, integrationId };
  }
  if (kind === "linear") {
    const { integrationId, teamName } = el.dataset;
    if (!integrationId) {
      return null;
    }
    return { type: "linear-team", integrationId, teamName };
  }
  return null;
}

export function parseReferenceValue(value: string): ContextItem | null {
  const trimmed = value.trim();

  const githubMatch = trimmed.match(GITHUB_REFERENCE_VALUE_PATTERN);
  if (githubMatch) {
    const [, integrationId, owner, repo] = githubMatch;
    if (integrationId && owner && repo) {
      return { type: "github-repo", integrationId, owner, repo };
    }
  }

  const linearMatch = trimmed.match(LINEAR_REFERENCE_VALUE_PATTERN);
  if (linearMatch) {
    const [, integrationId] = linearMatch;
    if (integrationId) {
      return { type: "linear-team", integrationId };
    }
  }

  return null;
}

export function renderTextWithIntegrationReferences(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let keySeed = 0;
  const segments = text.split(
    /(@?integration\/(?:github\/[^/\s]+\/[^/\s]+\/[^/\s]+|linear\/[^/\s]+))/g
  );

  segments.forEach((segment, segmentIndex) => {
    if (!segment) {
      return;
    }

    const referenceItem = parseReferenceValue(segment);
    if (referenceItem) {
      nodes.push(
        <IntegrationReference
          display={getReferenceDisplay(referenceItem)}
          key={`ref-${segment}-${keySeed++}`}
          kind={getReferenceKind(referenceItem)}
          value={getReferenceValue(referenceItem)}
        />
      );
      return;
    }

    const lines = segment.split("\n");
    lines.forEach((line, lineIndex) => {
      if (line) {
        nodes.push(
          <Fragment key={`text-${line}-${keySeed++}`}>{line}</Fragment>
        );
      }

      if (lineIndex < lines.length - 1) {
        nodes.push(<br key={`br-${segmentIndex}-${keySeed++}`} />);
      }
    });
  });

  return nodes;
}

export function isIntegrationReferenceElement(
  node: ChildNode | Node | null | undefined
): node is HTMLElement {
  return node instanceof HTMLElement && node.hasAttribute(REFERENCE_ATTR);
}

export function serializeEditorWithReferences(editor: HTMLElement): string {
  return serializeNodesWithReferences(Array.from(editor.childNodes));
}

export function serializeFragmentWithReferences(
  fragment: DocumentFragment
): string {
  return serializeNodesWithReferences(Array.from(fragment.childNodes));
}

function serializeNodesWithReferences(nodes: Node[]): string {
  let out = "";
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const el = node as HTMLElement;
    if (el.hasAttribute(REFERENCE_ATTR)) {
      out += el.dataset.value ?? el.textContent ?? "";
      return;
    }
    if (el.tagName === "BR") {
      out += "\n";
      return;
    }
    for (const child of Array.from(el.childNodes)) {
      walk(child);
    }
  };
  for (const child of nodes) {
    walk(child);
  }
  return out.replace(/\u00A0/g, " ");
}

interface IntegrationReferenceProps {
  value: string;
  display: string;
  kind: ReferenceKind;
}

function IntegrationReference({
  value,
  display,
  kind,
}: IntegrationReferenceProps) {
  return (
    <span
      className={REFERENCE_CONTAINER_CLASS}
      contentEditable={false}
      data-integration-reference="true"
      data-value={value}
    >
      <ReferenceIcon kind={kind} />
      <span className={REFERENCE_LABEL_CLASS}>{display}</span>
    </span>
  );
}
