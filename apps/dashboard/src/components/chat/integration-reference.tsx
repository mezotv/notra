import { CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ContextItem } from "@notra/ai/types/chat";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { McpIcon } from "@/components/integrations/mcp-icon";
import { INTEGRATION_REFERENCE_TOKEN_SPLIT_REGEX } from "@/constants/integration-reference";
import type { McpIconUrls } from "@/types/integrations/mcp";
import {
  getIntegrationReferenceValue,
  getReferenceDisplay,
  parseReferenceValue,
} from "@/utils/integration-reference";

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

const REFERENCE_MCP_ICON_WRAPPER_CLASS =
  "inline-flex size-[1.04em] shrink-0 items-center justify-center text-violet-600 dark:text-violet-400";

type ReferenceKind = "github" | "linear" | "mcp";

const GITHUB_ICON_MARKUP = renderToStaticMarkup(
  <Github className="size-full" />
);
const LINEAR_ICON_MARKUP = renderToStaticMarkup(
  <Linear className="size-full" />
);
const MCP_ICON_MARKUP = renderToStaticMarkup(
  <HugeiconsIcon className="size-full" icon={CpuIcon} />
);

function getReferenceKind(item: ContextItem): ReferenceKind {
  if (item.type === "github-repo") {
    return "github";
  }
  return item.type === "linear-team" ? "linear" : "mcp";
}

function getReferenceIconWrapperClass(kind: ReferenceKind): string {
  if (kind === "github") {
    return REFERENCE_GITHUB_ICON_WRAPPER_CLASS;
  }
  return kind === "linear"
    ? REFERENCE_LINEAR_ICON_WRAPPER_CLASS
    : REFERENCE_MCP_ICON_WRAPPER_CLASS;
}

function getReferenceIconMarkup(kind: ReferenceKind): string {
  if (kind === "github") {
    return GITHUB_ICON_MARKUP;
  }
  return kind === "linear" ? LINEAR_ICON_MARKUP : MCP_ICON_MARKUP;
}

function appendReferenceData(span: HTMLSpanElement, item: ContextItem): void {
  if (item.type === "github-repo") {
    span.dataset.kind = "github";
    span.dataset.owner = item.owner;
    span.dataset.repo = item.repo;
    span.dataset.integrationId = item.integrationId;
    return;
  }

  if (item.type === "mcp-server") {
    span.dataset.kind = "mcp";
    span.dataset.integrationId = item.integrationId;
    span.dataset.name = item.name;
    return;
  }

  span.dataset.kind = "linear";
  span.dataset.integrationId = item.integrationId;
  if (item.teamName) {
    span.dataset.teamName = item.teamName;
  }
}

function createReferenceIcon(
  kind: ReferenceKind,
  mcpIcon?: McpIconUrls
): HTMLSpanElement {
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.className = getReferenceIconWrapperClass(kind);

  const lightLogo = mcpIcon?.lightUrl ?? mcpIcon?.darkUrl;
  const darkLogo = mcpIcon?.darkUrl ?? mcpIcon?.lightUrl;
  if (kind === "mcp" && lightLogo && darkLogo) {
    const lightImage = document.createElement("img");
    lightImage.alt = "";
    lightImage.className = "size-full rounded-sm object-contain dark:hidden";
    lightImage.src = lightLogo;

    const darkImage = document.createElement("img");
    darkImage.alt = "";
    darkImage.className =
      "hidden size-full rounded-sm object-contain dark:block";
    darkImage.src = darkLogo;

    let didFallback = false;
    const showFallbackIcon = () => {
      if (didFallback) {
        return;
      }
      didFallback = true;
      icon.innerHTML = MCP_ICON_MARKUP;
    };
    lightImage.addEventListener("error", showFallbackIcon, { once: true });
    darkImage.addEventListener("error", showFallbackIcon, { once: true });

    icon.append(lightImage, darkImage);
    return icon;
  }

  icon.innerHTML = getReferenceIconMarkup(kind);
  return icon;
}

function ReferenceIcon({
  kind,
  mcpIcon,
}: {
  kind: ReferenceKind;
  mcpIcon?: McpIconUrls;
}) {
  const iconWrapperClass = getReferenceIconWrapperClass(kind);

  if (kind === "mcp" && (mcpIcon?.lightUrl || mcpIcon?.darkUrl)) {
    return (
      <span aria-hidden="true" className={iconWrapperClass}>
        <McpIcon
          className="size-full"
          darkUrl={mcpIcon.darkUrl}
          lightUrl={mcpIcon.lightUrl}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={iconWrapperClass}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static inline svg markup for editor reference chips.
      dangerouslySetInnerHTML={{ __html: getReferenceIconMarkup(kind) }}
    />
  );
}

export function buildIntegrationReferenceElement(
  item: ContextItem,
  mcpIcon?: McpIconUrls
): HTMLSpanElement {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.className = REFERENCE_CONTAINER_CLASS;
  span.setAttribute(REFERENCE_ATTR, "true");
  span.dataset.value = getIntegrationReferenceValue(item);
  appendReferenceData(span, item);

  const icon = createReferenceIcon(getReferenceKind(item), mcpIcon);
  const label = document.createElement("span");
  label.className = REFERENCE_LABEL_CLASS;
  label.textContent = getReferenceDisplay(item);

  span.append(icon, label);
  return span;
}

export function hydrateLinearReferenceTeamNames(
  root: HTMLElement,
  teams: ReadonlyArray<{ integrationId: string; teamName?: string | null }>
): boolean {
  let changed = false;
  const chips = root.querySelectorAll<HTMLElement>(
    INTEGRATION_REFERENCE_SELECTOR
  );

  for (const chip of chips) {
    if (chip.dataset.kind !== "linear" || chip.dataset.teamName) {
      continue;
    }
    const team = teams.find(
      (candidate) => candidate.integrationId === chip.dataset.integrationId
    );
    if (!team?.teamName) {
      continue;
    }
    chip.dataset.teamName = team.teamName;
    const label = chip.lastElementChild;
    if (label instanceof HTMLElement) {
      label.textContent = getReferenceDisplay({
        type: "linear-team",
        integrationId: team.integrationId,
        teamName: team.teamName,
      });
    }
    changed = true;
  }

  return changed;
}

export function hydrateMcpReferenceIcons(
  root: HTMLElement,
  iconsByIntegrationId: ReadonlyMap<string, McpIconUrls>
): boolean {
  let changed = false;
  const chips = root.querySelectorAll<HTMLElement>(
    INTEGRATION_REFERENCE_SELECTOR
  );

  for (const chip of chips) {
    if (chip.dataset.kind !== "mcp") {
      continue;
    }
    const integrationId = chip.dataset.integrationId;
    if (!integrationId) {
      continue;
    }
    const iconUrls = iconsByIntegrationId.get(integrationId);
    if (!(iconUrls?.lightUrl || iconUrls?.darkUrl)) {
      continue;
    }
    chip.firstElementChild?.replaceWith(createReferenceIcon("mcp", iconUrls));
    changed = true;
  }

  return changed;
}

export function buildFragmentFromReferencedText(
  text: string,
  mcpIconsByIntegrationId?: ReadonlyMap<string, McpIconUrls>
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const segments = text.split(INTEGRATION_REFERENCE_TOKEN_SPLIT_REGEX);

  for (const segment of segments) {
    if (!segment) {
      continue;
    }

    const referenceItem = parseReferenceValue(segment);
    if (referenceItem) {
      const mcpIcon =
        referenceItem.type === "mcp-server"
          ? mcpIconsByIntegrationId?.get(referenceItem.integrationId)
          : undefined;
      fragment.append(buildIntegrationReferenceElement(referenceItem, mcpIcon));
      continue;
    }

    const lines = segment.split("\n");
    lines.forEach((line, index) => {
      if (line) {
        fragment.append(document.createTextNode(line));
      }
      if (index < lines.length - 1) {
        fragment.append(document.createElement("br"));
      }
    });
  }

  return fragment;
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
  if (kind === "mcp") {
    const { integrationId, name } = el.dataset;
    if (!(integrationId && name)) {
      return null;
    }
    return { type: "mcp-server", integrationId, name };
  }
  return null;
}

export function renderTextWithIntegrationReferences(
  text: string,
  mcpIconsByIntegrationId?: ReadonlyMap<string, McpIconUrls>
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let keySeed = 0;
  const segments = text.split(INTEGRATION_REFERENCE_TOKEN_SPLIT_REGEX);

  segments.forEach((segment, segmentIndex) => {
    if (!segment) {
      return;
    }

    const referenceItem = parseReferenceValue(segment);
    if (referenceItem) {
      const mcpIcon =
        referenceItem.type === "mcp-server"
          ? mcpIconsByIntegrationId?.get(referenceItem.integrationId)
          : undefined;
      nodes.push(
        <IntegrationReference
          display={getReferenceDisplay(referenceItem)}
          key={`ref-${segment}-${keySeed++}`}
          kind={getReferenceKind(referenceItem)}
          mcpIcon={mcpIcon}
          value={getIntegrationReferenceValue(referenceItem)}
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
  mcpIcon?: McpIconUrls;
}

function IntegrationReference({
  value,
  display,
  kind,
  mcpIcon,
}: IntegrationReferenceProps) {
  return (
    <span
      className={REFERENCE_CONTAINER_CLASS}
      contentEditable={false}
      data-integration-reference="true"
      data-value={value}
    >
      <ReferenceIcon kind={kind} mcpIcon={mcpIcon} />
      <span className={REFERENCE_LABEL_CLASS}>{display}</span>
    </span>
  );
}
